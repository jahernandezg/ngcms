import { CommonModule } from '@angular/common';
import { Component, Input, inject, signal, OnChanges, SimpleChanges, computed, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { unwrapData } from '../../shared/http-utils';
import { SeoService } from '../../shared/seo.service';
import { SiteSettingsService } from '../../shared/site-settings.service';
import { PostImageComponent } from '../../shared/post-image.component';

interface PostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  readingTime?: number;
  publishedAt?: string | null;
  author?: { id: string; name: string };
  categories?: { id?: string; name?: string; slug?: string }[];
  tags?: { id?: string; name?: string; slug?: string }[];
  featuredImage?: string | null; // nuevo campo
}
interface ApiListEnvelope<T> { success: boolean; message?: string; data: T[]; meta?: { total: number; page: number; limit: number; totalPages?: number } }
interface Category { id: string; name: string; slug: string }
interface CategoryTree extends Category { children?: CategoryTree[] }

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PostImageComponent],
  templateUrl: './blog-list.component.html',
})
export class BlogListComponent implements OnChanges, OnInit {
  private http = inject(HttpClient);
  private seo = inject(SeoService);
  private router = inject(Router);
  private siteSettings = inject(SiteSettingsService);

  @Input({ required: true }) mode!: 'blog' | 'category';
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() categorySlug?: string;
  // basePath es la ruta actual (sin leading slash), usada para construir enlaces relativos
  @Input() basePath = '';

  readonly posts = signal<PostListItem[] | null>(null);
  readonly totalPosts = signal<number>(0);
  readonly page = signal<number>(1);
  readonly limit = 20;
  readonly loadingMore = signal<boolean>(false);

  // UI state
  readonly filterKey = signal<'all' | string>('all');
  readonly sortKey = signal<'recent' | 'popular' | 'az' | 'most_read'>('recent');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly search = signal<string>('');

  // Categorías
  readonly categories = signal<Category[]>([]);
  readonly categoryTree = signal<CategoryTree[]>([]);

  readonly visiblePosts = computed(() => {
    let items = (this.posts() || []).slice();

    // filter by category slug if selected
    const fk = this.filterKey();
    if (fk !== 'all') {
      items = items.filter(p => p.categories?.some(c => (c.slug || '').toLowerCase().includes(fk)));
    }

    // search by title or excerpt
    const q = this.search().trim().toLowerCase();
    if (q) {
      items = items.filter(p =>
        (p.title || '').toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q)
      );
    }

    // sorting
    const sk = this.sortKey();
    if (sk === 'recent') {
      items.sort((a, b) => {
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return db - da;
      });
    } else if (sk === 'az') {
      items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      // 'popular' y 'most_read' no tienen datos. Dejamos orden entrante.
    }

    return items;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['categorySlug']) {
      this.resetListingState();
      if (this.mode === 'blog') this.fetchBlogPosts();
      else if (this.mode === 'category' && this.categorySlug) {
        this.fetchCategoryPosts(this.categorySlug);
        // Resaltar chip activo
        this.filterKey.set(this.categorySlug);
      }
    }
    if (changes['mode'] || changes['title'] || changes['categorySlug']) {
      this.setSEO();
    }
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadCategoryTree();
  }

  private setSEO() {
    const path = typeof window !== 'undefined'
      ? window.location.pathname
      : (this.mode === 'category' && this.categorySlug ? `/${this.categorySlug}` : '/');
    const urlAbs = typeof window !== 'undefined' ? window.location.href : undefined;
    const fallbackTitle = this.mode === 'blog' ? 'Blog' : 'Categoría';
    const desc = this.subtitle || undefined;
    this.seo.set({ title: this.title || fallbackTitle, description: desc, canonical: path, url: urlAbs, type: 'website' });
  }

  private fetchBlogPosts() {
    const nextPage = this.page();
    this.loadingMore.set(true);
    this.http.get<ApiListEnvelope<PostListItem> | { data: PostListItem[]; meta?: { total: number } }>(`/api/posts`, { params: { limit: this.limit, page: nextPage } })
      .subscribe(r => {
        const current = this.posts() || [];
        const incoming = unwrapData<PostListItem[]>(r as unknown as ApiListEnvelope<PostListItem> | PostListItem[]);
        const metaTotal = (r as ApiListEnvelope<PostListItem>)?.meta?.total;
        this.posts.set(nextPage === 1 ? incoming : [...current, ...incoming]);
        this.totalPosts.set(metaTotal ?? (nextPage === 1 ? incoming.length : (current.length + incoming.length)));
        this.loadingMore.set(false);
      });
  }

  private fetchCategoryPosts(slug: string) {
    const nextPage = this.page();
    this.loadingMore.set(true);
    this.http.get<ApiListEnvelope<PostListItem> | { data: PostListItem[]; meta?: { total: number } }>(`/api/posts/category/${slug}`, { params: { limit: this.limit, page: nextPage } })
      .subscribe(r => {
        const current = this.posts() || [];
        const incoming = unwrapData<PostListItem[]>(r as unknown as ApiListEnvelope<PostListItem> | PostListItem[]);
        const metaTotal = (r as ApiListEnvelope<PostListItem>)?.meta?.total;
        this.posts.set(nextPage === 1 ? incoming : [...current, ...incoming]);
        this.totalPosts.set(metaTotal ?? (nextPage === 1 ? incoming.length : (current.length + incoming.length)));
        this.loadingMore.set(false);
      });
  }

  loadMore() {
    if (this.loadingMore()) return;
    const hasMore = (this.posts()?.length || 0) < this.totalPosts();
    if (!hasMore) return;
    this.page.set(this.page() + 1);
    if (this.mode === 'blog') this.fetchBlogPosts();
    else if (this.mode === 'category' && this.categorySlug) this.fetchCategoryPosts(this.categorySlug);
  }

  hasMore() { return (this.posts()?.length || 0) < this.totalPosts(); }
  private resetListingState() { this.posts.set([]); this.totalPosts.set(0); this.page.set(1); }

  buildPostLink(post: PostListItem) {
    const base = (this.basePath || '').split('/').filter(Boolean);
    if (this.mode === 'blog' || this.mode === 'category') {
      return ['/', ...base, post.slug];
    }
    return ['/', post.slug];
  }

  getExcerpt(post: { excerpt?: string | null; content?: string | null }): string {
    if (post.excerpt && post.excerpt.trim()) return post.excerpt;
    if (post.content) {
      const tmp = document.createElement('div');
      tmp.innerHTML = post.content;
      const text = tmp.textContent || tmp.innerText || '';
      return text.trim().slice(0, 160) + (text.length > 160 ? '…' : '');
    }
    return '';
  }

  // UI handlers
  setFilter(key: 'all' | string) { this.filterKey.set(key); }
  onSortChange(ev: Event) {
    const val = (ev.target as HTMLSelectElement).value as 'recent' | 'popular' | 'az' | 'most_read';
    this.sortKey.set(val);
  }
  setView(mode: 'grid' | 'list') { this.viewMode.set(mode); }
  onSearch(ev: Event) { this.search.set((ev.target as HTMLInputElement).value || ''); }

  onCategoryClick(slug: string) {
    if (this.mode === 'blog') this.setFilter(slug);
    else this.router.navigate(['/', slug]);
  }

  isNew(post: { publishedAt?: string | null }): boolean {
    if (!post.publishedAt) return false;
    const ts = new Date(post.publishedAt).getTime();
    return Date.now() - ts < 1000 * 60 * 60 * 24 * 7; // 7 días
  }

  categoriesAttr(post: { categories?: { slug?: string }[] | undefined }): string {
    const slugs = (post.categories || []).map(c => c.slug || '').filter(Boolean);
    return slugs.join(' ');
  }

  getPostImage(): string {
    return this.siteSettings.settings()?.defaultPostImage || 'https://placehold.co/400x200?text=400x200\n+No+Image';
  }

  getAuthorInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  private loadCategories() {
    this.http
      .get<ApiListEnvelope<Category> | { data: Category[] }>(`/api/categories`)
      .subscribe((r) => {
        const cats = unwrapData<Category[]>(r as ApiListEnvelope<Category> | Category[]);
        this.categories.set(cats);
      });
  }

  private loadCategoryTree() {
    this.http
      .get<ApiListEnvelope<CategoryTree> | { data: CategoryTree[] }>(`/api/categories/tree`)
      .subscribe((r) => {
        const cats = unwrapData<CategoryTree[]>(r as ApiListEnvelope<CategoryTree> | CategoryTree[]);
        this.categoryTree.set(cats);
      });
  }
}
