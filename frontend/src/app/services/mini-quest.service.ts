import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MiniQuestService {
 

  constructor(private http: HttpClient) { }

  submitData(data: any): Observable<any> {
     
    return this.http.post(`${environment.apiUrl}/mini_quest`, data);
  }
}
