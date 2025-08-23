import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Google Fonts with categories and preview text
const FONT_CATEGORIES = {
  'Sans Serif': [
    { name: 'Inter', preview: 'The quick brown fox jumps' },
    { name: 'Roboto', preview: 'Modern and friendly' },
    { name: 'Open Sans', preview: 'Highly legible and neutral' },
    { name: 'Lato', preview: 'Serious but friendly' },
    { name: 'Montserrat', preview: 'Urban inspired typeface' },
    { name: 'Poppins', preview: 'Geometric sans serif' },
    { name: 'Source Sans Pro', preview: 'Adobe\'s first open source' },
    { name: 'Raleway', preview: 'Elegant and stylish' },
    { name: 'PT Sans', preview: 'Based on Russian type' },
    { name: 'Nunito Sans', preview: 'Well balanced and versatile' },
  ],
  'Serif': [
    { name: 'Lora', preview: 'Well-balanced serif' },
    { name: 'Merriweather', preview: 'Designed for screens' },
    { name: 'Playfair Display', preview: 'High contrast and distinctive' },
    { name: 'PT Serif', preview: 'Transitional serif typeface' },
    { name: 'Crimson Text', preview: 'Inspired by oldstyle' },
    { name: 'Libre Baskerville', preview: 'Based on American Type' },
  ],
  'Display': [
    { name: 'Dancing Script', preview: 'Lively casual script' },
    { name: 'Pacifico', preview: 'Fun and casual brush script' },
    { name: 'Oswald', preview: 'Reworking of classic gothic' },
    { name: 'Bebas Neue', preview: 'All caps display typeface' },
    { name: 'Righteous', preview: 'Flat sided display' },
  ],
  'Monospace': [
    { name: 'Fira Code', preview: 'Designed for programming' },
    { name: 'JetBrains Mono', preview: 'For developers' },
    { name: 'Space Mono', preview: 'Fixed-width typeface' },
  ]
};

const SYSTEM_FONTS = [
  { name: 'System UI', css: 'system-ui, sans-serif', preview: 'Native system font' },
  { name: 'Arial', css: 'Arial, sans-serif', preview: 'Classic sans serif' },
  { name: 'Helvetica', css: 'Helvetica, sans-serif', preview: 'Swiss typeface' },
  { name: 'Georgia', css: 'Georgia, serif', preview: 'Web-safe serif' },
  { name: 'Times New Roman', css: '"Times New Roman", serif', preview: 'Classic serif' },
  { name: 'Courier', css: '"Courier New", monospace', preview: 'Monospace typeface' },
];

@Component({
  standalone: true,
  selector: 'app-font-selector',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="font-selector-container">
      
      <!-- Current Selection Display -->
      <div class="current-font-display" (click)="toggleDropdown()">
        <div class="font-preview">
          <span 
            class="font-name"
            [style.font-family]="selectedFontCss()">
            {{ selectedFont || 'Select Font...' }}
          </span>
          <span class="font-category">{{ selectedCategory() }}</span>
        </div>
        <span class="dropdown-arrow" [class.rotated]="showDropdown()">▼</span>
      </div>

      <!-- Font Dropdown -->
      <div *ngIf="showDropdown()" class="font-dropdown">
        
        <!-- Search -->
        <div class="search-section">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (input)="onSearchChange()"
            placeholder="Search fonts..."
            class="search-input">
        </div>

        <!-- System Fonts -->
        <div class="font-category-section">
          <h4>System Fonts</h4>
          <div class="font-list">
            <button 
              *ngFor="let font of systemFonts" 
              class="font-option"
              [class.selected]="value === font.name"
              (click)="selectFont(font.name, 'System')"
              [style.font-family]="font.css">
              <div class="font-info">
                <span class="font-name">{{ font.name }}</span>
                <span class="font-preview-text">{{ font.preview }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Google Fonts by Category -->
        <div *ngFor="let category of filteredCategories()" class="font-category-section">
          <h4>{{ category.name }}</h4>
          <div class="font-list">
            <button 
              *ngFor="let font of category.fonts" 
              class="font-option"
              [class.selected]="value === font.name"
              (click)="selectFont(font.name, category.name)"
              [style.font-family]="font.name + ', sans-serif'">
              <div class="font-info">
                <span class="font-name">{{ font.name }}</span>
                <span class="font-preview-text">{{ font.preview }}</span>
              </div>
              <span class="google-fonts-badge">Google</span>
            </button>
          </div>
        </div>

        <!-- No Results -->
        <div *ngIf="filteredCategories().length === 0 && searchQuery" class="no-results">
          <p>No fonts found for "{{ searchQuery }}"</p>
        </div>

      </div>

      <!-- Overlay -->
      <div 
        *ngIf="showDropdown()" 
        class="dropdown-overlay"
        (click)="closeDropdown()">
      </div>

    </div>
  `,
  styles: [`
    .font-selector-container {
      position: relative;
      width: 100%;
    }

    .current-font-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border: 1px solid var(--theme-border, #d1d5db);
      border-radius: var(--theme-border-radius, 6px);
      background: var(--theme-surface, #ffffff);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .current-font-display:hover {
      border-color: var(--theme-primary, #3b82f6);
    }

    .font-preview {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .font-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--theme-text, #111827);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .font-category {
      font-size: 0.75rem;
      color: var(--theme-text-secondary, #6b7280);
      margin-top: 0.125rem;
    }

    .dropdown-arrow {
      font-size: 0.75rem;
      color: var(--theme-text-secondary, #6b7280);
      transition: transform 0.2s ease;
    }

    .dropdown-arrow.rotated {
      transform: rotate(180deg);
    }

    .font-dropdown {
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
      margin-top: 0.5rem;
    }

    .dropdown-overlay {
      position: fixed;
      inset: 0;
      z-index: 40;
    }

    .search-section {
      padding: 1rem 1rem 0.5rem;
      border-bottom: 1px solid var(--theme-border, #f3f4f6);
    }

    .search-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--theme-border, #d1d5db);
      border-radius: var(--theme-border-radius, 6px);
      font-size: 0.875rem;
      background: var(--theme-surface, #ffffff);
      color: var(--theme-text, #111827);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--theme-primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .font-category-section {
      padding: 1rem;
      border-bottom: 1px solid var(--theme-border, #f3f4f6);
    }

    .font-category-section:last-child {
      border-bottom: none;
    }

    .font-category-section h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--theme-text, #111827);
      margin: 0 0 0.75rem 0;
    }

    .font-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .font-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--theme-border-radius, 6px);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      width: 100%;
    }

    .font-option:hover {
      background: var(--theme-surface-alt, #f8fafc);
      border-color: var(--theme-border, #e5e7eb);
    }

    .font-option.selected {
      background: var(--theme-primary, #3b82f6);
      border-color: var(--theme-primary, #3b82f6);
      color: white;
    }

    .font-option.selected .font-name,
    .font-option.selected .font-preview-text {
      color: white;
    }

    .font-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .font-option .font-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--theme-text, #111827);
      margin-bottom: 0.125rem;
    }

    .font-preview-text {
      font-size: 0.75rem;
      color: var(--theme-text-secondary, #6b7280);
      font-style: normal;
    }

    .google-fonts-badge {
      font-size: 0.625rem;
      background: var(--theme-accent, #f59e0b);
      color: white;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .no-results {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--theme-text-secondary, #6b7280);
    }

    .no-results p {
      margin: 0;
      font-size: 0.875rem;
    }

    /* Scrollbar */
    .font-dropdown::-webkit-scrollbar {
      width: 6px;
    }

    .font-dropdown::-webkit-scrollbar-track {
      background: var(--theme-surface-alt, #f8fafc);
    }

    .font-dropdown::-webkit-scrollbar-thumb {
      background: var(--theme-border, #e5e7eb);
      border-radius: 3px;
    }

    .font-dropdown::-webkit-scrollbar-thumb:hover {
      background: var(--theme-text-secondary, #6b7280);
    }
  `]
})
export class FontSelectorComponent implements OnInit {
  @Input() selectedFont: string | null = null;
  @Input() label: string = '';
  
  @Output() fontSelected = new EventEmitter<{ name: string; category: string }>();

  showDropdown = signal(false);
  searchQuery = '';
  
  fontCategories = Object.entries(FONT_CATEGORIES).map(([name, fonts]) => ({ name, fonts }));
  systemFonts = SYSTEM_FONTS;

  selectedCategory = computed(() => {
    if (!this.selectedFont) return '';
    
    // Check system fonts first
    const systemFont = this.systemFonts.find(f => f.name === this.selectedFont);
    if (systemFont) return 'System';
    
    // Check Google Fonts categories
    for (const [category, fonts] of Object.entries(FONT_CATEGORIES)) {
      if (fonts.some(f => f.name === this.selectedFont)) {
        return category;
      }
    }
    
    return '';
  });

  selectedFontCss = computed(() => {
    if (!this.selectedFont) return 'system-ui, sans-serif';
    
    // Check if it's a system font
    const systemFont = this.systemFonts.find(f => f.name === this.selectedFont);
    if (systemFont) return systemFont.css;
    
    // For Google Fonts, add fallback
    return `'${this.selectedFont}', sans-serif`;
  });

  filteredCategories = computed(() => {
    if (!this.searchQuery.trim()) {
      return this.fontCategories;
    }
    
    const query = this.searchQuery.toLowerCase();
    return this.fontCategories
      .map(category => ({
        ...category,
        fonts: category.fonts.filter(font => 
          font.name.toLowerCase().includes(query) ||
          font.preview.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.fonts.length > 0);
  });

  ngOnInit() {
    // Load Google Fonts if not already loaded
    this.preloadGoogleFonts();
  }

  toggleDropdown() {
    this.showDropdown.set(!this.showDropdown());
  }

  closeDropdown() {
    this.showDropdown.set(false);
    this.searchQuery = '';
  }

  onSearchChange() {
    // Reactive filtering handled by computed
  }

  selectFont(fontName: string, category: string) {
    this.selectedFont = fontName;
    this.fontSelected.emit({ name: fontName, category });
    this.closeDropdown();
    
    // Load Google Font if needed
    if (category !== 'System') {
      this.loadGoogleFont(fontName);
    }
  }

  private preloadGoogleFonts() {
    // Load a few popular fonts for preview
    const popularFonts = ['Inter', 'Roboto', 'Open Sans', 'Lora', 'Montserrat'];
    popularFonts.forEach(font => this.loadGoogleFont(font));
  }

  private loadGoogleFont(fontName: string) {
    // Check if font is already loaded
    const existingLink = document.querySelector(`link[data-font="${fontName}"]`);
    if (existingLink) return;
    
    // Create Google Fonts link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
    link.setAttribute('data-font', fontName);
    
    document.head.appendChild(link);
  }
}