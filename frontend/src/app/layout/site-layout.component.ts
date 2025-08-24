import { Component, ElementRef, ViewChild, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainNavComponent } from '../shared/main-nav.component';
import { ThemeService } from '../shared/theme.service';

@Component({
  standalone: true,
  selector: 'app-site-layout',
  imports: [CommonModule, RouterModule, MainNavComponent],
  styleUrls: ['./site-layout.component.css'],
  template: `
  <div #shell data-theme-scope class="site-shell min-h-screen flex flex-col bg-bg-app text-text-app">
    <app-main-nav />
    <main class="flex-1 px-4 py-6">
      <router-outlet />
    </main>
  <footer class="mt-auto border-t border-border-app text-text-secondary text-xs p-4 text-center opacity-70">© {{ year }} CMS</footer>
  </div>
  `
})

export class SiteLayoutComponent implements AfterViewInit { 
  readonly year = new Date().getFullYear();
  #theme = inject(ThemeService);
  @ViewChild('shell', { static: true }) shell!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    // Adjunta el contenedor público para que las variables se apliquen sólo dentro de este layout
    this.#theme.attachContainer(this.shell.nativeElement);
    this.#theme.load();
  }
}
