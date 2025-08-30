import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
// import { ToastService } from '../components/toast-container.component';
import { AlertComponent } from '../components/alert.component';
import type { ApiResponse } from '@cms-workspace/shared-types';

interface PostEntity { id: string; title: string; excerpt?: string; content: string; status: string; categories?: { slug: string }[]; tags?: { slug: string }[] }
interface TaxonomyItem { id: string; name: string; slug: string }

@Component({
  standalone: true,
  selector: 'app-post-editor',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertComponent],
  // styles moved to global styles to respect build budgets
  templateUrl: './post-editor.component.html',
})
export class PostEditorComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  // private toasts = inject(ToastService);
  id = signal<string | null>(null);
  isNew = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  private successTimer: ReturnType<typeof setTimeout> | null = null;
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
  // Mensaje flash al navegar después de crear
  const nav = this.router.getCurrentNavigation?.();
  const flash = nav?.extras?.state && (nav.extras.state as Record<string, unknown>)['flash'];
  if (flash === 'created') this.success.set('Post creado');
  if (flash === 'created') this.startAutoHideSuccess();
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
  this.error.set(null);
  this.success.set(null);
  const payload = { ...this.form.getRawValue(), status: status || 'DRAFT', categories: this.selectedCategories(), tags: this.selectedTags() };
    let req;
    if (this.isNew()) req = this.http.post<ApiResponse<PostEntity>>('/api/admin/posts', payload);
    else req = this.http.put<ApiResponse<PostEntity>>(`/api/admin/posts/${this.id()}`, payload);
    req.subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          if (this.isNew()) {
            this.router.navigate(['/admin/posts', (r.data).id], { state: { flash: 'created' } });
          } else {
      this.success.set('Post actualizado');
            this.startAutoHideSuccess();
          }
        } else { this.error.set(r.message || 'Error'); }
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
}
