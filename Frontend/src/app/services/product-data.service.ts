import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Bike } from './app-state.service';

export interface Product {
  id:       string;
  name:     string;
  bike:     Bike;
  tagline:  string;
  eanCode?: string;
  url:      string;
}

const API = import.meta.env.NG_APP_API_URL;

@Injectable({ providedIn: 'root' })
export class ProductDataService {
  private http = inject(HttpClient);

  readonly products = toSignal(
    this.http.get<Product[]>(`${API}/api/products`).pipe(catchError(() => of([] as Product[]))),
    { initialValue: [] as Product[] },
  );

  forBike(bike: Bike): Product[] {
    return this.products().filter(p => p.bike === bike);
  }
}
