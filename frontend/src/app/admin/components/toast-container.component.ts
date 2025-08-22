import { Component, signal, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Toast { id: number; type: 'success'|'error'|'info'; message: string; ttl: number; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  toasts = signal<Toast[]>([]);
  push(type: Toast['type'], message: string, ttl = 3500) {
    const id = ++this.seq;
    this.toasts.update(ts => [...ts, { id, type, message, ttl }]);
    setTimeout(() => this.dismiss(id), ttl);
  }
  success(m: string, ttl?: number) { this.push('success', m, ttl); }
  error(m: string, ttl?: number) { this.push('error', m, ttl); }
  info(m: string, ttl?: number) { this.push('info', m, ttl); }
  dismiss(id: number) { this.toasts.update(ts => ts.filter(t => t.id !== id)); }
}

@Component({
  standalone: true,
  selector: 'app-toast-container',
  imports: [CommonModule],
  template: `
  <div class="fixed z-50 top-4 right-4 space-y-2 w-72" aria-live="polite" aria-atomic="true">
    <div *ngFor="let t of svc.toasts()" class="px-4 py-3 rounded shadow text-sm flex justify-between items-start"
      [ngClass]="{
        'bg-green-600 text-white': t.type==='success',
        'bg-red-600 text-white': t.type==='error',
        'bg-gray-800 text-white': t.type==='info'
      }">
      <span>{{t.message}}</span>
      <button class="ml-3 text-xs opacity-70 hover:opacity-100" (click)="svc.dismiss(t.id)" aria-label="Cerrar">✕</button>
    </div>
  </div>
  `
})
export class ToastContainerComponent {
  svc = inject(ToastService);
}
