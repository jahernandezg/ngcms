import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainNavComponent } from '../shared/main-nav.component';
import { ThemeService } from '../shared/theme.service';

@Component({
  standalone: true,
  selector: 'app-site-layout',
  imports: [CommonModule, RouterModule, MainNavComponent],
  template: `
  <div class="site-shell min-h-screen flex flex-col bg-bg-app text-text-app">
    <app-main-nav />
    <main class="flex-1 px-4 py-6">
      <router-outlet />
    </main>
    <footer class="mt-auto border-t border-gray-200 dark:border-gray-700 text-xs p-4 text-center opacity-70">© {{ year }} CMS</footer>
  </div>
  `
})

export class SiteLayoutComponent { 
  readonly year = new Date().getFullYear();
  #theme = inject(ThemeService);
  constructor(){
    // Carga redundante para garantizar aplicación de variables incluso si el nav no monta por alguna condición
    this.#theme.load();
  }
}
