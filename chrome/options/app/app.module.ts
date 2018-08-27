import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { TranslatePipe } from './translate.pipe';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { RouterModule, Routes } from '@angular/router';
import { SpeechSettingsComponent } from './speech-settings/speech-settings.component';
import { SpeedSettingsComponent } from './speed-settings/speed-settings.component';

const routes: Routes = [
  { path: 'general', component: GeneralSettingsComponent },
  { path: 'speech', component: SpeechSettingsComponent },
  { path: 'contact', component: GeneralSettingsComponent },
  { path: '**', redirectTo: 'general' }
];

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    TranslatePipe,
    GeneralSettingsComponent,
    SpeechSettingsComponent,
    SpeedSettingsComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes, { useHash: true })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
