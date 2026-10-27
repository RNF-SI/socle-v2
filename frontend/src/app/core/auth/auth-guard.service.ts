import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs/operators';
import { AuthService } from './auth-service.service';
import { LoginComponent } from '../components/login/login.component';

// Guard fonctionnel : Angular 22 n'accepte plus les guards sous forme de classe.
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const dialog = inject(MatDialog);

  if (authService.authenticated) {
    return true;
  }

  const dialogRef = dialog.open(LoginComponent, {
    data: { returnUrl: state.url },
    disableClose: true,
  });

  return dialogRef.afterClosed().pipe(
    map(result => !!result)
  );
};
