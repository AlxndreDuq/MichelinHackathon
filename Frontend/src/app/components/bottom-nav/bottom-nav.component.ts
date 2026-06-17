import { Component, inject } from '@angular/core';
import { AppStateService, Tab } from '../../services/app-state.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss'
})
export class BottomNavComponent {
  state = inject(AppStateService);

  setTab(tab: Tab) { this.state.setTab(tab); }

  is(tab: Tab) { return this.state.tab() === tab; }
}
