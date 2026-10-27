import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Notifications de l'application, sur MatSnackBar.
 *
 * Remplace ngx-toastr, qui n'a pas de version compatible Angular 22 : la
 * conserver aurait imposé un --legacy-peer-deps à tout l'arbre, y compris au
 * `npm ci` de la CI qui génère les SBOM.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  info(message: string, titre?: string): void {
    this.ouvrir(message, titre, 'notification-info');
  }

  error(message: string, titre?: string): void {
    this.ouvrir(message, titre, 'notification-erreur');
  }

  private ouvrir(message: string, titre: string | undefined, classe: string): void {
    const texte = titre ? `${titre} — ${message}` : message;
    this.snackBar.open(texte, 'Fermer', {
      duration: 15000,
      panelClass: [classe],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
