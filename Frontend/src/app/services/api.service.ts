import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }


  private apiUrl = import.meta.env.NG_APP_API_URL;

  getRoot(): Observable<string> {
    return this.http.get<string>(this.apiUrl);
  }
}
