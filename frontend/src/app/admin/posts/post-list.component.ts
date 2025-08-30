import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminPostsService } from '../services/admin-posts.service';
import { ToastService } from '../components/toast-container.component';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

interface PostListItem { id: string; title: string; status: string; updatedAt: string; authorName?: string; categories?: { name: string; slug: string }[]; tags?: { name: string; slug: string }[]; }

@Component({
  standalone: true,
  selector: 'app-admin-post-list',
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  // styles moved to global styles
  templateUrl: './post-list.component.html'
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
    return status === 'PUBLISHED' ?
    'bg-green-100 text-green-700 border border-green-200 dark:bg-success-500/15 dark:text-success-500' :
    'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-warning-500/15 dark:text-warning-500';
  }
}
