import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Site } from '../models/site.model';
import { Observable } from 'rxjs';
 

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

  addSite(site: Site): Observable<Site> {
    return this._http.post<Site>(this.apiUrl, site);
  }

  updateSite(site: Site): Observable<Site> {
    return this._http.put<Site>(`${environment.apiUrl}/${site.id}`, site);
  }

  getSites(): Observable<Site[]> {
    return this._http.get<Site[]>(`${environment.apiUrl}/sites`);
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

 
}
