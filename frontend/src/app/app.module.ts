import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeRnfModule } from './home-rnf/home-rnf.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,

    AppRoutingModule,
    HomeRnfModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
