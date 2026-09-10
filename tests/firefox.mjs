// Start geckodriver --port 4446 --allow-system-access, then run this file.
// Uses a temporary profile and the real OS speech engine; no speech mocks.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import http from 'node:http';
const base = process.env.WEBDRIVER_URL || 'http://127.0.0.1:4446';
const addonId = '{961b86e9-adc2-43bc-bc8c-aa99ea2a047b}';
const delay = ms => new Promise(r => setTimeout(r, ms));
async function request(path, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(base + path, { method, headers: {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(result));
  return result.value;
}
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end('<html lang="en"><body><p id="read" style="font-size:24px;width:600px">' + 'This paragraph tests reading text on a real web page. '.repeat(60) + '</p><input id="input"></body></html>');
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
let session;
try {
  session = (await request('/session', {capabilities:{alwaysMatch:{browserName:'firefox', 'moz:firefoxOptions':{
    binary: process.env.FIREFOX_BINARY || '/snap/firefox/current/usr/lib/firefox/firefox', args:process.env.HEADLESS === '1' ? ['-headless'] : [],
    env: {SPEECHD_ADDRESS: process.env.SPEECHD_ADDRESS || 'unix_socket:/run/user/1000/speech-dispatcher/speechd.sock'},
    prefs:{'extensions.webextensions.warnings-as-errors':false}
  }}}})).sessionId;
  const api = (path, body, method) => request('/session/' + session + path, body, method);
  const run = async script => {
    const result = await api('/execute/async', {script: `const done=arguments[arguments.length-1]; (async()=>{${script}})().then(done,e=>done({testError:e.stack}));`, args:[]});
    assert.ok(!result?.testError, result?.testError);
    return result;
  };
  await api('/moz/addon/install', {path:resolve('build'), temporary:true});
  await api('/moz/context', {context:'chrome'});
  const uuid = await run(`return JSON.parse(Services.prefs.getStringPref('extensions.webextensions.uuids'))[${JSON.stringify(addonId)}];`);
  await api('/moz/context', {context:'content'});
  await api('/url', {url:`moz-extension://${uuid}/options/index.html`});
  const options = await api('/window');
  const voices = await run(`return await browser.runtime.sendMessage('getVoices');`);
  assert.ok(voices.length, 'Install working OS speech voices before running this test');
  console.log('Available real voices:', voices.length);
  await run(`await browser.storage.local.set({turnedOn:true,hoverSelect:true,speed:1.2});`);
  assert.match(await run('return document.body.innerText;'), /Text Selection/);
  const events = await run(`return await new Promise((resolve,reject)=>{
    const port=browser.runtime.connect({name:'click2speech'}), messages=[];
    const timer=setTimeout(()=>{port.disconnect();reject(Error('Speech timed out'));},15000);
    port.onMessage.addListener(m=>{messages.push(m);if(m.settings)port.postMessage({id:'short',text:'Hello world. This is a speech test.'});
      if(m.speechEnd || m.speechError){clearTimeout(timer);port.disconnect();resolve(messages);}
    });
  });`);
  assert.ok(events.some(m => m.speechStart === 'short'), JSON.stringify(events));
  assert.ok(events.some(m => m.speechEnd === 'short'), JSON.stringify(events));
  console.log('Real speech start/end passed; boundary events:', events.filter(m => m.speechBoundary).length);
  // Observe native utterances while preserving the actual engine.
  await run(`const win=(await browser.runtime.getBackgroundPage()).frames[0];win.testEvents=[];const speak=win.speechSynthesis.speak.bind(win.speechSynthesis);win.speechSynthesis.speak=u=>{for(const type of ['start','end','error','boundary'])u.addEventListener(type,e=>win.testEvents.push({type,error:e.error,charIndex:e.charIndex}));speak(u);};`);
  const page = (await api('/window/new', {type:'tab'})).handle;
  await api('/window', {handle:page});
  await api('/url', {url:`http://127.0.0.1:${server.address().port}/`});
  await delay(500);
  const click = async () => {
    await api('/actions', {actions:[{type:'pointer',id:'mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',duration:100,x:100,y:40},{type:'pause',duration:200},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});
    await delay(1000);
  };
  await click();
  await api('/window', {handle:options});
  const state = await run(`const win=(await browser.runtime.getBackgroundPage()).frames[0];return {speaking:win.speechSynthesis.speaking,events:win.testEvents};`);
  assert.ok(state.speaking, JSON.stringify(state));
  assert.ok(state.events.some(e=>e.type==='start'), JSON.stringify(state));
  console.log('Real page click starts speech; testing 65 seconds of uninterrupted reading');
  await delay(65000);
  assert.equal(await run(`return (await browser.runtime.getBackgroundPage()).frames[0].speechSynthesis.speaking;`), true);
  console.log('Speech continues beyond background idle timeout');
  await run(`await browser.storage.local.set({turnedOn:false});`);
  await delay(300);
  assert.equal(await run(`return (await browser.runtime.getBackgroundPage()).frames[0].speechSynthesis.speaking;`), false);
  await run(`await browser.storage.local.set({turnedOn:true,speed:1.3});`);
  await api('/moz/context', {context:'chrome'});
  await run(`const {ExtensionParent}=ChromeUtils.importESModule('resource://gre/modules/ExtensionParent.sys.mjs');await ExtensionParent.GlobalManager.extensionMap.get(${JSON.stringify(addonId)}).terminateBackground({disableResetIdleForTest:true});`);
  await api('/moz/context', {context:'content'});
  await api('/window', {handle:page});
  await click();
  await api('/window', {handle:options});
  assert.equal(await run(`return (await browser.runtime.getBackgroundPage()).frames[0].speechSynthesis.speaking;`), true);
  assert.equal(await run(`return (await browser.storage.local.get('speed')).speed;`), 1.3);
  console.log('Toggle cancellation and forced background recovery passed');
  await api('/window', {handle:page});
  await api('/window', undefined, 'DELETE');
  await api('/window', {handle:options});
  await delay(300);
  assert.equal(await run(`return (await browser.runtime.getBackgroundPage()).frames[0].speechSynthesis.speaking;`), false);
  console.log('Closing reading tab cancels speech');
} finally {
  if (session) await request('/session/' + session, undefined, 'DELETE');
  server.close();
}
