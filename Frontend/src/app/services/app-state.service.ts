import { Injectable, signal } from '@angular/core';

export type Tab = 'accueil' | 'explorer' | 'creer' | 'classement' | 'profil';
export type Tier = 'vert' | 'bleu' | 'rouge' | 'noir';
export type Bike = 'route' | 'gravel' | 'vtt';
export type BoardScope = 'mensuel' | 'global';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  tab        = signal<Tab>('accueil');
  openRun    = signal<string | null>(null);
  playing    = signal(false);
  published  = signal(false);
  boardScope = signal<BoardScope>('mensuel');
  cTier      = signal<Tier>('bleu');
  cBike      = signal<Bike>('gravel');

  setTab(t: Tab) {
    this.tab.set(t);
    this.openRun.set(null);
    this.playing.set(false);
  }

  openRoute(id: string) {
    this.openRun.set(id);
    this.playing.set(false);
  }

  closeRoute() {
    this.openRun.set(null);
    this.playing.set(false);
  }

  play()    { this.playing.set(true); }
  publish() { this.published.set(true); }

  resetCreer() {
    this.published.set(false);
    this.cTier.set('bleu');
    this.cBike.set('gravel');
  }
}
