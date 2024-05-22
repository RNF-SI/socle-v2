import { NgModule } from '@angular/core';
import { BrowserModule } from 'node_modules/@angular/platform-browser';
import { AppComponent } from './app.component';
import { HomeRnfModule } from './home-rnf/home-rnf.module';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { LiensComponent } from './components/liens/liens.component';
import { AideComponent } from './components/aide/aide.component';
import { AccueilComponent } from './components/accueil/accueil.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { EspaceDetailComponent } from './components/explorer/espace-detail/espace-detail.component';
import { FicheTerrainComponent } from './components/explorer/fiche-terrain/fiche-terrain.component';
import { MiniQuestComponent } from './components/explorer/mini-quest/mini-quest.component';
import { MiniQuestService } from './services/mini-quest.service';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
 

  
@NgModule({
  declarations: [
    AppComponent,
    AccueilComponent,
    LiensComponent,
    AideComponent,
    ExplorerComponent,
    EspaceDetailComponent,
    FicheTerrainComponent,
    MiniQuestComponent
     
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    HomeRnfModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [MiniQuestService],
  bootstrap: [AppComponent]
})
export class AppModule { }
