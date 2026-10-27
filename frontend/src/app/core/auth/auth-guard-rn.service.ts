import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth-service.service'; // Assurez-vous que le chemin est correct

@Injectable({
  providedIn: 'root'
})
export class RnAuthGuardService  {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    if (!this.authService.authenticated) {
      this.router.navigate(['/login']); // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
      return of(false);
    }

    // Récupérer les informations de l'utilisateur courant depuis le localStorage
    const currentUser = this.authService.getCurrentUser(); // Méthode à implémenter pour obtenir current_user
    const rnId = route.paramMap.get('id_rn'); // ID du RN à vérifier

    if (currentUser) {
      return this.authService.getRulesByUserAndApplication(currentUser.id_role, environment.id_application).pipe(
        map(result => {
          // Vérifier les deux conditions
          const hasGlobalAccess = result.items[0]?.id_droit_max === 6;
          const userRns = this.authService.getRnsUser();
          const hasRnAccess = userRns.some((rn: { rn_id: string | null }) => rn.rn_id === rnId);

          if (hasGlobalAccess || hasRnAccess) {
            return true; // Autoriser l'accès si l'une des deux conditions est remplie
          }

          this.router.navigate(['non-autorise']); // Rediriger si aucune condition n'est remplie
          return false;
        }),
        catchError(() => {
          this.router.navigate(['non-autorise']);
          return of(false); // Refuser l'accès en cas d'erreur
        })
      );
    }

    // Si aucune information utilisateur n'est disponible, refuser l'accès
    this.router.navigate(['non-autorise']);
    return of(false);
  }
}
