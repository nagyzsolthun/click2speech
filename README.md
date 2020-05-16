# click2speech
Chrome and Firefox extension to help the visually impaired and those with dyslexia. Click on a text and click2speech reads it out to you.

## no voice available
Potential fixes:
1. voices can be installed for Chrome, e.g. [US English voice from Google](https://chrome.google.com/webstore/detail/us-english-female-text-to/pkidpnnapnfgjhfhkpmjpbckkbaodldb) (seem to be Windows only)
1. if using Linux, try Firefox instead of Chromium. Firefox supports `espeak` if installed.

## build
1. `build.sh` builds the extension

## options local run
1. `cd chrome/options`
1. `mv src/modules src/modules-backup`
1. `mv src/modules-dev src/modules`
1. `npm start`