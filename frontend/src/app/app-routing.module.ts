import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavHomeComponent } from './home-rnf/components/nav-home/nav-home.component';
import { LogoutComponent } from './home-rnf/components/logout/logout.component';
import { LogoutLinkService } from './home-rnf/services/logout-link.service';
import { LoginComponent } from './home-rnf/components/login/login.component';
import { LazyDialogLoader } from './home-rnf/services/lazy-dialog-loader.service';
import { AideComponent } from './components/aide/aide.component';
import { LiensComponent } from './components/liens/liens.component';
import { AccueilComponent } from './components/accueil/accueil.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { EspaceDetailComponent } from './components/explorer/espace-detail/espace-detail.component';
import { FicheTerrainComponent } from './components/explorer/fiche-terrain/fiche-terrain.component';
import { MiniQuestComponent } from './components/explorer/mini-quest/mini-quest.component';

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
        path: 'liens',
        component: LiensComponent
      },
      {
        path: 'explorer',
        component: ExplorerComponent,
      },
      {
        path: 'espace/:slug',
        component: EspaceDetailComponent
      },
      {
        path: 'mini-quest/:slug',
        component: MiniQuestComponent
      },
      {
        path: 'fiche-terrain/:slug',
        component: FicheTerrainComponent 
      }
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
