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
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import {MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { SyntheseComponent } from './components/explorer/synthese/synthese.component';
import { MatDividerModule } from '@angular/material/divider';

  
@NgModule({
  declarations: [
    AppComponent,
    AccueilComponent,
    LiensComponent,
    AideComponent,
    ExplorerComponent,
    EspaceDetailComponent,
    FicheTerrainComponent,
    MiniQuestComponent,
    SyntheseComponent
     
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    HomeRnfModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatButtonModule,
    MatRadioModule,
    MatInputModule,
    MatListModule,
    MatCardModule,
    MatSidenavModule,
    CommonModule,
    MatExpansionModule,
    MatDividerModule

  

  ],
  providers: [MiniQuestService],
  bootstrap: [AppComponent]
})
export class AppModule { }
