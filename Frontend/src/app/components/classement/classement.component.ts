import { Component, inject, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppStateService } from '../../services/app-state.service';

interface Player {
  rank:     number;
  name:     string;
  initials: string;
  dept?:    string;
  points:   number;
  you?:     boolean;
}

const API = import.meta.env.NG_APP_API_URL;

@Component({
  selector: 'app-classement',
  standalone: true,
  imports: [],
  templateUrl: './classement.component.html',
  styleUrl: './classement.component.scss'
})
export class ClassementComponent {
  state = inject(AppStateService);
  http  = inject(HttpClient);

  boardData = signal<Player[]>([]);

  king        = computed(() => this.boardData()[0] ?? null);
  regularRows = computed(() => this.boardData().filter(p => !p.you && p.rank > 1));
  youRow      = computed(() => this.boardData().find(p => p.you) ?? null);
  showGap     = computed(() => {
    const you  = this.youRow();
    const last = this.regularRows().at(-1);
    return !!(you && last && you.rank > last.rank + 1);
  });
  kingTitle = computed(() =>
    this.state.boardScope() === 'mensuel' ? 'King of Dépt' : 'King de France'
  );
  caption = computed(() =>
    this.state.boardScope() === 'mensuel'
      ? 'Classement mensuel · Isère · 38'
      : 'Classement annuel · riders de toute la France'
  );

  constructor() {
    this.fetchBoard('mensuel');
  }

  setScope(s: 'mensuel' | 'global'): void {
    this.state.boardScope.set(s);
    this.fetchBoard(s);
  }

  private fetchBoard(scope: string): void {
    this.http.get<Player[]>(`${API}/api/leaderboard?scope=${scope}`)
      .subscribe({
        next:  data => this.boardData.set(data),
        error: err  => console.error('Board fetch failed:', err),
      });
  }

  formatPts(p: number): string {
    return p >= 1000
      ? `${Math.floor(p / 1000)} ${String(p % 1000).padStart(3, '0')} pts`
      : `${p} pts`;
  }

  avatarCls(rank: number): string {
    if (rank === 1) return 'av-gold';
    if (rank === 2) return 'av-silver';
    if (rank === 3) return 'av-bronze';
    return 'av-default';
  }
}
