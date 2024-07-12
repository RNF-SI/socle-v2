import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TInfosBaseSiteService {
  constructor(private http: HttpClient) { }

  submitData(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/t_infos_base_site`, data);
  }

  getSiteBySlug(slug: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/t_infos_base_site/${slug}`);
  }

  getTInfosBaseSites(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/t_infos_base_sites`);
  }

  updateSite(slug: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/t_infos_base_site/${slug}`, data);
  }
}
