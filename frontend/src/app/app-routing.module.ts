import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './components/accueil/accueil.component';
import { AideComponent } from './components/aide/aide.component';
import { ContactsComponent } from './components/contacts/contacts.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { LiensComponent } from './components/liens/liens.component';
import { MessitesComponent } from './components/mes-sites/mes-sites.component';
import { QuestionnaireSimplifieComponent } from './components/site/questionnaire-simplifie/questionnaire-simplifie.component';
import { SyntheseSiteComponent } from './components/site/synthese-site/synthese-site.component';
import { AccessDeniedComponent } from './core/components/access-denied/access-denied.component';
import { ForgotPasswordComponent } from './core/components/forgot-password/forgot-password.component';
import { LoginComponent } from './core/components/login/login.component';
import { LogoutComponent } from './core/components/logout/logout.component';
import { NavHomeComponent } from './core/components/nav-home/nav-home.component';
import { NotFoundComponent } from './core/components/not-found/not-found.component';
import { RnAuthGuardService } from './core/auth/auth-guard-rn.service';
import { AuthGuardService } from './core/auth/auth-guard.service';
import { LazyDialogLoader } from './core/auth/lazy-dialog-loader.service';
import { LogoutLinkService } from './core/auth/logout-link.service';


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
        path: 'mot-de-passe-oublie',
        component: ForgotPasswordComponent
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
        component: SyntheseSiteComponent
      },

      {
        path: 'questionnaire-simplifie/:id_rn',
        component: QuestionnaireSimplifieComponent,
        canActivate: [RnAuthGuardService]
      },
      {
        path: 'mes-sites',
        component: MessitesComponent,
        canActivate: [AuthGuardService]
      },
      {
        path: 'contacts',
        component: ContactsComponent
      },
      {
        path: 'non-autorise',
        component: AccessDeniedComponent
      },
      {
        path: '**',
        pathMatch: 'full',
        component: NotFoundComponent
      }





    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routing = RouterModule.forRoot(routes);
