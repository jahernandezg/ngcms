import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenuService, MenuItem } from '../../shared/menu.service';
import { ThemeService } from '../../shared/theme.service';
import { SiteSettingsService } from '../../shared/site-settings.service';
import { buildAssetUrl } from '../../shared/asset-url.util';

@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.css'],
})
export class MainNavComponent implements OnInit {
  private menu = inject(MenuService);
  readonly items = this.menu.items;
  openSubmenu = signal<string | null>(null);
  theme = inject(ThemeService);
  settings = inject(SiteSettingsService);

  isMenuOpen = false;

  logoSrc() {
    const s = this.settings.settings();
    const chosen = this.theme.darkMode() ? (s?.logoDark || s?.logoLight) : (s?.logoLight || s?.logoDark);
    return buildAssetUrl(chosen) || undefined;
  }

  ngOnInit() {
    this.menu.load();
    // Asegura carga de tema solo en contexto público
    this.theme.load();
  this.settings.load();
    console.log('theme.darkMode()', this.theme.darkMode());
  }

  isInternal(item: MenuItem) { return item.type !== 'EXTERNAL_LINK'; }

  linkFor(item: MenuItem) { return this.menu.buildLink(item); }
  queryParamsFor(_item: MenuItem) { return null; }

  onParentClick(ev: Event, item: MenuItem) {
    if (!item.children?.length) return; // comportamiento normal
    if (this.openSubmenu() !== item.id) {
      ev.preventDefault();
      this.openSubmenu.set(item.id);
      this.focusFirstChildAsync(item.id);
    } else {
      // segunda pulsación dejará navegar (no preventDefault)
      this.openSubmenu.set(null);
    }
  }

  onParentKeydown(ev: KeyboardEvent, item: MenuItem) {
    if (!item.children?.length) return;
    if (['Enter',' '].includes(ev.key)) { ev.preventDefault(); this.toggleSub(item.id); this.focusFirstChildAsync(item.id); }
    else if (ev.key === 'Escape') { this.openSubmenu.set(null); (ev.target as HTMLElement).focus(); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); if (this.openSubmenu() !== item.id) { this.openSubmenu.set(item.id); } this.focusFirstChildAsync(item.id); }
  }

  private toggleSub(id: string) { this.openSubmenu.set(this.openSubmenu() === id ? null : id); }

  private focusFirstChildAsync(parentId: string) {
    queueMicrotask(() => {
      if (this.openSubmenu() !== parentId) return;
      const el = document.querySelector('li.has-children ul[role=menu] a[role=menuitem]') as HTMLElement | null;
      el?.focus();
    });
  }
  toggleDark() {
    console.log('theme.darkMode()', this.theme.darkMode());
    this.theme.toggleDarkMode();
   }

  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  toggleMobileSubmenu(item: MenuItem) {
    item.isOpen = !item.isOpen;
  }
}
