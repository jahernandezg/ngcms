import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

interface CategoryDto { id: string; name: string; slug: string; parentId?: string | null; createdAt: string; }
interface TagDto { id: string; name: string; slug: string; createdAt: string; }
interface CreateCategoryDto { name: string; parentSlug?: string; }
interface UpdateCategoryDto { name?: string; parentSlug?: string; }
interface CreateTagDto { name: string; }
interface UpdateTagDto { name?: string; }

interface PaginationMeta { total?: number; page?: number; limit?: number; [k: string]: unknown }
interface Envelope<T> { success: boolean; data: T; meta?: PaginationMeta; }

@Injectable({ providedIn: 'root' })
export class TaxonomyService {
  private http = inject(HttpClient);

  categories = signal<CategoryDto[]>([]);
  tags = signal<TagDto[]>([]);
  loadingCategories = signal(false);
  loadingTags = signal(false);

  loadCategories() {
    this.loadingCategories.set(true);
  this.http.get<Envelope<CategoryDto[]>>('/api/admin/taxonomy/categories').subscribe({
      next: res => this.categories.set(res.data),
      error: err => { console.error('loadCategories failed', err); },
      complete: () => this.loadingCategories.set(false)
    });
  }

  loadTags() {
    this.loadingTags.set(true);
  this.http.get<Envelope<TagDto[]>>('/api/admin/taxonomy/tags').subscribe({
      next: res => this.tags.set(res.data),
      error: err => { console.error('loadTags failed', err); },
      complete: () => this.loadingTags.set(false)
    });
  }

  createCategory(dto: CreateCategoryDto) {
    return this.http.post<Envelope<CategoryDto>>('/api/admin/taxonomy/categories', dto);
  }
  updateCategory(slug: string, dto: UpdateCategoryDto) {
    return this.http.put<Envelope<CategoryDto>>(`/api/admin/taxonomy/categories/${slug}`, dto);
  }
  deleteCategory(slug: string) {
    return this.http.delete<Envelope<{ id: string }>>(`/api/admin/taxonomy/categories/${slug}`);
  }

  createTag(dto: CreateTagDto) { return this.http.post<Envelope<TagDto>>('/api/admin/taxonomy/tags', dto); }
  updateTag(slug: string, dto: UpdateTagDto) { return this.http.put<Envelope<TagDto>>(`/api/admin/taxonomy/tags/${slug}`, dto); }
  deleteTag(slug: string) { return this.http.delete<Envelope<{ id: string }>>(`/api/admin/taxonomy/tags/${slug}`); }
}
