import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

interface PageEntity { id: string; title: string; slug: string; status: string; updatedAt: string; isHomepage?: boolean }
interface PageListResult { items: PageEntity[]; total: number; page: number; pages: number }

@Component({
  standalone: true,
  selector: 'app-page-list',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  // styles moved to global styles
  templateUrl: './page-list.component.html',
})
export class PageListComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  pages = signal<PageEntity[]>([]);
  loading = signal(false);
  actioning = signal(false);
  filterForm = inject(FormBuilder).group({ status: [''] });

  constructor() { this.reload(); }

  reload() {
    this.loading.set(true);
    const status = this.filterForm.value.status || '';
    const qs = status ? `?status=${status}` : '';
    this.http.get<unknown>(`/api/admin/pages${qs}`).subscribe({
      next: (raw) => {
        let r: PageListResult | null = null;
        const isResult = (v: unknown): v is PageListResult => !!v && typeof v === 'object' && 'items' in v;
        const isEnvelope = (v: unknown): v is { data: unknown } => !!v && typeof v === 'object' && 'data' in v;
        if (isResult(raw)) r = raw;
        else if (isEnvelope(raw) && isResult(raw.data)) r = raw.data as PageListResult;
        if (r) this.pages.set(r.items); else this.pages.set([]);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  archive(p: PageEntity) {
    this.actioning.set(true);
  this.http.put(`/api/admin/pages/${p.id}`, { status: 'ARCHIVED' }).subscribe({
      next: () => { this.reload(); this.actioning.set(false); },
      error: () => this.actioning.set(false)
    });
  }

  setHomepage(p: PageEntity) {
    this.actioning.set(true);
  this.http.put(`/api/admin/pages/${p.id}/homepage`, {}).subscribe({
      next: () => { this.reload(); this.actioning.set(false); },
      error: () => this.actioning.set(false)
    });
  }
}
