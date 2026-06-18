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

  /**
   * Upload a GPX file to the backend
   * @param file The GPX file to upload
   * @returns Observable with the response from the backend
   */
  uploadGpx(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('gpx', file);
    
    return this.http.post<any>(`${this.apiUrl}/api/routes/upload-gpx`, formData);
  }

  /**
   * Create and publish a new route
   * @param routeData The route data to publish
   * @returns Observable with the response from the backend
   */
  publishRoute(routeData: {
    name: string;
    creator: string;
    tier: string;
    bike: string;
    dept: string;
    note: string;
    gpxCoordinates: Array<{ lat: number; lon: number }>;
    distance: number;
    elevation: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/routes/create`, routeData);
  }
}
