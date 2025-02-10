import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Parametre } from '../models/parametres.model';

@Injectable({
  providedIn: 'root'
})
export class ParametresService {

  constructor(
    private _http: HttpClient,
  ) { }

  apiUrl: any = environment.apiUrl;
  getParamtreByLibelle(libelle: string): Observable<Parametre> {
    return this._http.get<Parametre>(`${environment.apiUrl}/parametre/${libelle}`);
  }

}
