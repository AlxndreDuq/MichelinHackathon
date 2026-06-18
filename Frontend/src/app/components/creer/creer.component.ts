import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { AppStateService, Tier, Bike } from '../../services/app-state.service';
import { RouteDataService } from '../../services/route-data.service';
import { ApiService } from '../../services/api.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-creer',
  standalone: true,
  imports: [],
  templateUrl: './creer.component.html',
  styleUrl: './creer.component.scss'
})
export class CreerComponent implements AfterViewInit, OnDestroy {
  state = inject(AppStateService);
  data  = inject(RouteDataService);
  api   = inject(ApiService);

  @ViewChild('mapElement') mapElement!: ElementRef;
  private map: L.Map | null = null;
  private polyline: L.Polyline | null = null;

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

  ngAfterViewInit(): void {
    // Initialize map when component is ready
    setTimeout(() => this.initializeMap(), 0);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initializeMap(): void {
    if (this.map || !this.mapElement) return;

    // Create map with default view (Isère, France)
    this.map = L.map('trace-map', {
      center: [45.5, 5.7],
      zoom: 10,
      scrollWheelZoom: true,
      dragging: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Draw polyline if coordinates exist
    this.drawPolyline();
  }

  private drawPolyline(): void {
    if (!this.map) return;

    const coordinates = this.state.gpxCoordinates();
    if (coordinates.length < 2) return;

    // Remove existing polyline
    if (this.polyline) {
      this.map.removeLayer(this.polyline);
    }

    // Convert coordinates to Leaflet format [lat, lon]
    const latlngs: [number, number][] = coordinates.map(coord => [coord.lat, coord.lon]);

    // Create and add polyline
    this.polyline = L.polyline(latlngs, {
      color: '#FFCB1A',
      weight: 3.5,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.map);

    // Fit bounds to show entire route
    const bounds = L.latLngBounds(latlngs);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  setTier(t: Tier): void { this.state.cTier.set(t); }
  setBike(b: Bike): void { this.state.cBike.set(b); }
  
  publish(): void {
    // Validate required fields
    if (!this.routeName.trim()) {
      alert('Veuillez entrer un nom pour le parcours');
      return;
    }

    if (!this.dept.trim()) {
      alert('Veuillez entrer le département');
      return;
    }

    if (this.state.gpxCoordinates().length === 0) {
      alert('Veuillez d\'abord importer un fichier GPX');
      return;
    }

    const routeData = {
      name: this.routeName,
      creator: 'user-123', // TODO: Get from actual user session
      tier: this.state.cTier(),
      bike: this.state.cBike(),
      dept: this.dept,
      note: this.advice,
      gpxCoordinates: this.state.gpxCoordinates(),
      distance: this.state.gpxStats().distance,
      elevation: this.state.gpxStats().elevation,
    };

    this.api.publishRoute(routeData).subscribe({
      next: (response) => {
        console.log('Route publiée avec succès:', response);
        this.state.publish();
        alert(`Parcours "${this.routeName}" publié avec succès !`);
      },
      error: (error) => {
        console.error('Erreur lors de la publication:', error);
        alert('Erreur lors de la publication du parcours');
      }
    });
  }

  onGpxSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (!files || files.length === 0) {
      console.warn('Aucun fichier sélectionné');
      return;
    }

    const gpxFile = files[0];
    
    // Vérifier que c'est bien un fichier GPX
    if (!gpxFile.name.endsWith('.gpx')) {
      console.error('Le fichier doit être au format GPX');
      alert('Veuillez sélectionner un fichier GPX valide (.gpx)');
      return;
    }

    // Envoyer le fichier au backend
    this.api.uploadGpx(gpxFile).subscribe({
      next: (response) => {
        console.log('Fichier GPX importé avec succès:', response);
        
        // Mettre à jour l'état global avec les données du GPX
        if (response.success && response.data) {
          this.state.setGpxData(response.data.coordinates, response.data.stats);
          console.log('Tracé importé:', response.data.stats);
          alert(`Fichier GPX importé ! Distance: ${response.data.stats.distance}km, Dénivelé: ${response.data.stats.elevation}m`);
          
          // Redraw polyline on map
          if (this.map) {
            this.drawPolyline();
          } else {
            // If map not ready, it will draw on init
            setTimeout(() => this.initializeMap(), 0);
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du GPX:', error);
        alert('Erreur lors de l\'importation du fichier GPX');
      }
    });

    // Réinitialiser l'input
    input.value = '';
  }

  reset(): void {
    this.state.resetCreer();
    this.routeName = '';
    this.dept      = '';
    this.advice    = '';
    
    // Clear map
    if (this.polyline && this.map) {
      this.map.removeLayer(this.polyline);
      this.polyline = null;
    }
  }
}
