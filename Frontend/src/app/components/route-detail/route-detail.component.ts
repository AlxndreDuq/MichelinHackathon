import { Component, inject, computed, signal, effect, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppStateService } from '../../services/app-state.service';
import { AuthService, AuthProfile } from '../../services/auth.service';
import { RouteDataService, LeaderboardEntry, Review } from '../../services/route-data.service';
import { ProductDataService } from '../../services/product-data.service';
import * as L from 'leaflet';

const API = import.meta.env.NG_APP_API_URL;

interface CompleteResponse {
  profile:       AuthProfile;
  pointsAwarded: number;
}

@Component({
  selector: 'app-route-detail',
  standalone: true,
  imports: [],
  templateUrl: './route-detail.component.html',
  styleUrl: './route-detail.component.scss'
})
export class RouteDetailComponent implements AfterViewInit, OnDestroy {
  state     = inject(AppStateService);
  auth      = inject(AuthService);
  data      = inject(RouteDataService);
  products  = inject(ProductDataService);
  http      = inject(HttpClient);

  @ViewChild('mapElement') mapElement!: ElementRef;
  private map: L.Map | null = null;
  private polyline: L.Polyline | null = null;

  route       = computed(() => this.data.get(this.state.openRun() ?? ''));
  leaderboard = signal<LeaderboardEntry[]>([]);
  pointsAwarded = signal<number | null>(null);

  showAllTires  = signal(false);
  matchingTires = computed(() => {
    const r = this.route();
    return r ? this.products.forBike(r.bike) : [];
  });
  visibleTires = computed(() =>
    this.showAllTires() ? this.matchingTires() : this.matchingTires().slice(0, 5),
  );

  get reviews(): Review[] { return this.data.reviews(); }

  stars = [0, 1, 2, 3, 4];

  constructor() {
    effect(() => {
      const r = this.route();
      if (r) {
        this.http.get<LeaderboardEntry[]>(`${API}/api/routes/${r.id}/leaderboard`)
          .subscribe({
            next:  data => this.leaderboard.set(data),
            error: err  => console.error('Leaderboard fetch failed:', err),
          });

        // Initialize or redraw map when route changes
        setTimeout(() => this.initializeMap(), 0);
      } else {
        this.leaderboard.set([]);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeMap(), 0);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initializeMap(): void {
    if (this.map || !this.mapElement) return;

    // Create map with default view
    this.map = L.map('route-detail-map', {
      center: [45.5, 5.7],
      zoom: 10,
      scrollWheelZoom: true,
      dragging: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Draw polyline if coordinates exist
    this.drawPolyline();
  }

  private drawPolyline(): void {
    if (!this.map) return;

    const route = this.route();
    if (!route || !route.gpx_coordinates || route.gpx_coordinates.length < 2) return;

    // Remove existing polyline
    if (this.polyline) {
      this.map.removeLayer(this.polyline);
    }

    // Convert coordinates to Leaflet format [lat, lon]
    const coordinates = Array.isArray(route.gpx_coordinates)
      ? route.gpx_coordinates
      : JSON.parse(route.gpx_coordinates as any);

    const latlngs: [number, number][] = coordinates.map((coord: any) => [coord.lat, coord.lon]);

    // Create and add polyline
    this.polyline = L.polyline(latlngs, {
      color: '#FFCB1A',
      weight: 3.5,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.map);

    // Fit bounds to show entire route
    const bounds = L.latLngBounds(latlngs);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  playRoute(routeId: string): void {
    this.state.play();
    this.pointsAwarded.set(null);
    this.http.post<CompleteResponse>(`${API}/api/profile/routes/${routeId}/complete`, {}).subscribe({
      next:  res => { this.auth.setProfile(res.profile); this.pointsAwarded.set(res.pointsAwarded); },
      error: err => console.error('Route completion failed:', err),
    });
  }

  starsRow(n: number): boolean[] {
    return this.stars.map(i => i < n);
  }
}
