import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Tag { id: string; name: string; slug: string; count?: number }

@Component({
  selector: 'app-tag-cloud',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="space-y-3">
      <h3 class="font-semibold text-lg">Tags</h3>
      @if (!loading()) {
        <div class="flex flex-wrap gap-2">
          @for (t of tags(); track t.slug) {
            <a [routerLink]="['/tag', t.slug]" [style.fontSize.px]="fontSize(t)"
               class="text-blue-700 hover:underline">{{ t.name }}</a>
          }
        </div>
      } @else { <p>Cargando…</p> }
    </section>
  `
})
export class TagCloudComponent implements OnInit {
  private http = inject(HttpClient);
  @Input() minSize = 12;
  @Input() maxSize = 24;
  @Input() limit?: number;
  readonly tags = signal<Tag[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.http.get<{ data: Tag[] } | Tag[]>('/api/tags').subscribe(r => {
      let arr = Array.isArray(r) ? r : (r as { data: Tag[] }).data;
      arr = arr || [];
      if (this.limit) arr = arr.slice(0, this.limit);
      this.tags.set(arr);
      this.loading.set(false);
    });
  }

  fontSize(t: Tag): number {
    const counts = this.tags().map(x => x.count ?? 1);
    const minC = Math.min(...counts, 1);
    const maxC = Math.max(...counts, 1);
    const val = t.count ?? 1;
    if (maxC === minC) return this.minSize;
    const ratio = (val - minC) / (maxC - minC);
    return Math.round(this.minSize + ratio * (this.maxSize - this.minSize));
  }
}
