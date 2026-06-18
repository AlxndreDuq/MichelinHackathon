import { Component, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppStateService } from '../../services/app-state.service';
import { AuthService } from '../../services/auth.service';
import { RouteDataService, Route } from '../../services/route-data.service';

const API = import.meta.env.NG_APP_API_URL;

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss'
})
export class ProfilComponent {
  state = inject(AppStateService);
  auth  = inject(AuthService);
  data  = inject(RouteDataService);
  http  = inject(HttpClient);

  publishedRoutes = signal<Route[]>([]);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.http.get<Route[]>(`${API}/api/profile/routes`).subscribe({
          next:  routes => this.publishedRoutes.set(routes),
          error: ()     => this.publishedRoutes.set([]),
        });
      } else {
        this.publishedRoutes.set([]);
      }
    });
  }

  open(id: string): void { this.state.openRoute(id); }

  logout(): void { this.auth.logout(); }

  tierColor(tier: string): string {
    return ({ vert: '#7E9B5B', bleu: '#1F4BA0', rouge: '#D4533A', noir: '#15140F' } as Record<string, string>)[tier] ?? '#1F4BA0';
  }

  tierText(tier: string): string {
    return ({ vert: 'Vert', bleu: 'Bleu', rouge: 'Rouge', noir: 'Noir' } as Record<string, string>)[tier] ?? tier;
  }

  formatPts(p: number): string {
    return p >= 1000
      ? `${Math.floor(p / 1000)} ${String(p % 1000).padStart(3, '0')} pts`
      : `${p} pts`;
  }
}
