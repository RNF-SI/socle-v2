import { inject, Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../components/login/login.component'; 

@Injectable({
  providedIn: 'root'
})
export class LazyDialogLoader {
  constructor(private dialog: MatDialog) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
      
    this.dialog.open(LoginComponent, {
      data: { url: state.url }  // Pass the URL as data
    });

    // Always return false so the route is never activated.
    // You might want to modify this to return true if the user is already authenticated.
    return false;
  }

}

export const LazyDialog: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  return inject(LazyDialogLoader).canActivate(next, state);
}