import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteSettingsService } from './site-settings.service';

@Component({
  standalone: true,
  selector: 'app-post-image',
  imports: [CommonModule],
  template: `
    <picture *ngIf="finalSrc(); else placeholder">
      <img [src]="finalSrc()" [alt]="alt || 'Imagen del post'" class="w-full h-full object-cover" loading="lazy" decoding="async" />
    </picture>
    <ng-template #placeholder>
      <div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 text-xs">
        Sin imagen
      </div>
    </ng-template>
  `
})
export class PostImageComponent {
  private settings = inject(SiteSettingsService);
  @Input() src: string | null | undefined;
  @Input() alt = '';
  finalSrc = computed(() => this.src || this.settings.settings()?.defaultPostImage || this.settings.settings()?.ogImage || null);
}
