// Launch Chromium with --remote-debugging-port=9224, an isolated profile,
// --load-extension=<absolute build path> and (Linux) --enable-speech-dispatcher.
import assert from 'node:assert/strict';
const endpoint = process.env.CDP_URL || 'http://127.0.0.1:9224';
const delay = ms => new Promise(r=>setTimeout(r,ms));
const targets = await (await fetch(endpoint+'/json/list')).json();
const ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}});
const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
  const requestId=++id;
  const timer=setTimeout(()=>{pending.delete(requestId);reject(Error(method+' timed out'));},20000);
  pending.set(requestId,m=>{clearTimeout(timer);resolve(m);});
  ws.send(JSON.stringify({id:requestId,method,params,sessionId}));
});
async function evaluate(expression) {
  const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.error || result.result?.exceptionDetails) throw new Error(JSON.stringify(result));
  return result.result.result.value;
}
try {
  await call('Page.navigate',{url:'chrome://extensions'});await delay(500);
  await evaluate(`new Promise(r=>chrome.developerPrivate.updateProfileConfiguration({inDeveloperMode:true},r))`);
  const extensions = await evaluate(`new Promise(r=>chrome.developerPrivate.getExtensionsInfo({includeDisabled:true},x=>r(x.map(({id,name})=>({id,name})))))`);
  const extension = extensions.find(e=>e.name==='click2speech');assert.ok(extension,'Load the unpacked build before testing');
  await evaluate(`new Promise(r=>chrome.management.setEnabled(${JSON.stringify(extension.id)},true,r))`);
  await evaluate(`new Promise(r=>chrome.developerPrivate.reload(${JSON.stringify(extension.id)},{},r))`);
  await delay(500);
  await call('Page.navigate',{url:`chrome-extension://${extension.id}/options/index.html`});await delay(500);
  assert.match(await evaluate('document.body.innerText'),/Text Selection/);
  const voices=await evaluate(`chrome.runtime.sendMessage('getVoices')`);
  console.log('Chromium real voices:',voices.length, voices.slice(0,3));
  await evaluate('chrome.storage.local.set({turnedOn:true,speed:1.2})');
  async function speak(text, name, timeout=15000) {
    return evaluate(`new Promise((resolve,reject)=>{
      const port=chrome.runtime.connect({name:'click2speech'}),events=[];
      const timer=setTimeout(()=>{port.disconnect();reject(Error('Speech timeout'));},${timeout});
      port.onMessage.addListener(m=>{events.push(m);if(m.settings)port.postMessage({id:${JSON.stringify(name)},text:${JSON.stringify(text)}});
        if(m.speechEnd||m.speechError){clearTimeout(timer);port.disconnect();resolve(events);}
      });
    })`);
  }
  if(voices.length) {
    const events=await speak('Hello world. This is a real speech test.','real');
    assert.ok(events.some(e=>e.speechStart==='real'),JSON.stringify(events));
    assert.ok(events.some(e=>e.speechEnd==='real'),JSON.stringify(events));
    console.log('Real speech start/end passed; boundary events:',events.filter(e=>e.speechBoundary).length);
    await evaluate(`new Promise((resolve,reject)=>{
      globalThis.longPort=chrome.runtime.connect({name:'click2speech'});globalThis.longEvents=[];
      const timer=setTimeout(()=>reject(Error('Long speech failed to start')),10000);
      longPort.onMessage.addListener(m=>{longEvents.push(m);if(m.settings)longPort.postMessage({id:'long',text:'This paragraph tests reading for more than sixty seconds. '.repeat(80)});if(m.speechStart){clearTimeout(timer);resolve(true);}});
    })`);
    console.log('Testing 65 seconds of uninterrupted Chromium speech');
    await delay(65000);
    assert.equal(await evaluate('longEvents.some(e=>e.speechEnd || e.speechError)'),false);
    assert.equal(await evaluate(`chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']}).then(contexts=>contexts.length)`),1);
    const allTargets=await call('Target.getTargets');
    const speechTarget=allTargets.result.targetInfos.find(t=>t.url.endsWith('/background/speech.html'));
    assert.ok(speechTarget,'Speech document must survive 65 seconds');
    const attached=await call('Target.attachToTarget',{targetId:speechTarget.targetId,flatten:true});
    const status=await call('Runtime.evaluate',{expression:'speechSynthesis.speaking',returnByValue:true},attached.result.sessionId);
    assert.equal(status.result.result.value,true,'Native speech must still be running');
    await call('Target.detachFromTarget',{sessionId:attached.result.sessionId});
    await evaluate('chrome.storage.local.set({turnedOn:false})');await delay(300);
    assert.equal(await evaluate(`longEvents.some(e=>e.speechEnd==='long')`),true);
    await evaluate('longPort.disconnect();chrome.storage.local.set({turnedOn:true})');
    console.log('Long speech and toggle cancellation passed');
  } else {
    const events=await speak('No voice available test.','no-voice');
    assert.ok(events.some(e=>e.speechError==='no-voice'));
    console.log('No-voice error passed (real speech unavailable in this Chromium build)');
  }
  const connect = `globalThis.testPort=chrome.runtime.connect({name:'click2speech'});`;
  assert.equal(await evaluate(`new Promise(resolve=>{${connect}testPort.onMessage.addListener(m=>{if(m.settings)testPort.postMessage({id:'empty',text:''});if(m.speechEnd)resolve(m.speechEnd);});})`),'empty');
  await evaluate('chrome.offscreen.closeDocument()');
  assert.equal(await evaluate(`new Promise(resolve=>{testPort.onMessage.addListener(m=>{if(m.speechEnd==='recreated')resolve(m.speechEnd);});testPort.postMessage({id:'recreated',text:''});})`),'recreated');
  await evaluate('testPort.disconnect()');
  await call('ServiceWorker.enable');await call('ServiceWorker.stopAllWorkers');await delay(300);
  assert.equal(await evaluate(`chrome.runtime.sendMessage('getBrowserName')`),'Chrome');
  console.log('Offscreen recreation and service-worker recovery passed');
  await call('Page.navigate',{url:`chrome-extension://${extension.id}/options/index.html#/speech`});await delay(1000);
  assert.match(await evaluate('document.body.innerText'),/speed/i);
  assert.equal(await evaluate('document.querySelector("img").naturalWidth > 0'),true);
  console.log('Options speech route and packaged logo passed');
} finally {
  await evaluate('globalThis.testPort?.disconnect();globalThis.longPort?.disconnect();').catch(()=>{});
  ws.close();
}
