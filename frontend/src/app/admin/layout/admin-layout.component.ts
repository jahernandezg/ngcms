import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from '../components/toast-container.component';
import { RouterModule, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';
import { LoadingService } from '../services/loading.service';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterModule, ToastContainerComponent],
  styleUrls: ['../theme/admin-theme.css'],
  template: `
  <div class="admin-shell min-h-screen flex bg-bg-app text-text-app transition-colors">
  <aside class="w-60 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-r border-gray-200 dark:border-gray-700 p-4 space-y-4 transition-colors">
      <h2 class="text-lg font-semibold">Panel</h2>
      <nav class="flex flex-col gap-2 text-sm">
        <a routerLink="/admin/dashboard" routerLinkActive="font-semibold">Dashboard</a>
        <a routerLink="/admin/posts" routerLinkActive="font-semibold">Posts</a>
  <a routerLink="/admin/pages" routerLinkActive="font-semibold">Páginas</a>
  <a routerLink="/admin/menu" routerLinkActive="font-semibold">Menú</a>
  <a routerLink="/admin/themes" routerLinkActive="font-semibold">Temas</a>
  <a routerLink="/admin/categories" routerLinkActive="font-semibold">Categorías</a>
  <a routerLink="/admin/tags" routerLinkActive="font-semibold">Tags</a>
        <button (click)="logout()" class="text-left text-red-600">Salir</button>
      </nav>
    </aside>
  <main class="flex-1 p-6 admin-main bg-transparent">
      <router-outlet />
    </main>
  <app-toast-container />
  <div *ngIf="loading.isLoading()" class="admin-loading-overlay">
    <div class="admin-spinner" aria-label="Cargando"></div>
  </div>
  </div>
  `
})
export class AdminLayoutComponent {
  private auth = inject(AdminAuthService);
  private router = inject(Router);
  protected loading = inject(LoadingService);
  logout() { this.auth.logout(); }
}
