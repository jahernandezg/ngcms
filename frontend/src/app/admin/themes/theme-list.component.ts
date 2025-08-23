import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import type { ApiResponse } from '@cms-workspace/shared-types'; // Envelope genérico del backend (success, data)
// Definimos un alias claro para legibilidad local
type Envelope<T> = ApiResponse<T>; // El interceptor devuelve { success, message?, data }

interface AdminTheme { id: string; name: string; primaryColor?: string | null; secondaryColor?: string | null; customCss?: string | null; settings?: Record<string, unknown> | null; isActive: boolean; }

@Component({
  standalone: true,
  selector: 'app-theme-list',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Temas</h1>
      <div class="flex gap-2">
        <a href="/admin/themes/customize" class="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          🎨 Visual Customizer
        </a>
        <button class="btn btn-sm" (click)="reload()" [disabled]="loading()">Recargar</button>
      </div>
    </div>

  <details class="border rounded p-3 bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 transition-colors">
      <summary class="cursor-pointer select-none font-medium text-sm">Nuevo tema</summary>
      <form class="mt-3 space-y-3" (ngSubmit)="createNew()" #newForm="ngForm">
        <div class="flex flex-wrap gap-4">
          <div>
            <label for="newName" class="block text-xs text-neutral-600 mb-1">Nombre *</label>
            <input id="newName" name="name" required minlength="2" [(ngModel)]="newTheme.name" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" />
          </div>
          <div>
            <label for="newPrimary" class="block text-xs text-neutral-600 mb-1">Primario</label>
            <input id="newPrimary" name="primaryColor" type="text" placeholder="#ffcc00" [(ngModel)]="newTheme.primaryColor" pattern="^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$" class="h-9 w-28 border rounded px-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" [class.border-red-500]="newTheme.primaryColor && !isValidHex(newTheme.primaryColor)" />
            <p *ngIf="newTheme.primaryColor && !isValidHex(newTheme.primaryColor)" class="text-[10px] text-red-600 mt-1">Formato hex inválido</p>
          </div>
          <div>
            <label for="newSecondary" class="block text-xs text-neutral-600 mb-1">Secundario</label>
            <input id="newSecondary" name="secondaryColor" type="text" placeholder="#111827" [(ngModel)]="newTheme.secondaryColor" pattern="^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$" class="h-9 w-28 border rounded px-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" [class.border-red-500]="newTheme.secondaryColor && !isValidHex(newTheme.secondaryColor)" />
            <p *ngIf="newTheme.secondaryColor && !isValidHex(newTheme.secondaryColor)" class="text-[10px] text-red-600 mt-1">Formato hex inválido</p>
          </div>
        </div>
        <div>
          <label for="newCss" class="block text-xs text-neutral-600 mb-1">Custom CSS</label>
          <textarea id="newCss" name="customCss" rows="3" [(ngModel)]="newTheme.customCss" class="w-full font-mono text-xs border rounded p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors"></textarea>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-xs" type="submit" [disabled]="creating() || newForm.invalid || !colorsValid(newTheme.primaryColor, newTheme.secondaryColor)">Crear</button>
          <button class="btn btn-xs" type="button" (click)="resetNew()" [disabled]="creating()">Limpiar</button>
        </div>
        <div *ngIf="createError()" class="text-xs text-red-600">{{createError()}}</div>
      </form>
    </details>

  <div *ngIf="error()" class="p-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-sm rounded">{{error()}}</div>

  <div *ngIf="loading()" class="text-sm text-neutral-500 dark:text-neutral-400">Cargando...</div>

  <table class="min-w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded overflow-hidden transition-colors" *ngIf="!loading() && themes().length">
      <thead>
  <tr class="text-left border-b border-gray-200 dark:border-gray-700">
          <th class="py-2 pr-2">Nombre</th>
          <th class="py-2 pr-2">Colores</th>
          <th class="py-2 pr-2">Activo</th>
          <th class="py-2 pr-2 w-72">Editar</th>
          <th class="py-2 pr-2">Acciones</th>
        </tr>
      </thead>
      <tbody>
  <tr *ngFor="let t of themes()" class="border-b last:border-0 border-gray-200 dark:border-gray-700">
          <td class="py-2 pr-2 font-medium">{{t.name}}</td>
          <td class="py-2 pr-2">
            <div class="flex items-center gap-2">
              <span *ngIf="t.primaryColor" class="inline-block w-5 h-5 rounded border" [style.background]="t.primaryColor"></span>
              <span *ngIf="t.secondaryColor" class="inline-block w-5 h-5 rounded border" [style.background]="t.secondaryColor"></span>
            </div>
          </td>
          <td class="py-2 pr-2">
            <span *ngIf="t.isActive" class="text-green-600 font-semibold">Sí</span>
            <button *ngIf="!t.isActive" class="text-xs text-blue-600 underline" (click)="activate(t)" [disabled]="activatingId()===t.id">Activar</button>
          </td>
          <td class="py-2 pr-2 align-top">
            <div class="space-y-2">
              <details>
                <summary class="cursor-pointer select-none text-xs text-neutral-700 dark:text-neutral-300">Editar</summary>
                <form class="mt-2 space-y-2" (ngSubmit)="save(t)" #f="ngForm">
                  <div class="flex items-center gap-2">
                    <label for="p-{{t.id}}" class="w-24 text-xs text-neutral-600">Primario</label>
                    <input id="p-{{t.id}}" type="text" name="primaryColor" [(ngModel)]="t.primaryColor" placeholder="#ffcc00" class="h-8 w-28 border rounded px-2 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" [class.border-red-500]="t.primaryColor && !isValidHex(t.primaryColor)" />
                  </div>
                  <div class="flex items-center gap-2">
                    <label for="s-{{t.id}}" class="w-24 text-xs text-neutral-600">Secundario</label>
                    <input id="s-{{t.id}}" type="text" name="secondaryColor" [(ngModel)]="t.secondaryColor" placeholder="#000000" class="h-8 w-28 border rounded px-2 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" [class.border-red-500]="t.secondaryColor && !isValidHex(t.secondaryColor)" />
                  </div>
                  <div>
                    <label for="css-{{t.id}}" class="block text-xs text-neutral-600 mb-1">Custom CSS</label>
                    <textarea id="css-{{t.id}}" name="customCss" [(ngModel)]="t.customCss" rows="4" class="w-full font-mono text-xs border rounded p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors"></textarea>
                  </div>
                  <div class="flex gap-2">
                    <button class="btn btn-xs" type="submit" [disabled]="savingId()===t.id || !colorsValid(t.primaryColor, t.secondaryColor)">Guardar</button>
                    <button class="btn btn-xs" type="button" (click)="saveAndActivate(t)" [disabled]="savingId()===t.id || activatingId()===t.id || !colorsValid(t.primaryColor, t.secondaryColor)">Guardar y activar</button>
                    <button type="button" class="btn btn-xs" (click)="preview(t)">{{ previewingId()===t.id ? 'Cerrar' : 'Preview' }}</button>
                  </div>
                  <p *ngIf="(t.primaryColor && !isValidHex(t.primaryColor)) || (t.secondaryColor && !isValidHex(t.secondaryColor))" class="text-[10px] text-red-600">Corregir colores hex (#RGB o #RRGGBB).</p>
                </form>
              </details>
            </div>
          </td>
          <td class="py-2 pr-2 align-top">
            <div class="flex flex-col gap-1">
              <button class="text-xs text-blue-600 underline text-left" (click)="duplicate(t)">Duplicar</button>
              <button class="text-xs text-red-600 underline text-left" (click)="delete(t)" [disabled]="deletingId()===t.id">Eliminar</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

  <div *ngIf="!loading() && !themes().length" class="text-sm text-neutral-500 dark:text-neutral-400">Sin temas.</div>
  </div>
  `
})
export class ThemeListComponent implements OnInit {
  private http = inject(HttpClient);
  themes = signal<AdminTheme[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected activatingId = signal<string | null>(null);
  protected savingId = signal<string | null>(null);
  protected deletingId = signal<string | null>(null);
  protected duplicatingId = signal<string | null>(null);
  protected creating = signal(false);
  protected createError = signal<string | null>(null);
  newTheme: { name: string; primaryColor?: string; secondaryColor?: string; customCss?: string } = { name: '' };
  protected previewingId = signal<string | null>(null);
  private previewOriginal: { primary?: string; secondary?: string } | null = null;
  private hexRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  ngOnInit() { this.load(); }

  reload() { this.load(); }

  private load() {
    if (this.loading()) return;
    this.loading.set(true); this.error.set(null);
    this.http.get<Envelope<AdminTheme[]>>('/api/admin/themes').subscribe({
      next: (r) => {
        if (r && r.success) {
          this.themes.set(r.data ?? []);
        } else {
          this.themes.set([]);
        }
        this.loading.set(false);
      },
      error: () => { this.error.set('Error cargando temas'); this.loading.set(false); }
    });
  }

  createNew() {
    if (this.creating() || !this.newTheme.name.trim()) return;
    if (!this.colorsValid(this.newTheme.primaryColor, this.newTheme.secondaryColor)) return;
    this.creating.set(true); this.createError.set(null);
    const payload = { ...this.newTheme };
    this.http.post<Envelope<AdminTheme>>('/api/admin/themes', payload).subscribe({
      next: (r) => {
        if (!r.success) this.createError.set(r.message || 'Error creando tema');
        this.creating.set(false);
        this.resetNew();
        this.reload();
      },
      error: () => { this.createError.set('Error creando tema'); this.creating.set(false); }
    });
  }

  resetNew() { this.newTheme = { name: '' }; }

  isValidHex(v?: string | null) { if (!v) return true; return this.hexRegex.test(v.trim()); }
  colorsValid(p?: string | null, s?: string | null) { return this.isValidHex(p) && this.isValidHex(s); }

  activate(t: AdminTheme) {
    if (this.activatingId()) return;
    this.activatingId.set(t.id);
  this.http.put<Envelope<unknown>>(`/api/admin/themes/${t.id}/active`, {}).subscribe({
      next: () => { this.activatingId.set(null); this.reload(); },
      error: () => { this.activatingId.set(null); }
    });
  }

  save(t: AdminTheme) {
    if (this.savingId()) return;
    this.savingId.set(t.id);
    const payload = { primaryColor: t.primaryColor, secondaryColor: t.secondaryColor, customCss: t.customCss };
    this.http.put<Envelope<AdminTheme>>(`/api/admin/themes/${t.id}/settings`, payload).subscribe({
      next: () => { this.savingId.set(null); this.reload(); },
      error: () => { this.savingId.set(null); }
    });
  }

  saveAndActivate(t: AdminTheme) {
    if (this.savingId() || this.activatingId()) return;
    this.savingId.set(t.id);
    const payload = { primaryColor: t.primaryColor, secondaryColor: t.secondaryColor, customCss: t.customCss };
  this.http.put<Envelope<unknown>>(`/api/admin/themes/${t.id}/settings-activate`, payload).subscribe({
      next: () => { this.savingId.set(null); this.activatingId.set(null); this.reload(); },
      error: () => { this.savingId.set(null); }
    });
  }

  delete(t: AdminTheme) {
    if (this.deletingId()) return;
    if (!confirm(`Eliminar tema "${t.name}"?`)) return;
    this.deletingId.set(t.id);
  this.http.delete<Envelope<unknown>>(`/api/admin/themes/${t.id}`).subscribe({
      next: () => { this.deletingId.set(null); this.reload(); },
      error: () => { this.deletingId.set(null); }
    });
  }

  duplicate(t: AdminTheme) {
    if (this.duplicatingId()) return;
    this.duplicatingId.set(t.id);
  this.http.post<Envelope<AdminTheme>>(`/api/admin/themes/${t.id}/duplicate`, {}).subscribe({
      next: () => { this.duplicatingId.set(null); this.reload(); },
      error: () => { this.duplicatingId.set(null); }
    });
  }

  preview(t: AdminTheme) {
    if (this.previewingId() === t.id) {
      this.cancelPreview();
      return;
    }
    // Si hay otro preview activo lo quitamos primero
    if (this.previewingId()) this.cancelPreview();
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // Guardar valores actuales inline (si existen)
    this.previewOriginal = {
      primary: root.style.getPropertyValue('--color-primary') || undefined,
      secondary: root.style.getPropertyValue('--color-secondary') || undefined
    };
    if (t.primaryColor) root.style.setProperty('--color-primary', t.primaryColor);
    if (t.secondaryColor) root.style.setProperty('--color-secondary', t.secondaryColor);
    // Style tag temporal
    const existing = document.getElementById('preview-theme-inline');
    if (existing) existing.remove();
    if (t.customCss) {
      const styleEl = document.createElement('style');
      styleEl.id = 'preview-theme-inline';
      styleEl.textContent = t.customCss || '';
      document.head.appendChild(styleEl);
    }
    this.previewingId.set(t.id);
  }

  private cancelPreview() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const styleEl = document.getElementById('preview-theme-inline');
    if (styleEl) styleEl.remove();
    if (this.previewOriginal) {
      if (this.previewOriginal.primary !== undefined) root.style.setProperty('--color-primary', this.previewOriginal.primary); else root.style.removeProperty('--color-primary');
      if (this.previewOriginal.secondary !== undefined) root.style.setProperty('--color-secondary', this.previewOriginal.secondary); else root.style.removeProperty('--color-secondary');
    }
    this.previewOriginal = null;
    this.previewingId.set(null);
  }
}
