import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-spinner',
  imports: [CommonModule],
  template: `
  <span class="inline-flex items-center gap-2" [attr.aria-label]="label || 'Cargando'" role="status">
    <span [ngClass]="sizeClass" class="inline-spinner" aria-hidden="true"></span>
    <span class="sr-only">{{ label || 'Cargando' }}</span>
    <ng-content />
  </span>
  `
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() label?: string;

  get sizeClass() {
    switch (this.size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-6 h-6';
      default: return 'w-4 h-4';
    }
  }
}
