import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Predefined color palettes for quick selection
const COLOR_PALETTES = {
  blues: ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
  greens: ['#065f46', '#047857', '#059669', '#10b981', '#34d399'],
  purples: ['#581c87', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'],
  reds: ['#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5'],
  oranges: ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fed7aa'],
  grays: ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db'],
  neutrals: ['#0c0a09', '#1c1917', '#292524', '#57534e', '#a8a29e']
};

@Component({
  standalone: true,
  selector: 'app-color-picker',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="color-picker-container">
      
      <!-- Current Color Display -->
      <div class="current-color-display">
        <div 
          class="color-preview" 
          [style.background-color]="value"
          role="button"
          tabindex="0"
          (click)="togglePalette()"
          (keydown.enter)="togglePalette()"
          (keydown.space)="$event.preventDefault(); togglePalette()">
        </div>
        <input 
          type="text" 
          [value]="value || ''"
          (input)="onTextInput($event)"
          [placeholder]="placeholder"
          class="color-input">
        <input 
          type="color" 
          [value]="value || '#000000'"
          (input)="onColorInput($event)"
          class="native-picker">
      </div>

      <!-- Color Palette Dropdown -->
      <div *ngIf="showPalette()" class="color-palette-dropdown">
        
        <!-- Recent Colors -->
        <div *ngIf="recentColors().length > 0" class="palette-section">
          <h4>Recent</h4>
          <div class="color-grid">
            <button 
              *ngFor="let color of recentColors()" 
              class="color-swatch"
              [style.background-color]="color"
              [title]="color"
              (click)="selectColor(color)"
              (keydown.enter)="selectColor(color)"
              (keydown.space)="$event.preventDefault(); selectColor(color)"
              tabindex="0">
            </button>
          </div>
        </div>

        <!-- Predefined Palettes -->
        <div *ngFor="let palette of palettes" class="palette-section">
          <h4>{{ palette.name }}</h4>
          <div class="color-grid">
            <button 
              *ngFor="let color of palette.colors" 
              class="color-swatch"
              [style.background-color]="color"
              [title]="color"
              (click)="selectColor(color)"
              (keydown.enter)="selectColor(color)"
              (keydown.space)="$event.preventDefault(); selectColor(color)"
              tabindex="0">
            </button>
          </div>
        </div>

        <!-- Custom Color Input -->
        <div class="palette-section">
          <h4>Custom</h4>
          <div class="custom-color-controls">
            <input 
              type="color" 
              [(ngModel)]="customColor"
              (input)="onCustomColorChange()"
              class="custom-color-picker">
            <input 
              type="text" 
              [(ngModel)]="customColor"
              (keyup.enter)="selectColor(customColor)"
              placeholder="#ffffff"
              class="custom-color-input">
            <button 
              class="add-custom-btn"
              (click)="selectColor(customColor)"
              [disabled]="!isValidHex(customColor)">
              Add
            </button>
          </div>
        </div>

      </div>

      <!-- Overlay to close palette -->
      <div 
        *ngIf="showPalette()" 
        class="palette-overlay"
        role="button" tabindex="0"
        (click)="closePalette()"
        (keydown.enter)="closePalette()">
      </div>

    </div>
  `,
  styles: [`
    .color-picker-container {
      position: relative;
      display: inline-block;
      width: 100%;
    }

    .current-color-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }

    .color-preview {
      width: 40px;
      height: 32px;
      border: 2px solid var(--theme-border, #e5e7eb);
      border-radius: var(--theme-border-radius, 6px);
      cursor: pointer;
      transition: all 0.2s ease;
      background-image: 
        linear-gradient(45deg, #ccc 25%, transparent 25%), 
        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #ccc 75%), 
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 8px 8px;
      background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
    }

    .color-preview:hover {
      transform: scale(1.05);
      border-color: var(--theme-primary, #3b82f6);
    }

    .color-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid var(--theme-border, #d1d5db);
      border-radius: var(--theme-border-radius, 6px);
      font-family: monospace;
      font-size: 0.875rem;
      background: var(--theme-surface, #ffffff);
      color: var(--theme-text, #111827);
    }

    .color-input:focus {
      outline: none;
      border-color: var(--theme-primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .native-picker {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--theme-border-radius, 6px);
      cursor: pointer;
    }

    .color-palette-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--theme-surface, #ffffff);
      border: 1px solid var(--theme-border, #e5e7eb);
      border-radius: var(--theme-border-radius, 8px);
      box-shadow: var(--theme-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
      z-index: 50;
      max-height: 400px;
      overflow-y: auto;
      padding: 1rem;
      margin-top: 0.5rem;
    }

    .palette-overlay {
      position: fixed;
      inset: 0;
      z-index: 40;
    }

    .palette-section {
      margin-bottom: 1.5rem;
    }

    .palette-section:last-child {
      margin-bottom: 0;
    }

    .palette-section h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--theme-text, #111827);
      margin: 0 0 0.5rem 0;
      text-transform: capitalize;
    }

    .color-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.5rem;
    }

    .color-swatch {
      width: 32px;
      height: 32px;
      border: 2px solid var(--theme-border, #e5e7eb);
      border-radius: var(--theme-border-radius, 6px);
      cursor: pointer;
      transition: all 0.2s ease;
      background-image: 
        linear-gradient(45deg, #f3f4f6 25%, transparent 25%), 
        linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #f3f4f6 75%), 
        linear-gradient(-45deg, transparent 75%, #f3f4f6 75%);
      background-size: 8px 8px;
      background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
    }

    .color-swatch:hover {
      transform: scale(1.1);
      border-color: var(--theme-primary, #3b82f6);
      box-shadow: var(--theme-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    }

    .custom-color-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .custom-color-picker {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--theme-border-radius, 6px);
      cursor: pointer;
    }

    .custom-color-input {
      flex: 1;
      padding: 0.375rem 0.5rem;
      border: 1px solid var(--theme-border, #d1d5db);
      border-radius: var(--theme-border-radius, 4px);
      font-family: monospace;
      font-size: 0.75rem;
      background: var(--theme-surface, #ffffff);
      color: var(--theme-text, #111827);
    }

    .add-custom-btn {
      padding: 0.375rem 0.75rem;
      background: var(--theme-primary, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--theme-border-radius, 4px);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .add-custom-btn:hover:not(:disabled) {
      background: var(--theme-accent, #2563eb);
    }

    .add-custom-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Scrollbar styling */
    .color-palette-dropdown::-webkit-scrollbar {
      width: 6px;
    }

    .color-palette-dropdown::-webkit-scrollbar-track {
      background: var(--theme-surface-alt, #f8fafc);
      border-radius: 3px;
    }

    .color-palette-dropdown::-webkit-scrollbar-thumb {
      background: var(--theme-border, #e5e7eb);
      border-radius: 3px;
    }

    .color-palette-dropdown::-webkit-scrollbar-thumb:hover {
      background: var(--theme-text-secondary, #6b7280);
    }
  `]
})
export class ColorPickerComponent {
  @Input() value: string | null = null;
  @Input() placeholder = '#ffffff';
  @Input() label = '';
  
  @Output() valueChange = new EventEmitter<string>();

  showPalette = signal(false);
  customColor = '#ffffff';
  recentColors = signal<string[]>(this.loadRecentColors());

  palettes = [
    { name: 'Blues', colors: COLOR_PALETTES.blues },
    { name: 'Greens', colors: COLOR_PALETTES.greens },
    { name: 'Purples', colors: COLOR_PALETTES.purples },
    { name: 'Reds', colors: COLOR_PALETTES.reds },
    { name: 'Oranges', colors: COLOR_PALETTES.oranges },
    { name: 'Grays', colors: COLOR_PALETTES.grays },
    { name: 'Neutrals', colors: COLOR_PALETTES.neutrals },
  ];

  togglePalette() {
    this.showPalette.set(!this.showPalette());
  }

  closePalette() {
    this.showPalette.set(false);
  }

  onTextInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const color = input.value;
    
    if (this.isValidHex(color) || color === '') {
      this.selectColor(color);
    }
  }

  onColorInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectColor(input.value);
  }

  onCustomColorChange() {
    // Update custom color as user types, but don't emit until they click Add
  }

  selectColor(color: string) {
    this.value = color;
    this.valueChange.emit(color);
    this.addToRecentColors(color);
    this.closePalette();
  }

  private addToRecentColors(color: string) {
    if (!color || !this.isValidHex(color)) return;
    
    const recent = this.recentColors();
    const filtered = recent.filter(c => c !== color);
    const updated = [color, ...filtered].slice(0, 10); // Keep last 10 colors
    
    this.recentColors.set(updated);
    this.saveRecentColors(updated);
  }

  private loadRecentColors(): string[] {
    try {
      const stored = localStorage.getItem('theme-customizer-recent-colors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveRecentColors(colors: string[]) {
    try {
      localStorage.setItem('theme-customizer-recent-colors', JSON.stringify(colors));
    } catch {
      // Ignore localStorage errors
    }
  }

  isValidHex(color: string): boolean {
    if (!color) return false;
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
  }
}