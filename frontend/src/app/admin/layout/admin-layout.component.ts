import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from '../components/toast-container.component';
import { AdminHeaderComponent } from '../components/header.component';
import { AdminSidebarComponent } from '../components/sidebar.component';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';
import { LoadingService } from '../services/loading.service';
import { filter, map } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterModule, ToastContainerComponent, AdminHeaderComponent, AdminSidebarComponent],
  // styles moved to global styles
  templateUrl: './admin-layout.component.html',
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

    // Open sidebar by default on large screens
    try {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        this.sidebarOpen = true;
      }
    } catch { /* noop for SSR */ }
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
