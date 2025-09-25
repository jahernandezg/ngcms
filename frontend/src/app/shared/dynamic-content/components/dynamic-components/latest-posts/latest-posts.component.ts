import { PostImageComponent } from './../../../../post-image.component';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

@Component({
  selector: 'app-latest-posts',
  standalone: true,
  imports: [CommonModule, RouterModule, PostImageComponent],
  templateUrl: './latest-posts.component.html',
})
export class LatestPostsComponent implements OnInit {
  private http = inject(HttpClient);
  @Input() count = 5;
  @Input() category?: string;
  @Input() noCache = false;
  readonly posts = signal<PostListItem[]>([]);
  readonly loading = signal(true);

  ngOnInit() { this.fetch(); }

  private fetch() {
    this.loading.set(true);
    const params = new HttpParams().set('page', '1').set('limit', String(this.count || 5));
    const headers = this.noCache ? new HttpHeaders({ 'x-skip-cache': '1' }) : undefined;
    const url = this.category ? `/api/posts/category/${encodeURIComponent(this.category)}` : '/api/posts';
  this.http.get<{ items?: PostListItem[]; data?: PostListItem[] } | PostListItem[]>(url, { params, headers }).subscribe(r => {
      let data: PostListItem[] = [];
      if (Array.isArray(r)) {
        data = r as PostListItem[];
      } else if (r && Array.isArray(r.items)) {
        data = r.items as PostListItem[];
      } else if (r && Array.isArray(r.data)) {
        data = r.data as PostListItem[];
      }
      // Fallback: asegurar orden por publishedAt desc
      data = (data || []).slice().sort((a, b) => {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return tb - ta;
      });
      this.posts.set(data);
      this.loading.set(false);
    });
  }

   getAuthorInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  buildPostLink(post: PostListItem) {
   /* const base = (this.basePath || '').split('/').filter(Boolean);
   if (this.mode === 'blog' || this.mode === 'category') {
      return ['/', ...base, post.slug];
    }*/
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

   isNew(post: { publishedAt?: string | null }): boolean {
    if (!post.publishedAt) return false;
    const ts = new Date(post.publishedAt).getTime();
    return Date.now() - ts < 1000 * 60 * 60 * 24 * 7; // 7 días
  }
}
