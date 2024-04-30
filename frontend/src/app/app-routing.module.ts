import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavHomeComponent } from './home-rnf/components/nav-home/nav-home.component';

const routes: Routes = [ 
  { 
    path: '', 
    component: NavHomeComponent, 
    children: [ 
      // {
      //   path: '',
      //   component: HomeComponent
      // },
      // { 
      //   path: 'logout', // Ici seulement pour angular, mais toujour redirigé dans le canActivate 
      //   component: LogoutComponent, 
      //   canActivate: [ LogoutLinkService ] 
      // }, 
      // { 
      //   path: 'login', 
      //   component: LoginComponent, 
      //   canActivate: [ LazyDialogLoader ] 
      // },
      // { 
      //   path: 'mon-compte', 
      //   component: MoncompteComponent, 
      //   canActivate: [ AuthGuardService]
      // }
    ] 
  } ,
  // {
  //   path: 'inscription',
  //   component: SignUpComponent
  // } ,
  // {
  //   path: 'nouveau-mot-de-passe',
  //   component: ResetPasswordComponent
  // }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
