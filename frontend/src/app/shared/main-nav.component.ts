import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenuService, MenuItem } from './menu.service';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <nav class="bg-bg-app backdrop-blur border-b border-border-app shadow-sm mb-4 transition-colors text-text-app" role="navigation" aria-label="Main">
      <div class="container mx-auto px-4 py-2 flex flex-wrap items-center gap-4">
        <a routerLink="/" class="font-semibold text-lg tracking-tight">CMS</a>
        <ul class="flex flex-wrap gap-4" *ngIf="items().length; else loadingTpl" role="menubar">
          <ng-container *ngFor="let item of items(); let i = index">
            <li class="relative" [class.has-children]="item.children?.length" role="none">
     <a *ngIf="isInternal(item); else extTpl"
            [routerLink]="linkFor(item)"
            [queryParams]="queryParamsFor(item)"
       class="hover:text-primary transition-colors"
                 role="menuitem"
                 [attr.aria-haspopup]="item.children?.length ? 'true': null"
                 [attr.aria-expanded]="item.children?.length ? (openSubmenu() === item.id) : null"
                 (click)="onParentClick($event, item)"
                 (keydown)="onParentKeydown($event, item)"
                 [attr.target]="item.openNewWindow? '_blank': null"
                 >{{ item.title }}</a>
              <ng-template #extTpl>
                <a [href]="item.url" class="hover:text-primary transition-colors" role="menuitem" [attr.target]="item.openNewWindow? '_blank': null" rel="noopener noreferrer">{{ item.title }}</a>
              </ng-template>
              <ul *ngIf="item.children?.length"
                  class="absolute left-0 top-full bg-bg-app border border-border-app shadow-lg rounded min-w-[10rem] z-20 focus:outline-none"
                  [class.hidden]="openSubmenu() !== item.id"
                  role="menu"
                  [attr.aria-label]="item.title">
                <li *ngFor="let c of item.children; let ci = index" class="px-4 py-2 hover:bg-[var(--color-surface-alt)]" role="none">
                  <a [routerLink]="linkFor(c)" [queryParams]="queryParamsFor(c)" *ngIf="isInternal(c); else extSubTpl" class="block w-full" role="menuitem" tabindex="-1">{{ c.title }}</a>
                  <ng-template #extSubTpl>
                    <a [href]="c.url" class="block w-full" role="menuitem" tabindex="-1" [attr.target]="c.openNewWindow? '_blank': null" rel="noopener noreferrer">{{ c.title }}</a>
                  </ng-template>
                </li>
              </ul>
            </li>
          </ng-container>
        </ul>
        <button type="button" class="ml-auto text-sm px-2 py-1 border rounded border-border-app" (click)="toggleDark()" [attr.aria-pressed]="theme.darkMode()">{{ theme.darkMode() ? 'Light' : 'Dark' }}</button>
        <ng-template #loadingTpl>
          <span class="text-sm text-text-secondary">Cargando menú…</span>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    :host { display:block; }
    nav ul { list-style:none; margin:0; padding:0; }
    li.has-children > a { position: relative; padding-right: 1rem; }
    li.has-children > a::after { content:'▾'; position:absolute; right:0.25rem; top:50%; transform:translateY(-50%); font-size:.65rem; }
    ul[role=menu] { animation: fadeIn .12s ease-in; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(4px);} to { opacity:1; transform:translateY(0);} }
  `]
})
export class MainNavComponent implements OnInit {
  private menu = inject(MenuService);
  readonly items = this.menu.items;
  openSubmenu = signal<string | null>(null);
  theme = inject(ThemeService);

  ngOnInit() { 
    this.menu.load();
    // Asegura carga de tema solo en contexto público
    this.theme.load();
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
  toggleDark() { this.theme.toggleDarkMode(); }
}
