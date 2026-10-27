import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { userAppRulesObj, userRnsObj } from './user.model';
import { AppConfig } from 'src/conf/app.config';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public user: null = null;
  loginError: boolean = false;
  public isLoading = false;

  private _http = inject(HttpClient)

  setCurrentUser(user: any, token: any, expireDate: any, rns: any) {
    localStorage.setItem('current_user', JSON.stringify(user));
    localStorage.setItem("tk_id_token", token)
    localStorage.setItem('expires_at', expireDate);
    localStorage.setItem('rnsUser', JSON.stringify(rns))
  }


  getCurrentUser() {
    let currentUser = localStorage.getItem('current_user');
    let user;
    if (currentUser) {
      user = JSON.parse(currentUser);
    } else {
      user = null
    }
    return user;
  }

  getRnsUser() {
    let currentRnsUser = localStorage.getItem('rnsUser');
    let rnsUser;
    if (currentRnsUser) {
      rnsUser = JSON.parse(currentRnsUser);
    } else {
      rnsUser = null
    }
    return rnsUser;
  }

  public get authenticated(): boolean {

    if (this.getCurrentUser() != null) {
      return true
    } else {
      return false;
    }
  }

  signinUser(identifiant: string, password: string): Observable<any> {
    this.isLoading = true;

    const options = {
      login: identifiant,
      password: password,
      id_application: AppConfig.ID_APPLICATION_GEONATURE
    };

    const httpOptions = {
      withCredentials: true
    };

    return this._http.post<any>(
      `${environment.apiPnUH ? environment.apiPnUH : environment.apiGeoNature}/auth/login`,
      options,
      httpOptions
    ).pipe(
      switchMap(response => {
        if (!environment.apiPnUH) {
          return this.getRnsByUser(response.user.id_role).pipe(
            map(res => {
              this.setCurrentUser(response.user, response.token, response.expires, res.items);
              return response.user; // on renvoie bien un observable d'user
            })
          );
        } else {
          // si condition non remplie → on renvoie directement un observable du user
          this.setCurrentUser(response.user, response.token, response.expires, []);
          return of(response.user);
        }
      })
    );
  }


  loginOrPwdRecovery(data: any): Observable<any> {
    return this._http.post<any>(`https://plateformes.reserves-naturelles.org/api/login/recovery`, data);
  }

  logout() {
    this.cleanLocalStorage();
  }

  private cleanLocalStorage() {
    // Remove only local storage items need to clear when user logout
    localStorage.removeItem('current_user');
    // localStorage.removeItem('modules');
  }

  getRnsByUser(id_role: number): Observable<userRnsObj> {
    return this._http.get<userRnsObj>(`${environment.apiGeoNature}/exports/api/3?token=${environment.token}&role_id=${id_role}`);
  }

  getRulesByUserAndApplication(id_role: number, id_application: number): Observable<userAppRulesObj> {
    return this._http.get<userAppRulesObj>(`${environment.apiGeoNature}/exports/api/4?token=${environment.token}&id_role=${id_role}&id_application=${id_application}`);
  }

  hasAccessToRn(rnId: string | null): Observable<boolean> {
    if (!this.authenticated) {
      return of(false); // Retourner false immédiatement si l'utilisateur n'est pas authentifié
    }

    const currentUser = this.getCurrentUser(); // Méthode pour obtenir l'utilisateur actuel
    if (!currentUser) {
      return of(false); // Retourner false si aucune information utilisateur n'est disponible
    }

    // Vérifier les règles d'accès via getRulesByUserAndApplication
    return this.getRulesByUserAndApplication(currentUser.id_role, environment.id_application).pipe(
      switchMap(result => {
        // Si l'utilisateur a le droit maximal, autoriser immédiatement
        if (result.items[0]?.id_droit_max === 6) {
          return of(true);
        }

        // Vérifier les liens avec RN
        const userRns = this.getRnsUser();
        const hasRnAccess = userRns.some((rn: { rn_id: string | null }) => rn.rn_id === rnId);

        // Retourner true ou false selon l'accès RN
        return of(hasRnAccess);
      }),
      catchError(() => {
        // En cas d'erreur (API ou autre), refuser l'accès
        return of(false);
      })
    );
  }
}
