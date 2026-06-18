import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Tier, Bike } from './app-state.service';

export interface Route {
  id:          string;
  name:        string;
  creator:     string;
  tier:        Tier;
  dist:        number;
  deniv:       number;
  time:        string;
  stars:       number;
  reviewCount: number;
  plays:       number;
  hot:         boolean;
  bike:        Bike;
  note:        string;
  dept?:       string;
  gpx_coordinates?: Array<{ lat: number; lon: number }>;
}

export interface LeaderboardEntry {
  rank:     number;
  name:     string;
  initials: string;
  time:     string;
  you:      boolean;
}

export interface Review {
  name:     string;
  initials: string;
  stars:    number;
  comment:  string;
}

const API = import.meta.env.NG_APP_API_URL;

@Injectable({ providedIn: 'root' })
export class RouteDataService {
  private http = inject(HttpClient);

  readonly routes  = toSignal(
    this.http.get<Route[]>(`${API}/api/routes`).pipe(catchError(() => of([] as Route[]))),
    { initialValue: [] as Route[] },
  );
  readonly reviews = toSignal(
    this.http.get<Review[]>(`${API}/api/routes/reviews`).pipe(catchError(() => of([] as Review[]))),
    { initialValue: [] as Review[] },
  );

  private routeMap = computed(() => new Map(this.routes().map(r => [r.id, r])));

  get(id: string): Route | undefined {
    return this.routeMap().get(id);
  }

  formatPlays(plays: number): string {
    return plays >= 1000 ? `${(plays / 1000).toFixed(1)}k` : `${plays}`;
  }

  getTire(bike: Bike): string {
    return { route: 'MICHELIN Power Road', gravel: 'MICHELIN Power Gravel', vtt: 'MICHELIN Wild Trail' }[bike];
  }

  getBikeLabel(bike: Bike): string {
    return { route: 'Route', gravel: 'Gravel', vtt: 'VTT' }[bike];
  }

  tierLabel(tier: Tier): string {
    return { vert: 'Vert · Découverte', bleu: 'Bleu · Sport', rouge: 'Rouge · Engagé', noir: 'Noir · Légende' }[tier];
  }
}
