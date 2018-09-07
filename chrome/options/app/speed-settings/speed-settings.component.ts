import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-speed-settings',
  templateUrl: './speed-settings.component.html',
  styleUrls: ['./speed-settings.component.css']
})
export class SpeedSettingsComponent implements OnInit {

  readonly MIN = 0.5;
  readonly MAX = 4;
  readonly STEP = 0.1;

  speed = 0;

  constructor(private changeDetectionRef: ChangeDetectorRef) { }

  ngOnInit() {
    chrome.storage.local.get(null, settings => {
      this.speed = settings.speed;
      this.changeDetectionRef.detectChanges();
    });
  }

  update(input: string) {
    this.speed = parseFloat(input);
    chrome.storage.local.set({ speed: this.speed });
  }
}
