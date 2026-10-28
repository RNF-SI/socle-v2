import { CommonModule, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, NgModule, provideZoneChangeDetection } from '@angular/core';
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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table'; // Importer MatTableModule
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AccueilComponent } from './components/accueil/accueil.component';
import { AideComponent } from './components/aide/aide.component';
import { ContactsComponent } from './components/contacts/contacts.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { LiensComponent } from './components/liens/liens.component';
import { MessitesComponent } from './components/mes-sites/mes-sites.component';
import { QuestionnaireSimplifieComponent } from './components/site/questionnaire-simplifie/questionnaire-simplifie.component';
import { SyntheseSiteComponent } from './components/site/synthese-site/synthese-site.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { AccessDeniedComponent } from './core/components/access-denied/access-denied.component';
import { ForgotPasswordComponent } from './core/components/forgot-password/forgot-password.component';
import { LoginComponent } from './core/components/login/login.component';
import { LogoutComponent } from './core/components/logout/logout.component';
import { NavHomeComponent } from './core/components/nav-home/nav-home.component';
import { NotFoundComponent } from './core/components/not-found/not-found.component';
import { CaptchaComponent } from './core/components/captcha/captcha.component';
import { getFrenchPaginatorIntl } from './core/shared/french-paginator-intl';
import { CapitalizePipe } from './pipes/capitalize.pipe';


registerLocaleData(localeFr, 'fr');



@NgModule({
  declarations: [
    AppComponent,
    AccueilComponent,
    LiensComponent,
    AideComponent,
    ExplorerComponent,
    SyntheseSiteComponent,
    QuestionnaireSimplifieComponent,
    CapitalizePipe,
    MessitesComponent,
    ContactsComponent,
    CaptchaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    NavHomeComponent,
    LoginComponent,
    LogoutComponent,
    ForgotPasswordComponent,
    NotFoundComponent,
    AccessDeniedComponent,
    FontAwesomeModule,
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
    MatSnackBarModule,
    MatIconModule,
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
    // Angular 22 démarre en zoneless par défaut : sans ce fournisseur, les
    // retours asynchrones (HTTP, setTimeout) ne déclenchent plus de détection
    // de changements et les vues restent vides. L'application n'utilise pas
    // encore les signaux, elle a donc besoin de la détection par zone.
    provideZoneChangeDetection(),
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} },
    { provide: MatPaginatorIntl, useValue: getFrenchPaginatorIntl() },
    { provide: LOCALE_ID, useValue: 'fr' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fab, fas, far);
  }
}
