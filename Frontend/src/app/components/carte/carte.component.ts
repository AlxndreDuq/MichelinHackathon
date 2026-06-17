import { Component, inject } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';

export type NodeState = 'completed' | 'current' | 'locked' | 'unlocked';

export interface MapNode {
  id:    string;
  name:  string;
  tier:  'vert' | 'bleu' | 'rouge' | 'noir';
  state: NodeState;
  stars: number;
  cx:    number; // horizontal center in px within map area
  cy:    number; // vertical center in px within map area
}

@Component({
  selector: 'app-carte',
  standalone: true,
  imports: [],
  templateUrl: './carte.component.html',
  styleUrl: './carte.component.scss'
})
export class CarteComponent {
  state = inject(AppStateService);

  readonly nodes: MapNode[] = [
    { id: 'lac',      name: 'Tour du Lac',         tier: 'vert',  state: 'completed', stars: 2, cx: 220, cy: 70  },
    { id: 'foret',    name: 'Singletrack Forêt',   tier: 'bleu',  state: 'completed', stars: 1, cx: 110, cy: 202 },
    { id: 'cretes',   name: 'Crêtes du Vercors',   tier: 'rouge', state: 'completed', stars: 3, cx: 235, cy: 334 },
    { id: 'arzelier', name: "Col de l'Arzelier",   tier: 'bleu',  state: 'current',   stars: 0, cx: 120, cy: 466 },
    { id: 'plateau',  name: 'Plateau Gravel',       tier: 'vert',  state: 'locked',    stars: 0, cx: 230, cy: 598 },
    { id: 'nuit',     name: 'Ride Nocturne',        tier: 'bleu',  state: 'locked',    stars: 0, cx: 110, cy: 730 },
    { id: 'mur',      name: 'Le Mur de Sassenage', tier: 'noir',  state: 'locked',    stars: 0, cx: 235, cy: 862 },
  ];

  // SVG path connecting node centers with smooth cubic beziers
  readonly trailPath = this.buildTrailPath();

  filledStars(n: number): number[] { return Array.from({ length: n },      (_, i) => i); }
  emptyStars(n: number):  number[] { return Array.from({ length: 3 - n },  (_, i) => i); }

  // Group wrapper positioned so the node-btn center sits exactly on (cx, cy)
  // For completed nodes, extra space above for stars → shift group up
  groupTop(node: MapNode): number {
    return node.state === 'completed' ? node.cy - 31 - 24 : node.cy - 31;
  }

  tapNode(node: MapNode): void {
    if (node.state !== 'locked') this.state.openRoute(node.id);
  }

  private buildTrailPath(): string {
    const pts = this.nodes?.map(n => ({ x: n.cx, y: n.cy })) ?? [];
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x},${midY} ${curr.x},${midY} ${curr.x},${curr.y}`;
    }
    return d;
  }
}
