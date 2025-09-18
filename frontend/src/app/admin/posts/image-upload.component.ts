import { Component, EventEmitter, Output, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Validaciones básicas en frontend (ratio aproximado 16:9) para feedback inmediato
const REQUIRED_RATIO = 16 / 9;
const TOLERANCE = 0.02; // ±2%
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const FORMATS = ['image/jpeg','image/png','image/webp'];

@Component({
  standalone: true,
  selector: 'app-post-image-upload',
  imports: [CommonModule],
  template: `
  <div class="space-y-2">
   <label for="postImageInput" class="text-sm font-medium text-gray-700 dark:text-gray-300">Imagen Principal (16:9 opcional)</label>
   <div class="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-brand-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
      (dragover)="$event.preventDefault()" (drop)="onDrop($event)" (click)="fileInput.click()" role="button" tabindex="0" (keyup)="onKey($event)">
    <input id="postImageInput" #fileInput type="file" class="hidden" (change)="onFileInput($event)" accept="image/jpeg,image/png,image/webp" />
      <ng-container *ngIf="!preview(); else hasPreview">
        <p class="text-xs text-gray-500 dark:text-gray-400">Arrastra o haz click para seleccionar (JPG, PNG, WebP, máx 5MB)</p>
      </ng-container>
      <ng-template #hasPreview>
        <img [src]="preview()" alt="Preview" class="mx-auto max-h-40 rounded shadow" />
      </ng-template>
    </div>
    <div class="flex gap-2" *ngIf="preview()">
      <button type="button" (click)="emitRemove()" class="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-500">Quitar</button>
    </div>
    <p *ngIf="error()" class="text-[11px] text-red-600">{{error()}}</p>
    <p *ngIf="ratioInfo()" class="text-[10px] text-gray-500">Ratio: {{ratioInfo()}}</p>
  </div>
  `
})
export class PostImageUploadComponent implements OnInit {
  @Input() existingUrl: string | null = null;
  @Output() fileSelected = new EventEmitter<File | null>();
  preview = signal<string | null>(null);
  error = signal<string | null>(null);
  ratioInfo = signal<string | null>(null);

  ngOnInit() {
    if (this.existingUrl) this.preview.set(this.existingUrl);
  }
  onKey(e: KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.target as HTMLElement).click(); } }

  onFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handleFile(input.files[0]);
    input.value = '';
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleFile(f);
  }
  emitRemove() {
    this.preview.set(null);
    this.fileSelected.emit(null);
  }
  private handleFile(file: File) {
    this.error.set(null); this.ratioInfo.set(null);
    if (!FORMATS.includes(file.type)) { this.error.set('Formato no permitido'); return; }
    if (file.size > MAX_SIZE) { this.error.set('Archivo >5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const min = REQUIRED_RATIO * (1 - TOLERANCE);
        const max = REQUIRED_RATIO * (1 + TOLERANCE);
        const ok = ratio >= min && ratio <= max;
        this.ratioInfo.set(ratio.toFixed(3) + (ok ? ' (OK)' : ' (ajusta/crop para 16:9)'));
        this.preview.set(url);
        this.fileSelected.emit(file);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }
}
