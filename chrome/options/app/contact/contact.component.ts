import { Component, OnInit } from '@angular/core';

const EXTENSION_URL = "https://chrome.google.com/webstore/detail/click2speech/djfpbemmcokhlllnafdmomgecdlicfhj";

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html'
})
export class ContactComponent implements OnInit {

  readonly REVIEWS_URL = EXTENSION_URL + "/reviews";
  readonly EMAIL = "nagydotzsoltdothunatgmaildotcom".replace(/dot/g, ".").replace(/at/g, "@");    // obfuscate against spammers
  readonly EMAIL_URL = "mailto:" + this.EMAIL + "?subject=click2speech question";

  private backgroundCommunicationPort: chrome.runtime.Port;

  constructor() { }

  ngOnInit() {
    this.backgroundCommunicationPort = chrome.runtime.connect();
  }

  sendAnalytics(interaction: string) {
    this.backgroundCommunicationPort.postMessage({ action: "contactInteraction", interaction });
  }

}
