import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Category { id: string; name: string; slug: string; postCount?: number }

@Component({
  selector: 'app-category-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="space-y-3">
      <h3 class="font-semibold text-lg">Categorías</h3>
      @if (!loading()) {
        <ul class="space-y-1">
          @for (c of items(); track c.id) {
            <li class="flex justify-between">
              <a [routerLink]="['/category', c.slug]" class="hover:underline">{{ c.name }}</a>
              <span class="text-gray-500">{{ c.postCount ?? 0 }}</span>
            </li>
          }
        </ul>
      } @else { <p>Cargando…</p> }
    </section>
  `
})
export class CategoryWidgetComponent implements OnInit {
  private http = inject(HttpClient);
  @Input() limit?: number;
  readonly items = signal<Category[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.http.get<{ data: Category[] } | Category[]>(`/api/categories`).subscribe(r => {
      const arr = Array.isArray(r) ? r : (r as { data: Category[] }).data;
      const list = this.limit ? (arr || []).slice(0, this.limit) : (arr || []);
      this.items.set(list);
      this.loading.set(false);
    });
  }
}
