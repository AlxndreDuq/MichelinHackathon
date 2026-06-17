import { Component, inject, signal } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';
import { RouteDataService, Route } from '../../services/route-data.service';

type FilterKey = 'tendances' | 'nouveaux' | 'pres' | 'difficulte';

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.scss'
})
export class ExplorerComponent {
  state = inject(AppStateService);
  data  = inject(RouteDataService);

  activeFilter = signal<FilterKey>('tendances');

  readonly filters: { key: FilterKey; label: string }[] = [
    { key: 'tendances',  label: 'Tendances'   },
    { key: 'nouveaux',   label: 'Nouveaux'    },
    { key: 'pres',       label: 'Près de toi' },
    { key: 'difficulte', label: 'Difficulté'  },
  ];

  get trendingRoutes(): Route[] { return this.data.routes().filter(r => r.hot); }
  get allRoutes():      Route[] { return this.data.routes(); }

  open(id: string): void { this.state.openRoute(id); }

  tierColor(tier: string): string {
    return ({ vert: '#7E9B5B', bleu: '#1F4BA0', rouge: '#D4533A', noir: '#15140F' } as Record<string, string>)[tier] ?? '#1F4BA0';
  }

  tierText(tier: string): string {
    return ({ vert: 'Vert', bleu: 'Bleu', rouge: 'Rouge', noir: 'Noir' } as Record<string, string>)[tier] ?? tier;
  }
}
