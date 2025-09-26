import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { buildAssetUrl } from '../../shared/asset-url.util';

@Component({
  standalone: true,
  selector: 'app-post-image-preview',
  imports: [CommonModule],
  template: `
    <div *ngIf="src; else placeholder" class="relative">
      <img [src]="normalizedSrc()" [alt]="alt || 'Imagen del post'" class="rounded-lg shadow max-w-full" />
    </div>
    <ng-template #placeholder>
      <div class="w-full h-32 flex items-center justify-center text-xs text-gray-400 border border-dashed rounded">Sin imagen</div>
    </ng-template>
  `
})
export class PostImagePreviewComponent {
  @Input() src: string | null = null;
  @Input() alt?: string;
  normalizedSrc(){ return this.src ? (buildAssetUrl(this.src) || this.src) : null; }
}
