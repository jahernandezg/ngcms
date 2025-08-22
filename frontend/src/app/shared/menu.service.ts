import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface MenuItem {
  id: string;
  title: string;
  type: string;
  targetId?: string | null;
  url?: string | null;
  parentId?: string | null;
  sortOrder: number;
  openNewWindow?: boolean;
  slug?: string;
  pathSegments?: string[];
  children?: MenuItem[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  readonly items = signal<MenuItem[]>([]);

  load() {
    if (this._loading()) return;
    this._loading.set(true);
    this.http.get<{ success:boolean; data: MenuItem[] }>(`/api/menu`).pipe(
      map(res => res.data)
    ).subscribe({
      next: (list) => {
        // build tree
        const byId = new Map<string, MenuItem>();
    list.forEach(i => byId.set(i.id, { ...i, children: [] }));
        const roots: MenuItem[] = [];
        list.forEach(i => {
          if (i.parentId && byId.has(i.parentId)) {
      const parent = byId.get(i.parentId);
      const child = byId.get(i.id);
      if (parent && child && parent.children) parent.children.push(child);
          } else {
      const root = byId.get(i.id);
      if (root) roots.push(root);
          }
        });
        this.items.set(roots);
        this._loading.set(false);
      },
      error: () => { this._loading.set(false); }
    });
  }

  buildLink(item: MenuItem): string {
    if (item.pathSegments && item.pathSegments.length) return '/' + item.pathSegments.join('/');
    if (item.type === 'PAGE' && item.targetId) return '/pages/' + item.targetId;
    if (item.type === 'CATEGORY' && item.targetId) return '/category/' + item.targetId;
    if (item.type === 'POST' && item.targetId) return '/post/' + item.targetId;
    return '/';
  }
}
