import { Injectable, signal } from '@angular/core';

export type Tab = 'accueil' | 'explorer' | 'creer' | 'classement' | 'profil';
export type Tier = 'vert' | 'bleu' | 'rouge' | 'noir';
export type Bike = 'route' | 'gravel' | 'vtt';
export type BoardScope = 'mensuel' | 'global';

export interface GpxCoordinate {
  lat: number;
  lon: number;
}

export interface GpxStats {
  distance: number;
  elevation: number;
}

@Injectable({ providedIn: 'root' })
export class AppStateService {
  tab        = signal<Tab>('accueil');
  openRun    = signal<string | null>(null);
  playing    = signal(false);
  published  = signal(false);
  boardScope = signal<BoardScope>('mensuel');
  cTier      = signal<Tier>('bleu');
  cBike      = signal<Bike>('gravel');
  gpxCoordinates = signal<GpxCoordinate[]>([]);
  gpxStats   = signal<GpxStats>({ distance: 0, elevation: 0 });

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

  setGpxData(coordinates: GpxCoordinate[], stats: GpxStats) {
    this.gpxCoordinates.set(coordinates);
    this.gpxStats.set(stats);
  }

  resetCreer() {
    this.published.set(false);
    this.cTier.set('bleu');
    this.cBike.set('gravel');
    this.gpxCoordinates.set([]);
    this.gpxStats.set({ distance: 0, elevation: 0 });
  }
}
