import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Site } from '../models/site.model';


@Injectable({
  providedIn: 'root'
})
export class SitesService {

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  apiUrl: any = environment.apiUrl;

  constructor(
    private _http: HttpClient,
  ) { }

  getSiteBySlug(slug: string): Observable<Site> {
    return this._http.get<Site>(`${environment.apiUrl}/site/${slug}`);
  }


  getSiteByIdLocal(id_local: string): Observable<Site> {
    return this._http.get<Site>(`${environment.apiUrl}/site/id_local/${id_local}`);
  }

  updateSite(slug: string, data: any): Observable<any> {
    return this._http.put(`${environment.apiUrl}/t_infos_base_site/${slug}`, data);
  }

  getSitesCentroid(): Observable<Site[]> {
    return this._http.get<Site[]>(`${environment.apiUrl}/sites-simple-centroides`);
  }

  getSitesPourAdmin(): Observable<Site[]> {
    return this._http.get<Site[]>(`${environment.apiUrl}/sites-pour-admin`);
  }

  // Charger les polygones des entités visibles dans une BBOX
  getPolygones(bbox: string): Observable<Site[]> {
    return this._http.get<Site[]>(`${environment.apiUrl}/sites-dans-bbox?bbox=${bbox}`);
  }

  getStratotypesEtage(): Observable<any> {
    return this._http.get<any>(`${environment.apiUrl}/stratotypes-etage`);
  }

  getStratotypesLimite(): Observable<any> {
    return this._http.get<any>(`${environment.apiUrl}/stratotypes-limite`);
  }

  invalidInpgSite(siteId: number, inpgId: number, reason: string): Observable<any> {
    const infos = { siteId, inpgId, reason };

    return this._http.put(`${environment.apiUrl}/invalid-inpg-from-site`, infos).pipe(
      catchError((error) => {
        console.error('Erreur lors de la requête PUT :', error);
        return throwError(error);
      })
    );
  }

  revalidInpgSite(siteId: number, inpgId: number): Observable<any> {
    const infos = { siteId, inpgId };

    return this._http.put(`${environment.apiUrl}/revalid-inpg-from-site`, infos).pipe(
      catchError((error) => {
        console.error('Erreur lors de la requête PUT :', error);
        return throwError(error);
      })
    );
  }
}
