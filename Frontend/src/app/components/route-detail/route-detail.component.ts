import { Component, inject, computed, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppStateService } from '../../services/app-state.service';
import { RouteDataService, LeaderboardEntry, Review } from '../../services/route-data.service';

const API = 'http://localhost:3000';

@Component({
  selector: 'app-route-detail',
  standalone: true,
  imports: [],
  templateUrl: './route-detail.component.html',
  styleUrl: './route-detail.component.scss'
})
export class RouteDetailComponent {
  state = inject(AppStateService);
  data  = inject(RouteDataService);
  http  = inject(HttpClient);

  route       = computed(() => this.data.get(this.state.openRun() ?? ''));
  leaderboard = signal<LeaderboardEntry[]>([]);

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
      } else {
        this.leaderboard.set([]);
      }
    });
  }

  starsRow(n: number): boolean[] {
    return this.stars.map(i => i < n);
  }
}
