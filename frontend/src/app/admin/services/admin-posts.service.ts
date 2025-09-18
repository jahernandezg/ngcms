import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse } from '@cms-workspace/shared-types';
import type { ApiSuccess, ApiError } from '@cms-workspace/shared-types';

interface PaginationMeta { total: number; page: number; limit: number; totalPages: number; }
type PagedApiResponse<T> = (ApiSuccess<T[]> & { meta?: PaginationMeta }) | ApiError;

@Injectable({ providedIn: 'root' })
export class AdminPostsService {
  private http = inject(HttpClient);

  list<T>(page: number, limit: number, status?: string, opts?: { category?: string; tag?: string; q?: string }) {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit), ...(status ? { status } : {}) });
    if (opts?.category) qs.set('category', opts.category);
    if (opts?.tag) qs.set('tag', opts.tag);
    if (opts?.q) qs.set('q', opts.q);
    return this.http.get<PagedApiResponse<T>>(`/api/admin/posts?${qs.toString()}`);
  }
  get<T>(id: string) { return this.http.get<ApiResponse<T>>(`/api/admin/posts/${id}`); }
  create<T>(payload: unknown) { return this.http.post<ApiResponse<T>>('/api/admin/posts', payload); }
  update<T>(id: string, payload: unknown) { return this.http.put<ApiResponse<T>>(`/api/admin/posts/${id}`, payload); }
  remove(id: string) { return this.http.delete<ApiResponse<{ deleted?: boolean }>>(`/api/admin/posts/${id}`); }

  uploadFeaturedImage(file: File) {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post<{ success?: boolean; data?: { url?: string; filename?: string } }>(`/api/admin/uploads/post-image/single`, fd);
  }
  deleteFeaturedImage(filename: string) {
    return this.http.delete<ApiResponse<{ deleted?: boolean }>>(`/api/admin/uploads/post-image/${filename}`);
  }
}
