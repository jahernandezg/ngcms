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
  template: `
  <div class="flex items-center justify-between mb-4 gap-4 flex-wrap">
    <h1 class="text-2xl font-semibold">Páginas</h1>
    <div class="flex gap-2 items-center flex-wrap">
  <select [formControl]="filterForm.controls.status" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-colors">
        <option value="">Todas</option>
        <option value="DRAFT">Borrador</option>
        <option value="PUBLISHED">Publicadas</option>
        <option value="ARCHIVED">Archivadas</option>
      </select>
  <button (click)="reload()" class="px-3 py-1.5 text-sm border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" [disabled]="loading()">Filtrar</button>
  <button routerLink="/admin/pages/new" class="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">Nueva Página</button>
    </div>
  </div>
  <div class="border rounded divide-y bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 divide-gray-200 dark:divide-gray-700 transition-colors" *ngIf="pages().length; else emptyTpl">
    <div *ngFor="let p of pages()" class="p-3 flex items-center gap-4 text-sm">
      <div class="flex-1 min-w-0">
        <a [routerLink]="['/admin/pages', p.id]" class="font-medium hover:underline">{{p.title}}</a>
  <div class="text-xs text-gray-500 dark:text-gray-400 truncate">/{{p.slug}} <span *ngIf="p.isHomepage" class="ml-1 px-1 py-0.5 bg-green-100 text-green-700 rounded">Home</span></div>
      </div>
  <div class="w-28 text-xs text-gray-500 dark:text-gray-400">{{p.status}}</div>
  <div class="w-40 text-xs text-gray-500 dark:text-gray-400">{{p.updatedAt | date:'short'}}</div>
      <div class="flex gap-2">
  <button (click)="setHomepage(p)" *ngIf="!p.isHomepage" class="text-xs px-2 py-1 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" [disabled]="actioning()">Home</button>
  <button (click)="archive(p)" *ngIf="p.status !== 'ARCHIVED'" class="text-xs px-2 py-1 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" [disabled]="actioning()">Archivar</button>
      </div>
    </div>
  </div>
  <ng-template #emptyTpl>
  <p class="text-sm text-gray-500 dark:text-gray-400">Sin páginas.</p>
  </ng-template>
  `
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
