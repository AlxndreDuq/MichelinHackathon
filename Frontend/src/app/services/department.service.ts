import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const DEFAULT_DEPARTMENT = 'Loire-Atlantique';

// The 96 metropolitan French departments, by name.
const FRENCH_DEPARTMENTS = [
  'Ain', 'Aisne', 'Allier', 'Alpes-de-Haute-Provence', 'Hautes-Alpes', 'Alpes-Maritimes',
  'Ardèche', 'Ardennes', 'Ariège', 'Aube', 'Aude', 'Aveyron', 'Bouches-du-Rhône', 'Calvados',
  'Cantal', 'Charente', 'Charente-Maritime', 'Cher', 'Corrèze', 'Corse-du-Sud', 'Haute-Corse',
  "Côte-d'Or", "Côtes-d'Armor", 'Creuse', 'Dordogne', 'Doubs', 'Drôme', 'Eure', 'Eure-et-Loir',
  'Finistère', 'Gard', 'Haute-Garonne', 'Gers', 'Gironde', 'Hérault', 'Ille-et-Vilaine', 'Indre',
  'Indre-et-Loire', 'Isère', 'Jura', 'Landes', 'Loir-et-Cher', 'Loire', 'Haute-Loire',
  'Loire-Atlantique', 'Loiret', 'Lot', 'Lot-et-Garonne', 'Lozère', 'Maine-et-Loire', 'Manche',
  'Marne', 'Haute-Marne', 'Mayenne', 'Meurthe-et-Moselle', 'Meuse', 'Morbihan', 'Moselle',
  'Nièvre', 'Nord', 'Oise', 'Orne', 'Pas-de-Calais', 'Puy-de-Dôme', 'Pyrénées-Atlantiques',
  'Hautes-Pyrénées', 'Pyrénées-Orientales', 'Bas-Rhin', 'Haut-Rhin', 'Rhône', 'Haute-Saône',
  'Saône-et-Loire', 'Sarthe', 'Savoie', 'Haute-Savoie', 'Paris', 'Seine-Maritime',
  'Seine-et-Marne', 'Yvelines', 'Deux-Sèvres', 'Somme', 'Tarn', 'Tarn-et-Garonne', 'Var',
  'Vaucluse', 'Vendée', 'Vienne', 'Haute-Vienne', 'Vosges', 'Yonne', 'Territoire de Belfort',
  'Essonne', 'Hauts-de-Seine', 'Seine-Saint-Denis', 'Val-de-Marne', "Val-d'Oise",
].sort((a, b) => a.localeCompare(b, 'fr'));

interface ReverseGeocodeResponse {
  features: { properties: { context?: string } }[];
}

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private http = inject(HttpClient);

  department = signal<string>(DEFAULT_DEPARTMENT);

  readonly availableDepartments: readonly string[] = FRENCH_DEPARTMENTS;

  constructor() {
    // Deferred to avoid firing the geolocation/HTTP call mid-construction.
    queueMicrotask(() => this.detect());
  }

  setDepartment(name: string): void {
    this.department.set(name);
  }

  private detect(): void {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      pos => this.reverseGeocode(pos.coords.latitude, pos.coords.longitude),
      () => { /* permission denied / unavailable — keep the default */ },
      { timeout: 8000 },
    );
  }

  private reverseGeocode(lat: number, lon: number): void {
    this.http.get<ReverseGeocodeResponse>(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`,
    ).subscribe({
      next: res => {
        // properties.context looks like "44, Loire-Atlantique, Pays de la Loire"
        const context  = res.features?.[0]?.properties?.context;
        const deptName = context?.split(',')[1]?.trim();
        if (deptName && this.availableDepartments.includes(deptName)) {
          this.department.set(deptName);
        }
      },
      error: () => { /* network/API failure — keep the default */ },
    });
  }
}
