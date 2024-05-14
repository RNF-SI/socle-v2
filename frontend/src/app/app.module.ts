import { NgModule } from '@angular/core';
import { BrowserModule } from 'node_modules/@angular/platform-browser';
import { AppComponent } from './app.component';
import { HomeRnfModule } from './home-rnf/home-rnf.module';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { LiensComponent } from './components/liens/liens.component';
import { AideComponent } from './components/aide/aide.component';
import { AccueilComponent } from './components/accueil/accueil.component';
 

  
@NgModule({
  declarations: [
    AppComponent,
    AccueilComponent,
    LiensComponent,
    AideComponent
     
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
