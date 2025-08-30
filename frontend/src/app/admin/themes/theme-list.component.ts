import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlertComponent } from '../components/alert.component';
import { LoadingDirective } from '../directives/loading.directive';
import { SpinnerComponent } from '../components/spinner.component';
import type { ApiResponse } from '@cms-workspace/shared-types'; // Envelope genérico del backend (success, data)
// Definimos un alias claro para legibilidad local
type Envelope<T> = ApiResponse<T>; // El interceptor devuelve { success, message?, data }

interface AdminTheme { id: string; name: string; primaryColor?: string | null; secondaryColor?: string | null; customCss?: string | null; settings?: Record<string, unknown> | null; isActive: boolean; }

@Component({
  standalone: true,
  selector: 'app-theme-list',
  imports: [CommonModule, FormsModule, FontAwesomeModule, AlertComponent, LoadingDirective, SpinnerComponent ],
  // styles moved to global styles
  templateUrl: './theme-list.component.html'
})
export class ThemeListComponent implements OnInit {
  private http = inject(HttpClient);
  themes = signal<AdminTheme[]>([]);
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected success = signal<string | null>(null);
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  protected activatingId = signal<string | null>(null);
  protected savingId = signal<string | null>(null);
  protected deletingId = signal<string | null>(null);
  protected duplicatingId = signal<string | null>(null);
  protected creating = signal(false);
  protected createError = signal<string | null>(null);
  showNew = signal(false);
  newTheme: { name: string; primaryColor?: string; secondaryColor?: string; customCss?: string } = { name: '' };
  protected previewingId = signal<string | null>(null);
  private previewOriginal: { primary?: string; secondary?: string } | null = null;
  private hexRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  ngOnInit() { this.load(); }

  reload() { this.load(); }

  toggleNew() { this.showNew.set(!this.showNew()); }
  openNew() { this.showNew.set(true); }
  closeNew() { this.showNew.set(false); }

  private load() {
    if (this.loading()) return;
  this.loading.set(true); this.error.set(null); this.success.set(null);
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
  this.success.set('Tema creado'); this.startAutoHideSuccess();
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
  this.http.put<Envelope<unknown>>(`/api/admin/themes/${t.id}/activate`, {}).subscribe({
      next: () => {
        this.activatingId.set(null);
        this.reload();
        // Señal para refrescar tema activo en público
  try { localStorage.setItem('themeUpdated', String(Date.now())); } catch { /* noop */ }
  this.success.set('Tema activado'); this.startAutoHideSuccess();
      },
      error: () => { this.activatingId.set(null); }
    });
  }

  save(t: AdminTheme) {
    if (this.savingId()) return;
    this.savingId.set(t.id);
    const payload = { primaryColor: t.primaryColor, secondaryColor: t.secondaryColor, customCss: t.customCss };
    this.http.put<Envelope<AdminTheme>>(`/api/admin/themes/${t.id}/settings`, payload).subscribe({
  next: () => { this.savingId.set(null); this.reload(); this.success.set('Tema guardado'); this.startAutoHideSuccess(); },
      error: () => { this.savingId.set(null); }
    });
  }

  saveAndActivate(t: AdminTheme) {
    if (this.savingId() || this.activatingId()) return;
    this.savingId.set(t.id);
    const payload = { primaryColor: t.primaryColor, secondaryColor: t.secondaryColor, customCss: t.customCss };
  this.http.put<Envelope<unknown>>(`/api/admin/themes/${t.id}/settings-activate`, payload).subscribe({
  next: () => { this.savingId.set(null); this.activatingId.set(null); this.reload(); this.success.set('Tema guardado y activado'); this.startAutoHideSuccess(); },
      error: () => { this.savingId.set(null); }
    });
  }

  delete(t: AdminTheme) {
    if (this.deletingId()) return;
    if (!confirm(`Eliminar tema "${t.name}"?`)) return;
    this.deletingId.set(t.id);
  this.http.delete<Envelope<unknown>>(`/api/admin/themes/${t.id}`).subscribe({
  next: () => { this.deletingId.set(null); this.reload(); this.success.set('Tema eliminado'); this.startAutoHideSuccess(); },
      error: () => { this.deletingId.set(null); }
    });
  }

  duplicate(t: AdminTheme) {
    if (this.duplicatingId()) return;
    this.duplicatingId.set(t.id);
  this.http.post<Envelope<AdminTheme>>(`/api/admin/themes/${t.id}/duplicate`, {}).subscribe({
  next: () => { this.duplicatingId.set(null); this.reload(); this.success.set('Tema duplicado'); this.startAutoHideSuccess(); },
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

  private startAutoHideSuccess(){ if(this.successTimer) clearTimeout(this.successTimer); this.successTimer = setTimeout(()=> this.success.set(null), 4000); }
}
