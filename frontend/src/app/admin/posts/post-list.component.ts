import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminPostsService } from '../services/admin-posts.service';
import { ToastService } from '../components/toast-container.component';
import { TaxonomyService } from '../taxonomy/taxonomy.service';

interface PostListItem { id: string; title: string; status: string; updatedAt: string; authorName?: string; categories?: { name: string; slug: string }[]; tags?: { name: string; slug: string }[]; }

@Component({
  standalone: true,
  selector: 'app-admin-post-list',
  imports: [CommonModule, RouterModule],
  template: `
  <div class="mb-4 space-y-3">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <h1 class="text-2xl font-semibold">Posts</h1>
  <a routerLink="/admin/posts/new" class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">Nuevo</a>
    </div>
    <form class="flex flex-wrap gap-3 items-end text-sm" (submit)="applyFilters($event)">
      <div>
  <label for="filter-status" class="block mb-1 text-xs uppercase tracking-wide">Status</label>
  <select id="filter-status" #stSel class="border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" [value]="status()" (change)="setStatus(stSel.value)">
          <option value="">Todos</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>
      </div>
      <div>
  <label for="filter-category" class="block mb-1 text-xs uppercase tracking-wide">Categoría</label>
  <select id="filter-category" #catSel class="border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" [value]="category()" (change)="setCategory(catSel.value)">
          <option value="">Todas</option>
          <option *ngFor="let c of tax.categories()" [value]="c.slug">{{c.name}}</option>
        </select>
      </div>
      <div>
  <label for="filter-tag" class="block mb-1 text-xs uppercase tracking-wide">Tag</label>
  <select id="filter-tag" #tagSel class="border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" [value]="tag()" (change)="setTag(tagSel.value)">
          <option value="">Todos</option>
          <option *ngFor="let t of tax.tags()" [value]="t.slug">{{t.name}}</option>
        </select>
      </div>
      <div class="flex flex-col">
        <label for="q" class="block mb-1 text-xs uppercase tracking-wide">Buscar</label>
  <input #qInput id="q" type="text" class="border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors" [value]="q()" (keyup.enter)="applyFilters($event)" (change)="setQ(qInput.value)" placeholder="título o contenido" />
      </div>
      <div class="flex gap-2">
  <button type="submit" class="px-3 py-1 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Filtrar</button>
  <button type="button" class="px-3 py-1 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" (click)="resetFilters()" *ngIf="isFiltered()">Reset</button>
      </div>
    </form>
  </div>
  <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded transition-colors">
    <table class="w-full text-sm">
  <thead class="bg-gray-50 dark:bg-gray-700/60 text-left transition-colors">
        <tr>
          <th class="p-2">Título</th>
          <th class="p-2">Status</th>
          <th class="p-2">Taxonomías</th>
          <th class="p-2">Actualizado</th>
          <th class="p-2 w-1">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of posts()" class="border-t align-top">
          <td class="p-2">{{p.title}}</td>
          <td class="p-2"><span [ngClass]="badgeClass(p.status)" class="px-2 py-0.5 rounded text-xs font-medium">{{p.status}}</span></td>
          <td class="p-2">
            <div class="flex flex-wrap gap-1" *ngIf="(p.categories?.length||0)+(p.tags?.length||0) > 0; else noTax">
              <ng-container *ngFor="let c of p.categories">
                <span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium">C: {{c.name}}</span>
              </ng-container>
              <ng-container *ngFor="let t of p.tags">
                <span class="px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded text-[10px] font-medium">T: {{t.name}}</span>
              </ng-container>
            </div>
            <ng-template #noTax><span class="text-xs text-gray-400">—</span></ng-template>
          </td>
          <td class="p-2">{{p.updatedAt | date:'short'}}</td>
          <td class="p-2 flex gap-2 whitespace-nowrap">
            <a class="text-blue-600" [routerLink]="['/admin/posts', p.id]">Editar</a>
            <button (click)="delete(p)" class="text-red-600">Eliminar</button>
          </td>
        </tr>
  <tr *ngIf="!loading() && posts().length===0"><td colspan="5" class="p-4 text-center text-gray-500 dark:text-gray-400">Sin registros</td></tr>
  <tr *ngIf="loading()"><td colspan="5" class="p-4 text-center text-gray-500 dark:text-gray-400">Cargando...</td></tr>
      </tbody>
    </table>
  </div>
  <div class="flex justify-end gap-2 mt-4 text-sm" *ngIf="totalPages() > 1">
  <button (click)="prev()" [disabled]="page()===1" class="px-2 py-1 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 disabled:opacity-40 transition-colors">«</button>
    <span>Página {{page()}} / {{totalPages()}}</span>
  <button (click)="next()" [disabled]="page()===totalPages()" class="px-2 py-1 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 disabled:opacity-40 transition-colors">»</button>
  </div>
  `
})
export class PostListComponent {
  private postsSvc = inject(AdminPostsService);
  private router = inject(Router);
  private toasts = inject(ToastService);
  posts = signal<PostListItem[]>([]);
  loading = signal(false);
  page = signal(1);
  limit = 10;
  totalPages = signal(1);
  status = signal<string>('');
  category = signal<string>('');
  tag = signal<string>('');
  q = signal<string>('');
  tax = inject(TaxonomyService);
  isFiltered = computed(() => !!(this.status()||this.category()||this.tag()||this.q()));

  constructor() { this.tax.loadCategories(); this.tax.loadTags(); this.load(); }

  load() {
    this.loading.set(true);
  this.postsSvc.list<PostListItem>(this.page(), this.limit, this.status() || undefined, { category: this.category() || undefined, tag: this.tag() || undefined, q: this.q() || undefined }).subscribe(r => {
      this.loading.set(false);
      if (r.success) {
    // Envelope paginado backend: data = items[], meta separado
    this.posts.set(r.data || []);
    this.totalPages.set(r.meta?.totalPages || 1);
      }
    });
  }
  delete(p: PostListItem) {
    if (!confirm('Eliminar post?')) return;
    this.postsSvc.remove(p.id).subscribe(r => {
      if (r.success) { this.toasts.success('Post eliminado'); this.load(); }
      else this.toasts.error(r.message || 'Error');
    });
  }
  prev() { if (this.page() > 1) { this.page.set(this.page()-1); this.load(); } }
  next() { if (this.page() < this.totalPages()) { this.page.set(this.page()+1); this.load(); } }
  setStatus(s: string) { this.status.set(s); this.page.set(1); }
  setCategory(v: string) { this.category.set(v); this.page.set(1); }
  setTag(v: string) { this.tag.set(v); this.page.set(1); }
  setQ(v: string) { this.q.set(v); }
  applyFilters(ev: Event) { ev.preventDefault(); this.page.set(1); this.load(); }
  resetFilters() { this.status.set(''); this.category.set(''); this.tag.set(''); this.q.set(''); this.page.set(1); this.load(); }
  badgeClass(status: string) {
    return status === 'PUBLISHED' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  }
}
