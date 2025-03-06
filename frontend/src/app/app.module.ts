import { CommonModule, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table'; // Importer MatTableModule
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { NgbModule, NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { QuillModule } from 'ngx-quill';
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
import { QuestionnaireSimplifieComponent } from './components/explorer/questionnaire-simplifie/questionnaire-simplifie.component';
import { LiensComponent } from './components/liens/liens.component';
import { SaisirComponent } from './components/saisir/saisir.component';
import { HomeRnfModule } from './home-rnf/home-rnf.module';
import { getFrenchPaginatorIntl } from './home-rnf/shared/french-paginator-intl';
import { CapitalizePipe } from './pipes/capitalize.pipe';
import { TInfosBaseSiteService } from './services/t-infos-base-site.service';


registerLocaleData(localeFr, 'fr');



@NgModule({
  declarations: [
    AppComponent,
    AccueilComponent,
    LiensComponent,
    AideComponent,
    ExplorerComponent,
    EspaceDetailComponent,
    FicheTerrainComponent,
    QuestionnaireSimplifieComponent,
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
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatRadioModule,
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
    MatPaginatorModule,
    MatAutocompleteModule,
    QuillModule.forRoot(),
    MatNativeDateModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatSliderModule
  ],

  providers: [
    TInfosBaseSiteService,
    { provide: MatPaginatorIntl, useValue: getFrenchPaginatorIntl() },
    { provide: LOCALE_ID, useValue: 'fr' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
