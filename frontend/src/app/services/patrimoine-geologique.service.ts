import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PatrimoineGeologique } from '../models/patrimoine-geologique.model';




@Injectable({
  providedIn: 'root'
})
export class PatrimoineGeologiqueService {
  getSiteBySlug(slug: string) {
    throw new Error('Method not implemented.');
  }
  constructor(private http: HttpClient) { }

  getPatrimoineGeologique(siteId: number): Observable<PatrimoineGeologique[]> {
    return this.http.get<PatrimoineGeologique[]>(`${environment.apiUrl}/patrimoine_geologique/${siteId}`);
  }

  updatePatrimoineGeologique(siteId: number, data: PatrimoineGeologique[]): Observable<any> {
    return this.http.put(`${environment.apiUrl}/patrimoine_geologique/${siteId}`, { geological_heritages: data });
  }
  addPatrimoineGeologique(id_site: number, data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/patrimoine_geologique/${id_site}`, data);
  }
  
}
