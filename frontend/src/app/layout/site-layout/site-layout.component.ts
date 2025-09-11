import { Component, ElementRef, ViewChild, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainNavComponent } from '../main-nav/main-nav.component';
import { ThemeService } from '../../shared/theme.service';
import { SiteSettingsService } from '../../shared/site-settings.service';
import { buildAssetUrl } from '../../shared/asset-url.util';


@Component({
  standalone: true,
  selector: 'app-site-layout',
  imports: [CommonModule, RouterModule, MainNavComponent],
  styleUrls: ['./site-layout.component.css'],
  templateUrl: './site-layout.component.html',
})

export class SiteLayoutComponent implements AfterViewInit {
  readonly year = new Date().getFullYear();
  #theme = inject(ThemeService);
  // Exponer para bindings en template
  theme = this.#theme;
  settings = inject(SiteSettingsService);
  @ViewChild('shell', { static: true }) shell!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    // Adjunta el contenedor público para que las variables se apliquen sólo dentro de este layout
    this.#theme.attachContainer(this.shell.nativeElement);
    this.#theme.load();
  }

   logoSrc() {
      const s = this.settings.settings();
      const chosen = this.theme.darkMode() ? (s?.logoDark || s?.logoLight) : (s?.logoLight || s?.logoDark);
      return buildAssetUrl(chosen) || undefined;
    }
}
