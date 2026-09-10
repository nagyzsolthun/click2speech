# click2speech
Chrome and Firefox extension to help the visually impaired and those with dyslexia. Click on a text and click2speech reads it out to you.

## no voice available
Potential fixes:
1. voices can be installed for Chrome, e.g. [US English voice from Google](https://chrome.google.com/webstore/detail/us-english-female-text-to/pkidpnnapnfgjhfhkpmjpbckkbaodldb) (seem to be Windows only)
1. if using Linux, try Firefox instead of Chromium. Firefox supports `espeak` if installed.

## build
1. Use Node.js 22.12+ (tested with 22.22.1).
1. `bash build.sh` installs locked dependencies, tests, builds, and packages the extension.

## options local run
1. `cd chrome/options`
1. `npm ci`
1. `npm start`

Vite uses the mock extension APIs in `src/modules-dev` for the standalone preview.
Production builds use `src/modules` and package every script locally for MV3.

## submissions
* https://chrome.google.com/webstore/devconsole
* https://addons.mozilla.org/en-US/firefox/
* https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview


# firefox ubuntu
https://stackoverflow.com/questions/46617366/speechsynthesis-getvoices-not-listing-voices-in-firefox/72388612#72388612
1. list speech-dispatcher modules `spd-say -O`
1. list voices in the default module: `spd-say -L`

1. verify speech-dispatcher is functional: `spd-say "Hello World"`
  * if not `sudo apt install speech-dispatcher`
1. `espeak "Hello World"`
1. `echo "Hello World" | festival --tts`

## Manifest V3

The same `build/` package runs in Chrome 121+ and Firefox 128+. The manifest
contains both `background.service_worker` and `background.scripts`; each browser
uses its supported background environment ([MDN background documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)). There are no browser-specific builds.

Both browsers use the same `SpeechSynthesisUtterance` engine, voice selection,
word highlighting, and navigation sound. The host loads `background/speech.html`
in an offscreen document where required, or a hidden frame in a background
document where available. Extension API calls go through a runtime message bridge.
Content scripts reconnect on the next reading interaction after background shutdown.

Build with `bash build.sh` (Node.js 22 works). Load `build/` unpacked at
`chrome://extensions`, or load `build/manifest.json` temporarily from Firefox's
`about:debugging#/runtime/this-firefox`. Allow site access for pages you want read.
Firefox ignores the Chrome-only `offscreen` permission; Chrome ignores Firefox's
background scripts and browser-specific settings. The Firefox add-on ID is
preserved from the existing Mozilla listing.

Run automated checks with `npm test --prefix chrome/background -- --runInBand`.
The manual checklist in `testing` includes background shutdown and recovery checks.


## Dependency maintenance

The options page uses Vite instead of [deprecated Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app), React 19,
Material UI 9, and React Router 7. Both packages use Mozilla's
`webextension-polyfill` with `@types/webextension-polyfill` instead of the
[retired TypeScript wrapper](https://github.com/Lusito/webextension-polyfill-ts). TypeScript is pinned to 6.0.3 because the current
`ts-jest` supports TypeScript below 7. Node typings track the tested Node 22 line.
Unused Babel/file-loader tooling and the unused options service worker were removed.

## Browser integration tests

Build first. These tests use isolated browser profiles and real installed speech
voices; they do not replace the speech engine. They produce audible speech and
run for about 80 seconds each. Run them sequentially because they share the OS
speech service. Do not point them at your personal browser profile.

Firefox: start `geckodriver --port 4446 --allow-system-access`, then run
`node tests/firefox.mjs`. Set `FIREFOX_BINARY` if Firefox is not at the Ubuntu
Snap path; set `SPEECHD_ADDRESS` to your Speech Dispatcher socket on Linux.
`WEBDRIVER_URL` overrides the driver URL, and `HEADLESS=1` runs without a window.
The test checks real page clicks, speech start/end, reading beyond 60 seconds,
toggle/tab-close cancellation, saved speed, and forced background recovery.

Chromium: launch with a temporary `--user-data-dir`, `--remote-debugging-port=9224`,
`--load-extension=/absolute/path/to/click2speech/build`, and on Linux
`--enable-speech-dispatcher`. Run `node tests/chromium.mjs`; `CDP_URL` overrides
the debugging URL. The test enables developer mode in that isolated profile,
checks real speech when voices exist (otherwise the no-voice error), reading
beyond 60 seconds, toggle cancellation, offscreen recreation, worker recovery,
and the options page. Close the isolated Chromium instance afterward.

The Linux Speech Dispatcher voices used in testing emit start/end but no word
boundaries. Boundary forwarding has unit coverage; visually verifying individual
word highlighting still requires a voice that supplies boundary events.
