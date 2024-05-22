import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MiniQuestService {
  private apiUrl = 'http://localhost:5000/api/miniquest';

  constructor(private http: HttpClient) { }

  submitData(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
