import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Site } from '../models/site.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SitesService {
  getSites() {
    throw new Error('Method not implemented.');
  }

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  apiUrl: any;

  constructor(
    private _http: HttpClient,
  ) { }


  getSiteBySlug(slug: string): Observable<Site> {
    return this._http.get<Site>(`${environment.apiUrl}/${slug}`);
  }

  addSite(site: Site): Observable<Site> {
    return this._http.post<Site>(this.apiUrl, site);
  }

  updateSite(site: Site): Observable<Site> {
    return this._http.put<Site>(`${environment.apiUrl}/${site.id}`, site);
  }
}
