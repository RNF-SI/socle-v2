import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Site } from '../models/site.model';


@Injectable({
  providedIn: 'root'
})
export class SitesService {
  navigate(arg0: string[]) {
    throw new Error('Method not implemented.');
  }

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

  addSite(site: Site): Observable<Site> {
    return this._http.post<Site>(this.apiUrl, site);
  }

  updateSite(site: Site): Observable<Site> {
    return this._http.put<Site>(`${environment.apiUrl}/${site.id}`, site);
  }

  getSites(): Observable<Site[]> {
    return this._http.get<Site[]>(`${environment.apiUrl}/sites`);
  }

  getSitesCentroid(): Observable<Site[]> {
    return this._http.get<Site[]>(`${environment.apiUrl}/sites-simple-centroides`);
  }

  // Charger les polygones des entités visibles dans une BBOX
  getPolygones(bbox: string): Observable<Site[]> {
    return this._http.get<Site[]>(`${environment.apiUrl}/sites-dans-bbox?bbox=${bbox}`);
  }


  getSitesWithProtection(): Observable<Site[]> {
    return this._http.get<Site[]>(`${environment.apiUrl}/sites/protection`);
  }

  // Nouvelle méthode pour récupérer les centroïdes
  getCentroids(): Observable<any> {
    return this._http.get(`${environment.apiUrl}/sites`);  // URL de ton API Flask
  }

  getSiteCount(): Observable<any> {
    return this._http.get<any>(`${environment.apiUrl}/sites/count`);
  }

  getStratotypeCount(): Observable<any> {
    return this._http.get<any>(`${environment.apiUrl}/stratotypes/count`);

  }

  // Nouvelle méthode pour obtenir le nombre de sites INPG
  getInpgSiteCount(): Observable<any> {
    return this._http.get<any>(`${environment.apiUrl}/sites/inpg/count`);

  }

  getSitesByTypeRnAndCode(typeRn: string, code: string): Observable<Site[]> {
    let params = new HttpParams();
    if (typeRn) {
      params = params.set('type_rn', typeRn);  // Ajoute le filtre si présent
    }
    if (code) {
      params = params.set('code', code);  // Ajoute le filtre si présent
    }
    return this._http.get<Site[]>(environment.apiUrl, { params });
  }

  getFilteredSites(patrimoine: string): Observable<Site[]> {
    let params = new HttpParams().set('patrimoine', patrimoine);
    return this._http.get<Site[]>(`${environment.apiUrl}/sites/patrimoine`, { params });
  }


  getSitesWithInpg(): Observable<Site[]> {
    return this._http.get<Site[]>(`${environment.apiUrl}/sites/inpg`);
  }

  getSitesByRegion(region: string): Observable<Site[]> {
    let params = new HttpParams().set('region', region);
    return this._http.get<Site[]>(`${environment.apiUrl}/sites/region`, { params });
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
