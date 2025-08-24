import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../components/toast-container.component';
import type { ApiResponse } from '@cms-workspace/shared-types';

interface PostEntity { id: string; title: string; excerpt?: string; content: string; status: string; categories?: { slug: string }[]; tags?: { slug: string }[] }
interface TaxonomyItem { id: string; name: string; slug: string }

@Component({
  standalone: true,
  selector: 'app-post-editor',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">{{isNew() ? 'Nuevo Post' : 'Editar Post'}} </h1>
    <div class="flex gap-2">
      <button (click)="save('DRAFT')" class="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded disabled:opacity-60 transition-colors" [disabled]="saving()">Guardar Borrador</button>
      <button (click)="save('PUBLISHED')" class="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-60 transition-colors" [disabled]="saving()">Publicar</button>
    </div>
  </div>
  <form class="space-y-4" [formGroup]="form" (ngSubmit)="save()">
    <div class="grid md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-4">
        <div>
      <label for="title" class="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Título</label>
      <input id="title" type="text" formControlName="title" class="w-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm transition-colors" />
    </div>
    <div>
      <label for="excerpt" class="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Excerpt</label>
      <textarea id="excerpt" formControlName="excerpt" rows="3" class="w-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm transition-colors"></textarea>
    </div>
    <div>
      <label for="content" class="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Contenido (HTML permitido)</label>
      <textarea id="content" formControlName="content" rows="14" class="w-full border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2 text-sm font-mono bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 transition-colors" placeholder="<h2>Título</h2><p>Contenido...</p>"></textarea>
      <p class="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">Pega/edita HTML directamente. Se sanitiza al guardar.</p>
    </div>
      </div>
      <div class="space-y-6">
        <div>
          <p class="text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Categorías</p>
          <div class="max-h-40 overflow-auto border border-neutral-300 dark:border-neutral-600 rounded divide-y divide-neutral-200 dark:divide-neutral-700 bg-white dark:bg-neutral-800/60" *ngIf="categories().length; else noCats">
            <label class="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/70 transition-colors" *ngFor="let c of categories()">
              <input type="checkbox" [checked]="selectedCategories().includes(c.slug)" (change)="toggleCategory(c.slug, $any($event.target).checked)" />
              <span class="text-sm text-neutral-800 dark:text-neutral-200">{{c.name}}</span>
            </label>
          </div>
          <ng-template #noCats><p class="text-xs text-neutral-500 dark:text-neutral-400">Sin categorías</p></ng-template>
        </div>
        <div>
          <p class="text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Tags</p>
          <div class="max-h-40 overflow-auto border border-neutral-300 dark:border-neutral-600 rounded divide-y divide-neutral-200 dark:divide-neutral-700 bg-white dark:bg-neutral-800/60" *ngIf="tags().length; else noTags">
            <label class="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/70 transition-colors" *ngFor="let t of tags()">
              <input type="checkbox" [checked]="selectedTags().includes(t.slug)" (change)="toggleTag(t.slug, $any($event.target).checked)" />
              <span class="text-sm text-neutral-800 dark:text-neutral-200">{{t.name}}</span>
            </label>
          </div>
          <ng-template #noTags><p class="text-xs text-neutral-500 dark:text-neutral-400">Sin tags</p></ng-template>
        </div>
      </div>
    </div>
  </form>
  <p *ngIf="error()" class="text-sm text-red-600 dark:text-red-400 mt-4">{{error()}}</p>
  `
})
export class PostEditorComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toasts = inject(ToastService);
  id = signal<string | null>(null);
  isNew = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  categories = signal<TaxonomyItem[]>([]);
  tags = signal<TaxonomyItem[]>([]);
  selectedCategories = signal<string[]>([]);
  selectedTags = signal<string[]>([]);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    excerpt: [''],
    content: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor() {
  const paramId = this.route.snapshot.paramMap.get('id');
  if (paramId) { this.id.set(paramId); this.isNew.set(false); this.load(); } else { this.loadTaxonomy(); }
  }
  // sin editor enriquecido; el contenido se ingresa como HTML en textarea

  load() {
    this.http.get<ApiResponse<PostEntity>>(`/api/admin/posts/${this.id()}`).subscribe(r => {
      if (r.success) {
        const p = r.data as PostEntity;
        this.form.patchValue({ title: p.title, excerpt: p.excerpt || '', content: p.content });
        const hasSlug = (x: unknown): x is { slug: string } => {
          const obj = x as Record<string, unknown>;
          return typeof obj['slug'] === 'string';
        };
        const hasCategorySlug = (x: unknown): x is { category: { slug: string } } => {
          const obj = x as Record<string, unknown>;
          const cat = obj['category'] as Record<string, unknown> | undefined;
          return typeof cat?.['slug'] === 'string';
        };
        const hasTagSlug = (x: unknown): x is { tag: { slug: string } } => {
          const obj = x as Record<string, unknown>;
          const tag = obj['tag'] as Record<string, unknown> | undefined;
          return typeof tag?.['slug'] === 'string';
        };
        const catsAny = (p as unknown as Record<string, unknown>)['categories'] as unknown[] | undefined;
        const tagsAny = (p as unknown as Record<string, unknown>)['tags'] as unknown[] | undefined;
        const catSlugs = (catsAny || [])
          .map((c) => (hasSlug(c) ? c.slug : (hasCategorySlug(c) ? c.category.slug : undefined)))
          .filter((s): s is string => typeof s === 'string' && !!s);
        const tagSlugs = (tagsAny || [])
          .map((t) => (hasSlug(t) ? t.slug : (hasTagSlug(t) ? t.tag.slug : undefined)))
          .filter((s): s is string => typeof s === 'string' && !!s);
        this.selectedCategories.set(catSlugs);
        this.selectedTags.set(tagSlugs);
      }
      this.loadTaxonomy();
    });
  }
  loadTaxonomy() {
    this.http.get<ApiResponse<TaxonomyItem[]>>('/api/admin/taxonomy/categories').subscribe(r => { if (r.success) this.categories.set(r.data); });
    this.http.get<ApiResponse<TaxonomyItem[]>>('/api/admin/taxonomy/tags').subscribe(r => { if (r.success) this.tags.set(r.data); });
  }
  toggleCategory(slug: string, checked: boolean) {
    const cur = new Set(this.selectedCategories());
    if (checked) cur.add(slug); else cur.delete(slug);
    this.selectedCategories.set(Array.from(cur));
  }
  toggleTag(slug: string, checked: boolean) {
    const cur = new Set(this.selectedTags());
    if (checked) cur.add(slug); else cur.delete(slug);
    this.selectedTags.set(Array.from(cur));
  }

  save(status?: string) {
    if (this.form.invalid) return;
    this.saving.set(true);
  const payload = { ...this.form.getRawValue(), status: status || 'DRAFT', categories: this.selectedCategories(), tags: this.selectedTags() };
    let req;
    if (this.isNew()) req = this.http.post<ApiResponse<PostEntity>>('/api/admin/posts', payload);
    else req = this.http.put<ApiResponse<PostEntity>>(`/api/admin/posts/${this.id()}`, payload);
    req.subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          if (this.isNew()) {
            this.router.navigate(['/admin/posts', (r.data).id]);
            this.toasts.success('Post creado');
          } else {
            this.toasts.success('Post actualizado');
          }
        } else { this.error.set(r.message || 'Error'); this.toasts.error(this.error() || 'Error'); }
      },
      error: () => { this.saving.set(false); this.error.set('Error al guardar'); this.toasts.error('Error al guardar'); }
    });
  }
}
