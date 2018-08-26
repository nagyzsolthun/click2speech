/// <reference types="chrome"/>
// reference based on https://stackoverflow.com/questions/43655106/how-to-use-chrome-app-d-ts-type-in-angular-cli-1-0-1-app

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {

  transform(text: string): string {
    return chrome.i18n.getMessage(text) || text;
  }

}
