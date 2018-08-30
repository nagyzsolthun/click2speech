import { Component, OnInit } from '@angular/core';
import compareVoices from './compareVoices';

type Voice = { name: string, lan: string, selected: boolean, disabled: boolean };
type VoiceSettings = { preferredVoice: string }

@Component({
  selector: 'app-voice-settings',
  templateUrl: './voice-settings.component.html',
  styleUrls: ['./voice-settings.component.css']
})
export class VoiceSettingsComponent implements OnInit {

  private port = chrome.runtime.connect();
  voices = new Array<Voice>();

  constructor() { }

  ngOnInit() {
    const settingsPromise = new Promise(resolve => chrome.storage.local.get(null, resolve));
    const chromeVoicesPromise = new Promise(resolve => chrome.tts.getVoices(resolve));
    const disabledVoicesPromise = new Promise(resolve => {
      this.port.postMessage({ action: "getDisabledVoices" });
      this.port.onMessage.addListener(message => {
        if (message.action == "updateDisabledVoices") resolve(message.disabledVoices)
      });
    });

    Promise
      .all([settingsPromise, chromeVoicesPromise, disabledVoicesPromise])
      .then(values => {
        const settings = values[0] as VoiceSettings;
        const chromeVoices = values[1] as Array<chrome.tts.TtsVoice>;
        const disabledVoices = values[2] as Array<string>;

        chromeVoices.sort(compareVoices);
        chromeVoices.reverse();
        chromeVoices.forEach(voice => this.voices.push({
          name: voice.voiceName,
          lan: voice.lang,
          selected: settings.preferredVoice == voice.voiceName,
          disabled: disabledVoices.includes(voice.voiceName),
        }));
      });
  }

  select(voiceName: string) {
    this.voices.forEach(voice => voice.selected = false);
    var voiceToUpdate = this.voices.find(voice => voice.name == voiceName);
    voiceToUpdate.selected = !voiceToUpdate.selected;
    chrome.storage.local.set({ preferredVoice: voiceName });
  }

}
