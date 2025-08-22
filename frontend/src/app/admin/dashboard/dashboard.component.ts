import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import type { ApiResponse } from '@cms-workspace/shared-types';

interface Overview { posts: number; published: number; users: number; recent: { id: string; title: string; status: string; createdAt: string; }[] }

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  template: `
  <h1 class="text-2xl font-semibold mb-6">Dashboard</h1>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <div class="p-4 bg-white dark:bg-gray-800 shadow rounded transition-colors"><p class="text-sm text-gray-500 dark:text-gray-400">Posts</p><p class="text-2xl font-bold">{{overview()?.posts ?? '…'}}</p></div>
    <div class="p-4 bg-white dark:bg-gray-800 shadow rounded transition-colors"><p class="text-sm text-gray-500 dark:text-gray-400">Publicados</p><p class="text-2xl font-bold">{{overview()?.published ?? '…'}}</p></div>
    <div class="p-4 bg-white dark:bg-gray-800 shadow rounded transition-colors"><p class="text-sm text-gray-500 dark:text-gray-400">Usuarios</p><p class="text-2xl font-bold">{{overview()?.users ?? '…'}}</p></div>
  </div>
  <h2 class="font-semibold mb-2">Últimos Posts</h2>
  <table class="w-full text-sm bg-white dark:bg-gray-800 shadow rounded overflow-hidden transition-colors">
    <thead class="bg-gray-50 dark:bg-gray-700/60 text-left transition-colors">
      <tr><th class="p-2">Título</th><th class="p-2">Status</th><th class="p-2">Actualizado</th></tr>
    </thead>
    <tbody>
      <tr *ngFor="let p of overview()?.recent" class="border-t">
        <td class="p-2">{{p.title}}</td>
        <td class="p-2">{{p.status}}</td>
        <td class="p-2">{{p.createdAt | date:'short'}}</td>
      </tr>
  <tr *ngIf="!overview()" class="border-t border-gray-200 dark:border-gray-700"><td colspan="3" class="p-4 text-center text-gray-500 dark:text-gray-400">Cargando...</td></tr>
    </tbody>
  </table>
  `
})
export class DashboardComponent {
  private http = inject(HttpClient);
  overview = signal<Overview | null>(null);

  constructor() {
  this.http.get<ApiResponse<Overview>>('/api/admin/dashboard/overview').subscribe(r => {
      if (r?.success) this.overview.set(r.data);
    });
  }
}
