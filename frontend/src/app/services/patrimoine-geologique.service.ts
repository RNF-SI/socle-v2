import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PatrimoineGeologique {
  id_patrimoine?: number;  // Ajoutez ceci si vous avez besoin de l'ID pour les mises à jour
  lb: string;
  nombre_etoiles: number;
  interet_geol_principal: string;
  age_des_terrains_le_plus_recent: string;
  age_des_terrains_le_plus_ancien: string;
  bibliographie: string;  // Nouveau champ
}

@Injectable({
  providedIn: 'root'
})
export class PatrimoineGeologiqueService {
  constructor(private http: HttpClient) { }

  getPatrimoineGeologique(siteId: number): Observable<PatrimoineGeologique[]> {
    return this.http.get<PatrimoineGeologique[]>(`${environment.apiUrl}/patrimoine_geologique/${siteId}`);
  }

  updatePatrimoineGeologique(siteId: number, data: PatrimoineGeologique[]): Observable<any> {
    return this.http.put(`${environment.apiUrl}/patrimoine_geologique/${siteId}`, { geological_heritages: data });
  }
}
