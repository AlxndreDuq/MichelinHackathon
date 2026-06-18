import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

export interface AuthProfile {
  name:   string;
  rank:   string;
  points: number;
  target: number;
  medals: { label: string; color: string; count: number }[];
}

interface AuthResponse {
  token:   string;
  profile: AuthProfile;
}

const API = import.meta.env.NG_APP_API_URL;
const TOKEN_KEY = 'mich_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  token     = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  profile   = signal<AuthProfile | null>(null);
  restoring = signal<boolean>(!!localStorage.getItem(TOKEN_KEY));
  authError = signal<string | null>(null);
  loading   = signal(false);

  isAuthenticated(): boolean {
    return this.profile() !== null;
  }

  constructor() {
    // Deferred: calling http.get() synchronously here would route through
    // authInterceptor, which injects AuthService while it's still being
    // constructed, tripping Angular's circular-dependency guard (NG0200).
    if (this.token()) {
      queueMicrotask(() => this.restoreSession());
    }
  }

  private restoreSession(): void {
    this.http.get<AuthProfile>(`${API}/api/profile`).subscribe({
      next:  profile => { this.profile.set(profile); this.restoring.set(false); },
      error: ()       => { this.logout(); this.restoring.set(false); },
    });
  }

  login(email: string, password: string): void {
    this.loading.set(true);
    this.authError.set(null);
    this.http.post<AuthResponse>(`${API}/api/auth/login`, { email, password }).subscribe({
      next:  res => this.onAuthSuccess(res),
      error: err => this.onAuthError(err),
    });
  }

  register(name: string, email: string, password: string): void {
    this.loading.set(true);
    this.authError.set(null);
    this.http.post<AuthResponse>(`${API}/api/auth/register`, { name, email, password }).subscribe({
      next:  res => this.onAuthSuccess(res),
      error: err => this.onAuthError(err),
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.profile.set(null);
  }

  private onAuthSuccess(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    this.token.set(res.token);
    this.profile.set(res.profile);
    this.loading.set(false);
  }

  private onAuthError(err: unknown): void {
    const message = err instanceof HttpErrorResponse ? err.error?.error : null;
    this.authError.set(message ?? 'Une erreur est survenue. Réessaie.');
    this.loading.set(false);
  }
}
