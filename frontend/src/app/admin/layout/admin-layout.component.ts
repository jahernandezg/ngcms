import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from '../components/toast-container.component';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';
import { LoadingService } from '../services/loading.service';
import { filter, map } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterModule, ToastContainerComponent],
  styleUrls: ['../theme/admin-theme.css'],
  template: `
  <div class="admin-shell min-h-screen xl:flex">
    <!-- Sidebar -->
    <aside [class]="'w-64 min-h-screen bg-slate-900 transition-all duration-300 ease-in-out ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0')">
      <!-- Logo/Header -->
      <div class="flex items-center justify-center py-6 px-6 border-b border-slate-700">
        <h1 class="text-xl font-bold text-white">{{ appName }}</h1>
      </div>
      
      <!-- Navigation Menu -->
      <nav class="mt-6 px-6">
        <ul class="space-y-1">
          <li>
            <a routerLink="/admin/dashboard" 
               routerLinkActive="admin-nav-active"
               [routerLinkActiveOptions]="{exact: true}"
               class="admin-nav-link flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z"/>
              </svg>
              Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/admin/posts" 
               routerLinkActive="admin-nav-active"
               class="admin-nav-link flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
              Posts
            </a>
          </li>
          <li>
            <a routerLink="/admin/pages" 
               routerLinkActive="admin-nav-active"
               class="admin-nav-link flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Páginas
            </a>
          </li>
          <li>
            <a routerLink="/admin/menu" 
               routerLinkActive="admin-nav-active"
               class="admin-nav-link flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              Menú
            </a>
          </li>
          <li>
            <a routerLink="/admin/themes" 
               routerLinkActive="admin-nav-active"
               class="admin-nav-link flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"/>
              </svg>
              Temas
            </a>
          </li>
          <li>
            <a routerLink="/admin/categories" 
               routerLinkActive="admin-nav-active"
               class="admin-nav-link flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"/>
              </svg>
              Categorías
            </a>
          </li>
          <li>
            <a routerLink="/admin/tags" 
               routerLinkActive="admin-nav-active"
               class="admin-nav-link flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
              Tags
            </a>
          </li>
        </ul>
        
        <!-- Logout Button -->
        <div class="mt-8 pt-6 border-t border-slate-700">
          <button (click)="logout()" 
                  class="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Salir
          </button>
        </div>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-x-hidden xl:ml-0 transition-all duration-300 ease-in-out">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <!-- Mobile menu button and breadcrumbs -->
          <div class="flex items-center">
            <button (click)="toggleSidebar()" 
                    class="xl:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <nav class="hidden sm:flex ml-4" aria-label="Breadcrumb">
              <ol class="flex items-center space-x-2">
                <li>
                  <a href="/admin" class="text-gray-500 hover:text-gray-700 text-sm font-medium">
                    Admin
                  </a>
                </li>
                <li>
                  <svg class="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-gray-900 text-sm font-medium">{{ currentPageName }}</span>
                </li>
              </ol>
            </nav>
          </div>

          <!-- User menu -->
          <div class="flex items-center space-x-4">
            <!-- Notifications -->
            <button class="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </button>
            
            <!-- User profile -->
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-white">A</span>
              </div>
              <span class="hidden lg:block text-sm font-medium text-gray-900">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="bg-gray-50 min-h-screen">
        <div class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
          <router-outlet />
        </div>
      </main>
    </div>

    <!-- Toast Container -->
    <app-toast-container />

    <!-- Loading Overlay -->
    <div *ngIf="loading.isLoading()" class="admin-loading-overlay">
      <div class="admin-spinner" aria-label="Cargando"></div>
    </div>

    <!-- Mobile sidebar overlay -->
    <div *ngIf="sidebarOpen" 
         (click)="closeSidebar()" 
         class="xl:hidden fixed inset-0 bg-gray-600 bg-opacity-75 z-20"></div>
  </div>
  `
})
export class AdminLayoutComponent {
  private auth = inject(AdminAuthService);
  private router = inject(Router);
  protected loading = inject(LoadingService);
  
  // Component state
  sidebarOpen = false;
  appName = 'NGCMS Admin';
  currentPageName = 'Dashboard';

  constructor() {
    // Listen to route changes to update breadcrumbs
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.urlAfterRedirects)
    ).subscribe(url => {
      this.currentPageName = this.getPageNameFromUrl(url);
    });
  }

  logout() { 
    this.auth.logout(); 
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  private getPageNameFromUrl(url: string): string {
    const segments = url.split('/').filter(s => s);
    const lastSegment = segments[segments.length - 1];
    
    const pageNames: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'posts': 'Posts',
      'pages': 'Páginas',
      'menu': 'Menú',
      'themes': 'Temas',
      'categories': 'Categorías',
      'tags': 'Tags'
    };

    return pageNames[lastSegment] || 'Dashboard';
  }
}