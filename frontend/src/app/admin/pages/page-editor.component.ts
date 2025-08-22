import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface PageEntity { id: string; title: string; slug: string; content: string; excerpt?: string; status: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string; isHomepage?: boolean }

@Component({
  standalone: true,
  selector: 'app-page-editor',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-semibold">{{isNew() ? 'Nueva Página' : 'Editar Página'}}</h1>
    <div class="flex gap-2">
  <button (click)="save('DRAFT')" class="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors" [disabled]="saving()">Guardar Borrador</button>
  <button (click)="save('PUBLISHED')" class="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors" [disabled]="saving()">Publicar</button>
    </div>
  </div>
  <form class="space-y-6" [formGroup]="form" (ngSubmit)="save()">
    <div class="grid md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1" for="title">Título</label>
          <input id="title" type="text" formControlName="title" class="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="slug">Slug</label>
          <div class="flex gap-2 items-center">
            <input id="slug" type="text" formControlName="slug" class="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" (blur)="checkSlug()" />
            <span *ngIf="slugChecking()" class="text-xs text-gray-500">Verificando…</span>
            <span *ngIf="slugError()" class="text-xs text-red-600">{{slugError()}}</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="excerpt">Excerpt</label>
          <textarea id="excerpt" rows="3" formControlName="excerpt" class="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="content">Contenido (HTML permitido)</label>
          <textarea id="content" rows="16" formControlName="content" class="w-full border rounded px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" placeholder="<h2>Título</h2><p>Contenido...</p>"></textarea>
          <p class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">Escribe o pega HTML. Se sanitiza al guardar.</p>
        </div>
      </div>
      <div class="space-y-6">
  <fieldset class="border rounded p-3 space-y-3 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors">
          <legend class="text-sm font-medium">SEO</legend>
          <div>
            <label class="block text-xs font-medium mb-1" for="seoTitle">SEO Title</label>
            <input id="seoTitle" type="text" formControlName="seoTitle" class="w-full border rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" for="seoDescription">SEO Description</label>
            <textarea id="seoDescription" rows="2" formControlName="seoDescription" class="w-full border rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors"></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" for="seoKeywords">SEO Keywords</label>
            <input id="seoKeywords" type="text" formControlName="seoKeywords" class="w-full border rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" />
          </div>
        </fieldset>
        <div class="flex items-center gap-2">
          <input id="isHomepage" type="checkbox" formControlName="isHomepage" />
          <label for="isHomepage" class="text-sm">Marcar como homepage</label>
        </div>
        <div class="flex gap-2">
          <a *ngIf="!isNew() && form.value.slug" [href]="'/pages/' + form.value.slug" target="_blank" rel="noopener" class="text-xs underline">Ver pública</a>
        </div>
        <div *ngIf="!isNew()" class="text-xs text-gray-500">Estado actual: {{form.value.status}}</div>
        <button type="button" (click)="deletePage()" *ngIf="!isNew()" class="text-xs text-red-600 underline">Eliminar</button>
      </div>
    </div>
  </form>
  <p *ngIf="error()" class="text-sm text-red-600 mt-4">{{error()}}</p>
  `
})
export class PageEditorComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  id = signal<string | null>(null);
  isNew = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
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
        if (p?.id && this.isNew()) { this.router.navigate(['/admin/pages', p.id]); }
      },
      error: () => { this.saving.set(false); this.error.set('Error al guardar'); }
    });
  }

  deletePage() {
    if (!confirm('¿Eliminar página?')) return;
    this.http.delete(`/api/admin/pages/${this.id()}`).subscribe({
      next: () => { this.router.navigate(['/admin/pages']); },
      error: () => { this.error.set('Error al eliminar'); }
    });
  }
}
