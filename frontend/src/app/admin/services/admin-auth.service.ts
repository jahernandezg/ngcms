import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import type { ApiResponse } from '@cms-workspace/shared-types';

interface Tokens { accessToken: string; refreshToken: string; roles?: string[]; }

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private accessToken = signal<string | null>(localStorage.getItem('accessToken'));
  private refreshToken = signal<string | null>(localStorage.getItem('refreshToken'));
  private roles = signal<string[]>(JSON.parse(localStorage.getItem('roles')||'[]'));
  isLoggedIn = computed(() => !!this.accessToken());
  hasRole = (role: string) => this.roles().includes(role);

  private http = inject(HttpClient);
  private router = inject(Router);

  login(email: string, password: string) {
    return this.http.post<ApiResponse<Tokens>>('/api/admin/auth/login', { email, password })
      .pipe(tap(resp => {
        if (resp.success) {
          this.setTokens(resp.data.accessToken, resp.data.refreshToken, resp.data.roles);
          // Redirigir explícitamente al dashboard
          this.router.navigate(['/admin','dashboard']);
        }
      }));
  }

  refresh() {
    const rt = this.refreshToken();
    if (!rt) return;
    return this.http.post<ApiResponse<Tokens>>('/api/admin/auth/refresh', { refreshToken: rt })
  .pipe(tap(resp => { if (resp.success) this.setTokens(resp.data.accessToken, resp.data.refreshToken, resp.data.roles); }));
  }

  logout() {
    this.clearTokens();
    this.router.navigate(['/admin/login']);
  }

  isAuthenticated() { return !!this.accessToken(); }
  getAccessToken() { return this.accessToken(); }

  private setTokens(at: string, rt: string, roles?: string[]) {
    this.accessToken.set(at);
    this.refreshToken.set(rt);
    if (roles) { this.roles.set(roles); localStorage.setItem('roles', JSON.stringify(roles)); }
    localStorage.setItem('accessToken', at);
    localStorage.setItem('refreshToken', rt);
  }
  private clearTokens() {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.roles.set([]);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('roles');
  }
}
