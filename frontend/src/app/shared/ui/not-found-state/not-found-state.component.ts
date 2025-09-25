import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-not-found-state',
  imports: [CommonModule, RouterModule],
  template: `
  <section class="w-full py-28 flex flex-col items-center text-center gap-10">
    <div class="relative">
      <div class="text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-blue-600 via-purple-600 to-fuchsia-500 drop-shadow-sm select-none">
        404
      </div>
      <span class="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xs uppercase tracking-widest text-blue-600/70 dark:text-blue-300/60 font-semibold">Not Found</span>
    </div>
    <div class="max-w-xl space-y-5">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{{ title || 'Página no encontrada' }}</h1>
      <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
        {{ message || 'La URL solicitada no existe, fue movida o nunca estuvo aquí. Puedes volver al inicio o explorar el blog.' }}
      </p>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-2">
        <a routerLink="/" class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Ir al inicio
        </a>
        <a routerLink="/blog" class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
          Ver blog
        </a>
      </div>
    </div>
    <div class="opacity-70 dark:opacity-60 w-full max-w-md">
      <svg viewBox="0 0 400 200" role="img" aria-label="Decoración" class="w-full h-auto select-none" fill="none" stroke-linecap="round">
        <defs>
          <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#2563eb" />
            <stop offset="60%" stop-color="#7c3aed" />
            <stop offset="100%" stop-color="#db2777" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="60" r="34" stroke="url(#g1)" stroke-width="6" />
        <rect x="140" y="30" width="70" height="70" rx="14" stroke="url(#g1)" stroke-width="6" />
        <circle cx="270" cy="65" r="8" fill="#2563eb" />
        <circle cx="295" cy="65" r="8" fill="#7c3aed" />
        <circle cx="320" cy="65" r="8" fill="#db2777" />
        <path d="M40 150 Q 90 110 140 150 T 240 150 T 340 150" stroke="url(#g1)" stroke-width="6" fill="transparent" />
      </svg>
    </div>
  </section>
  `
})
export class NotFoundStateComponent {
  @Input() title?: string;
  @Input() message?: string;
}
