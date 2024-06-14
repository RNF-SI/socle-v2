import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MiniQuestService {
  getData(siteSlug: string) {
    throw new Error('Method not implemented.');
  }
  private responses: any = {};
  constructor(private http: HttpClient) { }

  // Méthode pour soumettre les données
  submitData(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/mini_quest`, data);
  }

  // Méthode pour récupérer une mini-quest par slug
  getMiniQuest(slug: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/mini_quest/${slug}`);
  }

  

  // Méthode pour mettre à jour une mini-quest par slug
  updateMiniQuest(slug: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/mini_quest/${slug}`, data);
  }
  setResponses(slug: string, responses: any) {
    this.responses[slug] = responses;
  }

  getResponses(slug: string) {
    return this.responses[slug] || {};
  }

  getAllMiniQuests(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/mini_quest`);
  }
 
  
}
