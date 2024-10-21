import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table'; // Importer MatTableModule
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { NgbModule, NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { BrowserModule } from 'node_modules/@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AccueilComponent } from './components/accueil/accueil.component';
import { AideComponent } from './components/aide/aide.component';
import { ContactsComponent } from './components/contacts/contacts.component';
import { EspaceDetailComponent } from './components/explorer/espace-detail/espace-detail.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { FicheTerrainComponent } from './components/explorer/fiche-terrain/fiche-terrain.component';
import { TInfosBaseSiteComponent } from './components/explorer/t-infos-base-site/t-infos-base-site.component';
import { LiensComponent } from './components/liens/liens.component';
import { SaisirComponent } from './components/saisir/saisir.component';
import { HomeRnfModule } from './home-rnf/home-rnf.module';
import { getFrenchPaginatorIntl } from './home-rnf/shared/french-paginator-intl';
import { CapitalizePipe } from './pipes/capitalize.pipe';
import { TInfosBaseSiteService } from './services/t-infos-base-site.service';



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
    CapitalizePipe,
    SaisirComponent,
    ContactsComponent
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
      timeOut: 15000
    }),
    MatIconModule,
    NgbRatingModule,
    NgbModule,
    MatTableModule,
    BrowserAnimationsModule,
    MatGridListModule,
    MatPaginatorModule
  ],

  providers: [
    TInfosBaseSiteService,
    { provide: MatPaginatorIntl, useValue: getFrenchPaginatorIntl() }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
