import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de skeleton reutilizable para páginas y posts.
 * Usa utilidades Tailwind y una animación shimmer definida globalmente.
 */
@Component({
  standalone: true,
  selector: 'app-content-skeleton',
  imports: [CommonModule],
  template: `
  <div class="w-full animate-shimmer min-h-[50vh]" [class.max-w-3xl]="centered" [class.mx-auto]="centered" role="status" aria-label="Cargando contenido">
    <!-- Variante POST -->
    <ng-container *ngIf="variant === 'post'; else pageTpl">
      <div class="h-9 w-3/4 mb-6 rounded-lg bg-gray-200/70 dark:bg-gray-700/50"></div>
      <div class="flex items-center gap-4 mb-8">
        <div class="h-12 w-12 rounded-full bg-gray-200/70 dark:bg-gray-700/50"></div>
        <div class="flex-1">
          <div class="h-4 w-40 mb-2 rounded bg-gray-200/70 dark:bg-gray-700/50"></div>
          <div class="h-3 w-28 rounded bg-gray-200/70 dark:bg-gray-700/50"></div>
        </div>
        <div class="h-4 w-16 rounded bg-gray-200/70 dark:bg-gray-700/50"></div>
      </div>
      <div class="aspect-video w-full mb-10 rounded-xl bg-gray-200/70 dark:bg-gray-700/50"></div>
      <div class="space-y-4">
        <div *ngFor="let i of lines" class="h-4 rounded bg-gray-200/70 dark:bg-gray-700/50" [ngClass]="(i % 4 === 0) ? 'w-4/5' : 'w-full'"></div>
      </div>
    </ng-container>
    <!-- Variante PAGE -->
    <ng-template #pageTpl>
      <div class="h-10 w-2/3 mb-8 rounded-lg bg-gray-200/70 dark:bg-gray-700/50"></div>
      <div class="space-y-5">
        <div *ngFor="let i of lines" class="h-4 rounded bg-gray-200/70 dark:bg-gray-700/50" [ngClass]="(i % 5 === 0) ? 'w-3/4' : 'w-full'"></div>
      </div>
    </ng-template>
  </div>
  `,
  styles: [`
    :host { display:block; }
  `]
})
export class ContentSkeletonComponent {
  /** 'post' o 'page' */
  @Input() variant: 'post' | 'page' = 'post';
  /** Centrar (para layouts con ancho limitado) */
  @Input() centered = true;
  /** Número de líneas de texto simuladas */
  @Input() lineCount = 18;
  get lines(): number[] { return Array.from({ length: this.lineCount }, (_, i) => i); }
}
