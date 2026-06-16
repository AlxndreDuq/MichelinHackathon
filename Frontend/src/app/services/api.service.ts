import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }


  private apiUrl = 'http://localhost:3000';

  getRoot(): Observable<string> {
    return this.http.get<string>(this.apiUrl);
  }
}
