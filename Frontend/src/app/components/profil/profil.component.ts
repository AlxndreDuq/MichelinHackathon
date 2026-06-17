import { Component, inject } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';
import { RouteDataService, Route } from '../../services/route-data.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss'
})
export class ProfilComponent {
  state = inject(AppStateService);
  data  = inject(RouteDataService);

  readonly rider = { name: 'Léa M.', points: 3450, target: 5000 };
  readonly progressPct = Math.round((3450 / 5000) * 100); // 69 %
  readonly remaining   = 5000 - 3450; // 1 550

  readonly medals = [
    { label: 'Or',     color: '#E8B43A', count: 4  },
    { label: 'Argent', color: '#B9BBC0', count: 9  },
    { label: 'Bronze', color: '#C8895A', count: 12 },
  ];

  get publishedRoutes(): Route[] {
    return ['cretes', 'arzelier', 'nuit']
      .map(id => this.data.get(id))
      .filter((r): r is Route => !!r);
  }

  open(id: string): void { this.state.openRoute(id); }

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
