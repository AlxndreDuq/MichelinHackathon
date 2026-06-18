import { Component, computed, inject, signal } from '@angular/core';
import { AppStateService, Tier } from '../../services/app-state.service';
import { RouteDataService, Route } from '../../services/route-data.service';
import { DepartmentService } from '../../services/department.service';

export interface MapNode {
  id:    string;
  name:  string;
  tier:  Tier;
  stars: number;
  cx:    number; // horizontal center in px within map area
  cy:    number; // vertical center in px within map area
}

const START_Y = 70;
const STEP_Y  = 132;
const LEFT_X  = 115;
const RIGHT_X = 230;
const RATING_OFFSET = 24;
const CIRCLE_RADIUS = 31;
const BOTTOM_PADDING = 220;
const MIN_MAP_HEIGHT = 400;

@Component({
  selector: 'app-carte',
  standalone: true,
  imports: [],
  templateUrl: './carte.component.html',
  styleUrl: './carte.component.scss'
})
export class CarteComponent {
  state = inject(AppStateService);
  data  = inject(RouteDataService);
  dept  = inject(DepartmentService);

  readonly deptMenuOpen = signal(false);

  readonly filteredRoutes = computed(() =>
    this.data.routes().filter(r => r.dept === this.dept.department()),
  );

  readonly nodes = computed(() => this.layoutNodes(this.filteredRoutes()));

  readonly sidequestRoute = computed(() => {
    const list = this.filteredRoutes();
    return list.find(r => r.hot) ?? list[0];
  });

  readonly trailPath = computed(() => this.buildTrailPath(this.nodes()));

  readonly mapHeight = computed(() => {
    const n = this.nodes().length;
    return n > 0 ? START_Y + (n - 1) * STEP_Y + BOTTOM_PADDING : MIN_MAP_HEIGHT;
  });

  groupTop(node: MapNode): number {
    return node.cy - CIRCLE_RADIUS - RATING_OFFSET;
  }

  tapNode(node: MapNode): void {
    this.state.openRoute(node.id);
  }

  toggleDeptMenu(): void {
    this.deptMenuOpen.set(!this.deptMenuOpen());
  }

  selectDepartment(name: string): void {
    this.dept.setDepartment(name);
    this.deptMenuOpen.set(false);
  }

  private layoutNodes(routes: Route[]): MapNode[] {
    // Start on the left column — the right side near the top is where the
    // sidequest card floats, and would block taps on a single-route node.
    return routes.map((r, i) => ({
      id:    r.id,
      name:  r.name,
      tier:  r.tier,
      stars: r.stars,
      cx:    i % 2 === 0 ? LEFT_X : RIGHT_X,
      cy:    START_Y + i * STEP_Y,
    }));
  }

  private buildTrailPath(nodes: MapNode[]): string {
    const pts = nodes.map(n => ({ x: n.cx, y: n.cy }));
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
