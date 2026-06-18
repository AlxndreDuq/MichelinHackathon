import { Component, inject } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';
import { AuthService } from '../../services/auth.service';
import { AuthComponent } from '../auth/auth.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { CarteComponent } from '../carte/carte.component';
import { RouteDetailComponent } from '../route-detail/route-detail.component';
import { ExplorerComponent } from '../explorer/explorer.component';
import { CreerComponent } from '../creer/creer.component';
import { ClassementComponent } from '../classement/classement.component';
import { ProfilComponent } from '../profil/profil.component';

@Component({
  selector: 'app-phone-frame',
  standalone: true,
  imports: [AuthComponent, BottomNavComponent, CarteComponent, RouteDetailComponent, ExplorerComponent, CreerComponent, ClassementComponent, ProfilComponent],
  templateUrl: './phone-frame.component.html',
  styleUrl: './phone-frame.component.scss'
})
export class PhoneFrameComponent {
  state = inject(AppStateService);
  auth  = inject(AuthService);
}
