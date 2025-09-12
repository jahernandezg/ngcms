import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertComponent } from '../components/alert.component';

interface PageEntity { id: string; title: string; slug: string; content: string; excerpt?: string; status: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string; isHomepage?: boolean }

@Component({
  standalone: true,
  selector: 'app-page-editor',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertComponent],
  // styles moved to global styles
  templateUrl: './page-editor.component.html',
})
export class PageEditorComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  id = signal<string | null>(null);
  isNew = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  slugChecking = signal(false);
  slugError = signal<string | null>(null);
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.minLength(3)]],
    excerpt: [''],
    content: ['', [Validators.required, Validators.minLength(10)]],
    seoTitle: [''],
    seoDescription: [''],
    seoKeywords: [''],
    isHomepage: [false],
    status: ['DRAFT']
  });
  // editor simple basado en textarea

  constructor() {
    const pid = this.route.snapshot.paramMap.get('id');
    if (pid) { this.id.set(pid); this.isNew.set(false); this.load(); }
  const nav = this.router.getCurrentNavigation?.();
  const flash = nav?.extras?.state && (nav.extras.state as Record<string, unknown>)['flash'];
  if (flash === 'created') { this.success.set('Página creada'); this.startAutoHideSuccess(); }
  }

  load() {
    this.http.get<unknown>(`/api/admin/pages/${this.id()}`).subscribe(raw => {
      const isPage = (v: unknown): v is PageEntity => !!v && typeof v === 'object' && 'id' in v && 'title' in v;
      const isEnvelope = (v: unknown): v is { data: unknown } => !!v && typeof v === 'object' && 'data' in v;
      const p = isPage(raw) ? raw : (isEnvelope(raw) && isPage(raw.data) ? raw.data : null);
      if (!p) return;
      this.form.patchValue({
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || '',
        content: p.content,
        seoTitle: p.seoTitle || '',
        seoDescription: p.seoDescription || '',
        seoKeywords: p.seoKeywords || '',
        isHomepage: p.isHomepage || false,
        status: p.status
      });
      const isLocked = p.status === 'PUBLISHED' && !!p.isHomepage;
      const ctrl = this.form.get('isHomepage');
      if (isLocked) ctrl?.disable({ emitEvent: false }); else ctrl?.enable({ emitEvent: false });
    });
  }

  checkSlug() {
    const slug = (this.form.value.slug||'').trim();
    if (!slug || !this.isNew()) return; // solo chequear en creación
    this.slugError.set(null);
    this.slugChecking.set(true);
    this.http.get<unknown>(`/api/pages/${encodeURIComponent(slug)}`).subscribe({
      next: (raw) => {
        const isPage = (v: unknown): v is { slug: string } => !!v && typeof v === 'object' && 'slug' in v;
        const isEnvelope = (v: unknown): v is { data: unknown } => !!v && typeof v === 'object' && 'data' in v;
        const p = isPage(raw) ? raw : (isEnvelope(raw) && isPage(raw.data) ? raw.data : null);
        if (p && p.slug === slug) this.slugError.set('Slug ya usado');
        this.slugChecking.set(false);
      },
      error: () => { // 404 => libre
        this.slugChecking.set(false);
      }
    });
  }

  save(status?: string) {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
  const raw = this.form.getRawValue();
  const payload = { ...raw, status: status || raw.status };
    let req;
    if (this.isNew()) req = this.http.post<unknown>(`/api/admin/pages`, payload);
    else req = this.http.put<unknown>(`/api/admin/pages/${this.id()}`, payload);
    req.subscribe({
      next: (raw) => {
        const isPage = (v: unknown): v is PageEntity => !!v && typeof v === 'object' && 'id' in v && 'title' in v;
        const isEnvelope = (v: unknown): v is { data: unknown } => !!v && typeof v === 'object' && 'data' in v;
        const p = isPage(raw) ? raw : (isEnvelope(raw) && isPage(raw.data) ? raw.data : null);
        this.saving.set(false);
        if (p?.id && this.isNew()) {
          // Navegar al editor de la nueva página con flash
          this.router.navigate(['/admin/pages', p.id], { state: { flash: 'created' } });
          this.success.set('Página creada');
          this.startAutoHideSuccess();
        } else if (p?.id && !this.isNew()) {
          // Mostrar éxito al actualizar, como en otros CRUDs
          const s = (payload as { status?: string }).status || 'DRAFT';
          this.success.set(s === 'PUBLISHED' ? 'Página publicada' : 'Página actualizada');
          this.startAutoHideSuccess();
        }
      },
  error: () => { this.saving.set(false); this.error.set('Error al guardar'); }
    });
  }

  private startAutoHideSuccess() {
    if (this.successTimer) clearTimeout(this.successTimer);
    this.successTimer = setTimeout(() => this.success.set(null), 4000);
  }

  ngOnDestroy(): void {
    if (this.successTimer) clearTimeout(this.successTimer);
  }

  deletePage() {
    if (!confirm('¿Eliminar página?')) return;
    this.http.delete(`/api/admin/pages/${this.id()}`).subscribe({
      next: () => { this.router.navigate(['/admin/pages']); },
      error: () => { this.error.set('Error al eliminar'); }
    });
  }
}
