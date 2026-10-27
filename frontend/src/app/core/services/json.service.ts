import { HttpClient } from '@angular/common/http'; 
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class JsonService {

    private http = inject(HttpClient);

    public getPartenairesJson(): Observable<any> {
        return this.http.get("assets/images/partenaires/fichiers.json");
    }
}