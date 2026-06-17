import { Component, inject } from '@angular/core';
import { AppStateService, Tier, Bike } from '../../services/app-state.service';
import { RouteDataService } from '../../services/route-data.service';

@Component({
  selector: 'app-creer',
  standalone: true,
  imports: [],
  templateUrl: './creer.component.html',
  styleUrl: './creer.component.scss'
})
export class CreerComponent {
  state = inject(AppStateService);
  data  = inject(RouteDataService);

  // Local form fields (not cross-component, no need for signals)
  routeName = '';
  dept      = '';
  advice    = '';

  readonly tiers: { key: Tier; label: string; color: string }[] = [
    { key: 'vert',  label: 'Vert',  color: '#7E9B5B' },
    { key: 'bleu',  label: 'Bleu',  color: '#1F4BA0' },
    { key: 'rouge', label: 'Rouge', color: '#D4533A' },
    { key: 'noir',  label: 'Noir',  color: '#15140F' },
  ];

  readonly bikes: { key: Bike; label: string }[] = [
    { key: 'route',  label: 'Route'  },
    { key: 'gravel', label: 'Gravel' },
    { key: 'vtt',    label: 'VTT'    },
  ];

  setTier(t: Tier): void { this.state.cTier.set(t); }
  setBike(b: Bike): void { this.state.cBike.set(b); }
  publish(): void        { this.state.publish(); }

  reset(): void {
    this.state.resetCreer();
    this.routeName = '';
    this.dept      = '';
    this.advice    = '';
  }
}
