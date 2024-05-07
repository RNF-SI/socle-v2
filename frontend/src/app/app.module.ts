import { NgModule } from '@angular/core';
import { BrowserModule } from 'node_modules/@angular/platform-browser';
import { AppComponent } from './app.component';
import { HomeRnfModule } from './home-rnf/home-rnf.module';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';

  
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    HomeRnfModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
