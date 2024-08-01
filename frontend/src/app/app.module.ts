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
 import {TInfosBaseSiteService } from './services/t-infos-base-site.service';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TInfosBaseSiteComponent } from './components/explorer/t-infos-base-site/t-infos-base-site.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ToastrModule } from 'ngx-toastr';
import { CapitalizePipe } from './pipes/capitalize.pipe';
import { MatIconModule } from '@angular/material/icon';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

  
@NgModule({
  declarations: [
    AppComponent,
    AccueilComponent,
    LiensComponent,
    AideComponent,
    ExplorerComponent,
    EspaceDetailComponent,
    FicheTerrainComponent,
    TInfosBaseSiteComponent,
    CapitalizePipe
     
     
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
    MatDividerModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    ToastrModule.forRoot({
      timeOut:15000
    }),
    MatIconModule,
    NgbRatingModule,
    NgbModule,

  

  ],
  providers: [TInfosBaseSiteService],
  bootstrap: [AppComponent]
})
export class AppModule { }
