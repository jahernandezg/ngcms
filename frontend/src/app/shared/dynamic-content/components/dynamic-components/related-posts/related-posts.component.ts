import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DynamicContentContextService } from '../../../../dynamic-content/services/dynamic-content-context.service';

interface PostItem { id: string; title: string; slug: string; publishedAt?: string | null; }

@Component({
  selector: 'app-related-posts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="space-y-3">
      <h3 class="font-semibold text-lg">Artículos relacionados</h3>
      @if (!loading()) {
        @if (items().length) {
          <ul class="space-y-2">
            @for (p of items(); track p.id) {
              <li>
                <a [routerLink]="['/post', p.slug]" class="text-blue-600 hover:underline">{{ p.title }}</a>
                <small class="text-gray-500" *ngIf="p.publishedAt"> · {{ p.publishedAt | date:'mediumDate' }}</small>
              </li>
            }
          </ul>
        } @else { <p class="text-sm text-gray-500">Sin relacionados.</p> }
      } @else { <p>Cargando…</p> }
    </section>
  `
})
export class RelatedPostsComponent implements OnInit {
  private http = inject(HttpClient);
  private ctx = inject(DynamicContentContextService);
  @Input() currentSlug?: string; // si no se provee, el componente no carga
  @Input() count = 4;
  readonly items = signal<PostItem[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    const slug = this.resolveSlug();
    if (!slug) { this.loading.set(false); return; }
    this.http.get<{ data: PostItem[] } | PostItem[]>(`/api/posts/${slug}/related`).subscribe(r => {
      const arr = Array.isArray(r) ? r : (r as { data: PostItem[] }).data;
      this.items.set((arr || []).slice(0, this.count));
      this.loading.set(false);
    });
  }

  private resolveSlug(): string | null {
    const provided = (this.currentSlug || '').trim();
    if (provided && provided.toLowerCase() !== 'auto') return provided;
    const fromCtx = this.ctx.currentPostSlug();
    return fromCtx || null;
  }
}
