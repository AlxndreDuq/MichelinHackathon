import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';

type Mode = 'login' | 'register';

const DEMO_EMAIL    = 'lea@michelin.com';
const DEMO_PASSWORD = 'michelin2026';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  auth = inject(AuthService);

  mode = signal<Mode>('login');

  name     = '';
  email    = '';
  password = '';

  setMode(m: Mode): void {
    this.mode.set(m);
    this.auth.authError.set(null);
  }

  submit(): void {
    if (this.mode() === 'login') {
      this.auth.login(this.email.trim(), this.password);
    } else {
      this.auth.register(this.name.trim(), this.email.trim(), this.password);
    }
  }

  fillDemo(): void {
    this.mode.set('login');
    this.email = DEMO_EMAIL;
    this.password = DEMO_PASSWORD;
    this.auth.login(DEMO_EMAIL, DEMO_PASSWORD);
  }
}
