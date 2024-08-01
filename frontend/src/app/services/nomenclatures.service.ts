import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NomenclaturesService {

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private _http: HttpClient,
  ) { }


  getNomenclaturesByTypeId(id_type: number): any {
    return this._http.get(`${environment.apiUrl}/nomenclatures/${id_type}`);
  }
}
