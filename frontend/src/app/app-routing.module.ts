import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AccueilComponent } from './components/accueil/accueil.component';
import { AideComponent } from './components/aide/aide.component';
import { ContactsComponent } from './components/contacts/contacts.component';
import { EspaceDetailComponent } from './components/explorer/espace-detail/espace-detail.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { FicheTerrainComponent } from './components/explorer/fiche-terrain/fiche-terrain.component';
import { QuestionnaireSimplifieComponent } from './components/explorer/questionnaire-simplifie/questionnaire-simplifie.component';
import { LiensComponent } from './components/liens/liens.component';
import { SaisirComponent } from './components/saisir/saisir.component';
import { LoginComponent } from './home-rnf/components/login/login.component';
import { LogoutComponent } from './home-rnf/components/logout/logout.component';
import { NavHomeComponent } from './home-rnf/components/nav-home/nav-home.component';
import { LazyDialogLoader } from './home-rnf/services/lazy-dialog-loader.service';
import { LogoutLinkService } from './home-rnf/services/logout-link.service';



const routes: Routes = [
  {
    path: '',
    component: NavHomeComponent,
    children: [
      {
        path: 'logout', // Ici seulement pour angular, mais toujours redirigé dans le canActivate
        component: LogoutComponent,
        canActivate: [LogoutLinkService]
      },
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [LazyDialogLoader]
      },
      {
        path: '',
        component: AccueilComponent
      },
      {
        path: 'aide',
        component: AideComponent
      },
      {
        path: 'A propos',

        component: LiensComponent
      },
      {
        path: 'explorer',
        component: ExplorerComponent,
      },
      {
        path: 'site/:slug',
        component: EspaceDetailComponent
      },

      {
        path: 'questionnaire-simplifie/:slug',
        component: QuestionnaireSimplifieComponent
      },
      {
        path: 'fiche-terrain/:slug',
        component: FicheTerrainComponent
      },

      {
        path: 'saisir',
        component: SaisirComponent,
        canActivate: [AuthGuard] // Appliquer le guard ici
      },
      {
        path: 'contacts',
        component: ContactsComponent
      },





    ]
  },
  { path: '', redirectTo: '/explorer', pathMatch: 'full' },
  { path: 'fiche-terrain/:slug', component: FicheTerrainComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routing = RouterModule.forRoot(routes);
