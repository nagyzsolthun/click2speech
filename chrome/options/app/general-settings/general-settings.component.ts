import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.css']
})
export class GeneralSettingsComponent implements OnInit {

  selectionOptions = [
    { name: "hoverSelect", selected: false },
    { name: "arrowSelect", selected: false },
    { name: "browserSelect", selected: false },
  ];

  constructor(private changeDetectionRef: ChangeDetectorRef) { }

  ngOnInit() {

    // get initial storage values
    chrome.storage.local.get(null, settings => {
      this.selectionOptions.forEach(option => option.selected = settings[option.name])
      this.changeDetectionRef.detectChanges();
    });

    // subscribe on changes
    chrome.storage.onChanged.addListener(changes => {
      Object.keys(changes).forEach(name => {
        const option = this.selectionOptions.find(option => option.name == name);
        if (option) { option.selected = changes[name].newValue; }
      });
      this.changeDetectionRef.detectChanges();
    })
  }

  select(name: string) {
    const option = this.selectionOptions.find(option => option.name == name);
    chrome.storage.local.set({ [name]: !option.selected });
  }

}
