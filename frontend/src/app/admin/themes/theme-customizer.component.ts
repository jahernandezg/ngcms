import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ThemeService, ActiveTheme } from '../../shared/theme.service';
import { ColorPickerComponent } from './components/color-picker.component';
import { FontSelectorComponent } from './components/font-selector.component';
import { BrandIntegrationComponent } from './components/brand-integration.component';
import { AnimationConfiguratorComponent } from './components/animation-configurator.component';
import { ThemeExportComponent } from './components/theme-export.component';
import { ThemeMarketplaceComponent } from './components/theme-marketplace.component';
import { ColorPalette, ExtractedBrand } from '../../shared/brand-color-extractor.service';
import { ThemeAnimations } from '../../shared/animation-engine.service';

// Extended theme interface for customization
interface CustomizableTheme extends ActiveTheme {
  // Add any additional fields needed for the customizer
  isPreview?: boolean;
}

// Google Fonts are now managed by the FontSelectorComponent

// Theme categories for better organization
const THEME_CATEGORIES = [
  { value: 'GENERAL', label: 'General', icon: '🎨' },
  { value: 'BUSINESS', label: 'Business', icon: '💼' },
  { value: 'BLOG', label: 'Blog', icon: '📝' },
  { value: 'PORTFOLIO', label: 'Portfolio', icon: '🎭' },
  { value: 'ECOMMERCE', label: 'E-commerce', icon: '🛒' },
  { value: 'LANDING', label: 'Landing Page', icon: '🚀' },
  { value: 'CREATIVE', label: 'Creative', icon: '🎪' },
  { value: 'MINIMALIST', label: 'Minimalist', icon: '⭕' },
];

@Component({
  standalone: true,
  selector: 'app-theme-customizer',
  imports: [CommonModule, FormsModule, ColorPickerComponent, FontSelectorComponent, BrandIntegrationComponent, AnimationConfiguratorComponent, ThemeExportComponent, ThemeMarketplaceComponent],
  template: `
    <div class="theme-customizer-container" [class.preview-mode]="previewMode()">
      
      <!-- Header -->
      <header class="customizer-header">
        <div class="header-content">
          <div class="header-title">
            <h1>🎨 Theme Customizer</h1>
            <p>Customize your theme with live preview</p>
          </div>
          <div class="header-actions">
            <button 
              class="btn-toggle-preview"
              (click)="togglePreview()"
              [class.active]="previewMode()">
              👁️ {{ previewMode() ? 'Exit Preview' : 'Preview' }}
            </button>
            <button 
              class="btn-save"
              (click)="saveTheme()"
              [disabled]="saving()">
              💾 {{ saving() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </header>

      <div class="customizer-layout">
        
        <!-- Left Panel: Controls -->
        <aside class="customizer-sidebar">
          <div class="sidebar-content">
            
            <!-- Theme Selector -->
            <section class="customizer-section">
              <h3>🎯 Base Theme</h3>
              <div class="theme-selector">
                <select 
                  [(ngModel)]="selectedThemeId" 
                  (change)="loadBaseTheme()"
                  class="theme-select">
                  <option value="">Select a base theme...</option>
                  <option *ngFor="let theme of availableThemes()" [value]="theme.id">
                    {{ theme.name }}
                  </option>
                </select>
                <button 
                  class="btn-load-predefined"
                  (click)="loadPredefinedThemes()">
                  ⚡ Load Defaults
                </button>
              </div>
            </section>

            <!-- Brand Integration Section -->
            <section class="customizer-section brand-section">
              <app-brand-integration
                (paletteApplied)="onBrandPaletteApplied($event)"
                (brandSaved)="onBrandSaved($event)">
              </app-brand-integration>
            </section>

            <!-- Colors Section -->
            <section class="customizer-section">
              <h3>🎨 Colors</h3>
              <div class="color-grid">
                <div class="color-group">
                  <label>Primary</label>
                  <app-color-picker
                    [value]="workingTheme.primaryColor"
                    (valueChange)="workingTheme.primaryColor = $event; onColorChange()"
                    placeholder="#2563eb">
                  </app-color-picker>
                </div>

                <div class="color-group">
                  <label>Secondary</label>
                  <app-color-picker
                    [value]="workingTheme.secondaryColor"
                    (valueChange)="workingTheme.secondaryColor = $event; onColorChange()"
                    placeholder="#64748b">
                  </app-color-picker>
                </div>

                <div class="color-group">
                  <label>Accent</label>
                  <app-color-picker
                    [value]="workingTheme.accentColor"
                    (valueChange)="workingTheme.accentColor = $event; onColorChange()"
                    placeholder="#f59e0b">
                  </app-color-picker>
                </div>

                <div class="color-group">
                  <label>Surface</label>
                  <app-color-picker
                    [value]="workingTheme.surfaceColor"
                    (valueChange)="workingTheme.surfaceColor = $event; onColorChange()"
                    placeholder="#ffffff">
                  </app-color-picker>
                </div>

                <div class="color-group">
                  <label>Text</label>
                  <app-color-picker
                    [value]="workingTheme.textColor"
                    (valueChange)="workingTheme.textColor = $event; onColorChange()"
                    placeholder="#1e293b">
                  </app-color-picker>
                </div>

                <div class="color-group">
                  <label>Border</label>
                  <app-color-picker
                    [value]="workingTheme.borderColor"
                    (valueChange)="workingTheme.borderColor = $event; onColorChange()"
                    placeholder="#e2e8f0">
                  </app-color-picker>
                </div>
              </div>
            </section>

            <!-- Typography Section -->
            <section class="customizer-section">
              <h3>📝 Typography</h3>
              <div class="typography-controls">
                <div class="control-group">
                  <label>Heading Font</label>
                  <app-font-selector
                    [selectedFont]="workingTheme.fontHeading"
                    (fontSelected)="onHeadingFontChange($event)"
                    placeholder="Select heading font">
                  </app-font-selector>
                </div>

                <div class="control-group">
                  <label>Body Font</label>
                  <app-font-selector
                    [selectedFont]="workingTheme.fontBody"
                    (fontSelected)="onBodyFontChange($event)"
                    placeholder="Select body font">
                  </app-font-selector>
                </div>

                <div class="control-group">
                  <label>Base Size</label>
                  <select 
                    [(ngModel)]="workingTheme.fontSizeBase"
                    (change)="onTypographyChange()"
                    class="size-select">
                    <option value="14px">Small (14px)</option>
                    <option value="16px">Normal (16px)</option>
                    <option value="18px">Large (18px)</option>
                    <option value="20px">Extra Large (20px)</option>
                  </select>
                </div>

                <div class="control-group">
                  <label>Scale Ratio</label>
                  <input 
                    type="range" 
                    min="1.1" 
                    max="1.6" 
                    step="0.05"
                    [(ngModel)]="workingTheme.fontScaleRatio"
                    (input)="onTypographyChange()"
                    class="scale-slider">
                  <span class="scale-value">{{ workingTheme.fontScaleRatio }}</span>
                </div>
              </div>
            </section>

            <!-- Layout Section -->
            <section class="customizer-section">
              <h3>📐 Layout</h3>
              <div class="layout-controls">
                <div class="control-group">
                  <label>Container Width</label>
                  <select 
                    [(ngModel)]="workingTheme.containerWidth"
                    (change)="onLayoutChange()"
                    class="width-select">
                    <option value="1024px">Compact (1024px)</option>
                    <option value="1200px">Standard (1200px)</option>
                    <option value="1400px">Wide (1400px)</option>
                    <option value="100%">Full Width (100%)</option>
                  </select>
                </div>

                <div class="control-group">
                  <label>Border Radius</label>
                  <select 
                    [(ngModel)]="workingTheme.borderRadius"
                    (change)="onLayoutChange()"
                    class="radius-select">
                    <option value="0px">Sharp (0px)</option>
                    <option value="4px">Subtle (4px)</option>
                    <option value="8px">Standard (8px)</option>
                    <option value="12px">Rounded (12px)</option>
                    <option value="16px">Very Rounded (16px)</option>
                  </select>
                </div>

                <div class="control-group">
                  <label>Spacing</label>
                  <select 
                    [(ngModel)]="workingTheme.spacingUnit"
                    (change)="onLayoutChange()"
                    class="spacing-select">
                    <option value="0.75rem">Tight (12px)</option>
                    <option value="1rem">Standard (16px)</option>
                    <option value="1.25rem">Comfortable (20px)</option>
                    <option value="1.5rem">Spacious (24px)</option>
                  </select>
                </div>
              </div>
            </section>

            <!-- Component Styles Section -->
            <section class="customizer-section">
              <h3>🧩 Components</h3>
              <div class="component-controls">
                <div class="control-group">
                  <label>Button Style</label>
                  <div class="style-options">
                    <button 
                      *ngFor="let style of buttonStyles" 
                      [class]="'style-option ' + style.toLowerCase()"
                      [class.active]="workingTheme.buttonStyle === style"
                      (click)="setButtonStyle(style)">
                      {{ style }}
                    </button>
                  </div>
                </div>

                <div class="control-group">
                  <label>Card Style</label>
                  <div class="style-options">
                    <button 
                      *ngFor="let style of cardStyles" 
                      [class]="'style-option ' + style.toLowerCase()"
                      [class.active]="workingTheme.cardStyle === style"
                      (click)="setCardStyle(style)">
                      {{ style }}
                    </button>
                  </div>
                </div>

                <div class="control-group">
                  <label>Shadow Style</label>
                  <div class="style-options">
                    <button 
                      *ngFor="let style of shadowStyles" 
                      [class]="'style-option ' + style.toLowerCase()"
                      [class.active]="workingTheme.shadowStyle === style"
                      (click)="setShadowStyle(style)">
                      {{ style }}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Animations Section -->
            <section class="customizer-section animations-section">
              <app-animation-configurator
                (animationsChanged)="onAnimationsChanged($event)"
                (animationsApplied)="onAnimationsApplied($event)">
              </app-animation-configurator>
            </section>

            <!-- Theme Export Section -->
            <section class="customizer-section export-section">
              <app-theme-export
                [theme]="workingThemeSignal">
              </app-theme-export>
            </section>

            <!-- Theme Marketplace Section -->
            <section class="customizer-section marketplace-section">
              <app-theme-marketplace
                (themeInstalled)="onMarketplaceThemeInstalled($event)">
              </app-theme-marketplace>
            </section>

          </div>
        </aside>

        <!-- Right Panel: Preview -->
        <main class="customizer-preview">
          <div class="preview-header">
            <h3>👁️ Live Preview</h3>
            <div class="preview-controls">
              <button 
                *ngFor="let device of devicePresets" 
                [class]="'device-btn ' + device.class"
                [class.active]="currentDevice() === device.name"
                (click)="setPreviewDevice(device.name)"
                [title]="device.name">
                {{ device.icon }}
              </button>
            </div>
          </div>
          
          <div class="preview-container" [attr.data-device]="currentDevice()">
            <div class="preview-content">
              
              <!-- Sample Website Preview -->
              <div class="sample-website">
                
                <!-- Header -->
                <header class="sample-header theme-card">
                  <div class="theme-container">
                    <div class="header-content">
                      <div class="logo">
                        <h2 class="theme-heading">Your Website</h2>
                      </div>
                      <nav class="navigation">
                        <a href="#" class="nav-link">Home</a>
                        <a href="#" class="nav-link">About</a>
                        <a href="#" class="nav-link">Services</a>
                        <a href="#" class="nav-link">Contact</a>
                      </nav>
                    </div>
                  </div>
                </header>

                <!-- Hero Section -->
                <section class="sample-hero">
                  <div class="theme-container">
                    <div class="hero-content">
                      <h1 class="theme-heading hero-title">Welcome to Your Site</h1>
                      <p class="theme-text hero-subtitle">
                        This is how your website will look with the selected theme. 
                        Customize colors, fonts, and layout to match your brand.
                      </p>
                      <div class="hero-actions">
                        <button class="theme-button">Get Started</button>
                        <button class="theme-button secondary">Learn More</button>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Content Section -->
                <section class="sample-content">
                  <div class="theme-container">
                    <div class="content-grid">
                      <div class="content-card theme-card">
                        <h3 class="theme-heading">Feature One</h3>
                        <p class="theme-text">
                          Sample content showing how text looks in your theme.
                          The typography and colors update in real-time.
                        </p>
                        <button class="theme-button outlined">Read More</button>
                      </div>
                      <div class="content-card theme-card">
                        <h3 class="theme-heading">Feature Two</h3>
                        <p class="theme-text">
                          Another content block demonstrating the layout
                          and spacing of your customized theme.
                        </p>
                        <button class="theme-button outlined">Read More</button>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </main>

      </div>

      <!-- Loading Overlay -->
      <div *ngIf="loading()" class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading themes...</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .theme-customizer-container {
      min-height: 100vh;
      background: var(--theme-surface-alt, #f8fafc);
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .customizer-header {
      background: var(--theme-surface, #ffffff);
      border-bottom: 1px solid var(--theme-border, #e2e8f0);
      padding: 1rem 2rem;
      box-shadow: var(--theme-shadow-sm);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1600px;
      margin: 0 auto;
    }

    .header-title h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--theme-text);
      margin: 0;
    }

    .header-title p {
      color: var(--theme-text-secondary);
      margin: 0;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-toggle-preview, .btn-save {
      padding: 0.5rem 1rem;
      border: 1px solid var(--theme-border);
      border-radius: var(--theme-border-radius, 8px);
      background: var(--theme-surface);
      color: var(--theme-text);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .btn-toggle-preview:hover, .btn-save:hover {
      background: var(--theme-primary);
      color: white;
      border-color: var(--theme-primary);
    }

    .btn-toggle-preview.active {
      background: var(--theme-accent);
      color: white;
      border-color: var(--theme-accent);
    }

    /* Main Layout */
    .customizer-layout {
      display: grid;
      grid-template-columns: 400px 1fr;
      flex: 1;
      min-height: 0;
    }

    /* Sidebar */
    .customizer-sidebar {
      background: var(--theme-surface);
      border-right: 1px solid var(--theme-border);
      overflow-y: auto;
    }

    .sidebar-content {
      padding: 1.5rem;
    }

    .customizer-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--theme-border);
    }

    .customizer-section:last-child {
      border-bottom: none;
    }

    .customizer-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--theme-text);
      margin: 0 0 1rem 0;
    }

    /* Theme Selector */
    .theme-selector {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .theme-select, .font-select, .size-select, .width-select, .radius-select, .spacing-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--theme-border);
      border-radius: var(--theme-border-radius, 6px);
      background: var(--theme-surface);
      color: var(--theme-text);
    }

    .btn-load-predefined {
      padding: 0.5rem 1rem;
      background: var(--theme-accent);
      color: white;
      border: none;
      border-radius: var(--theme-border-radius, 6px);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Color Controls */
    .color-grid {
      display: grid;
      gap: 1rem;
    }

    .color-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .color-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--theme-text);
    }

    .color-input-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .color-picker {
      width: 40px;
      height: 32px;
      border: 1px solid var(--theme-border);
      border-radius: var(--theme-border-radius, 4px);
      cursor: pointer;
    }

    .color-text {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid var(--theme-border);
      border-radius: var(--theme-border-radius, 4px);
      background: var(--theme-surface);
      color: var(--theme-text);
      font-family: monospace;
      font-size: 0.875rem;
    }

    /* Typography Controls */
    .typography-controls, .layout-controls, .component-controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .control-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--theme-text);
    }

    .scale-slider {
      width: 100%;
    }

    .scale-value {
      font-size: 0.875rem;
      color: var(--theme-text-secondary);
      text-align: center;
      display: block;
      margin-top: 0.25rem;
    }

    /* Style Options */
    .style-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .style-option {
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--theme-border);
      border-radius: var(--theme-border-radius, 4px);
      background: var(--theme-surface);
      color: var(--theme-text);
      cursor: pointer;
      font-size: 0.75rem;
      text-transform: capitalize;
      transition: all 0.2s ease;
    }

    .style-option:hover {
      background: var(--theme-surface-alt);
    }

    .style-option.active {
      background: var(--theme-primary);
      color: white;
      border-color: var(--theme-primary);
    }

    /* Preview Panel */
    .customizer-preview {
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .preview-header {
      background: var(--theme-surface);
      border-bottom: 1px solid var(--theme-border);
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .preview-header h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--theme-text);
      margin: 0;
    }

    .preview-controls {
      display: flex;
      gap: 0.5rem;
    }

    .device-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--theme-border);
      border-radius: var(--theme-border-radius, 4px);
      background: var(--theme-surface);
      color: var(--theme-text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.2s ease;
    }

    .device-btn:hover {
      background: var(--theme-surface-alt);
    }

    .device-btn.active {
      background: var(--theme-primary);
      color: white;
      border-color: var(--theme-primary);
    }

    .preview-container {
      flex: 1;
      overflow: auto;
      padding: 2rem;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-content {
      width: 100%;
      max-width: 1200px;
      background: var(--theme-surface);
      border-radius: var(--theme-border-radius, 8px);
      box-shadow: var(--theme-shadow-lg);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    /* Device-specific preview sizes */
    .preview-container[data-device="mobile"] .preview-content {
      max-width: 375px;
    }

    .preview-container[data-device="tablet"] .preview-content {
      max-width: 768px;
    }

    .preview-container[data-device="desktop"] .preview-content {
      max-width: 1200px;
    }

    /* Sample Website Styles */
    .sample-website {
      min-height: 600px;
    }

    .sample-header {
      background: var(--theme-surface);
      border-bottom: 1px solid var(--theme-border);
      padding: 1rem 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo h2 {
      margin: 0;
      color: var(--theme-primary);
    }

    .navigation {
      display: flex;
      gap: 1.5rem;
    }

    .nav-link {
      color: var(--theme-text);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .nav-link:hover {
      color: var(--theme-primary);
    }

    .sample-hero {
      background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
      color: white;
      padding: 4rem 0;
      text-align: center;
    }

    .hero-title {
      font-size: 2.5rem;
      margin: 0 0 1rem 0;
      color: white;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      margin: 0 0 2rem 0;
      color: rgba(255, 255, 255, 0.9);
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .sample-content {
      padding: 4rem 0;
      background: var(--theme-surface-alt);
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .content-card {
      padding: 2rem;
      text-align: center;
    }

    .content-card h3 {
      margin: 0 0 1rem 0;
      color: var(--theme-text);
    }

    .content-card p {
      margin: 0 0 1.5rem 0;
      color: var(--theme-text-secondary);
      line-height: 1.6;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-spinner {
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--theme-border);
      border-top-color: var(--theme-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .customizer-layout {
        grid-template-columns: 300px 1fr;
      }
    }

    @media (max-width: 768px) {
      .customizer-layout {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
      }
      
      .customizer-sidebar {
        border-right: none;
        border-bottom: 1px solid var(--theme-border);
      }
    }

    /* Brand Integration Section */
    .brand-section {
      margin-bottom: 2rem;
    }

    /* Animations Section */
    .animations-section {
      margin-bottom: 2rem;
    }

    /* Export Section */
    .export-section {
      margin-bottom: 2rem;
    }

    /* Marketplace Section */
    .marketplace-section {
      margin-bottom: 2rem;
    }

    /* Toast animations */
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `]
})
export class ThemeCustomizerComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);
  private destroy$ = new Subject<void>();
  private previewDebounce$ = new Subject<void>();

  // Signals
  loading = signal(false);
  saving = signal(false);
  previewMode = signal(false);
  currentDevice = signal('desktop');
  availableThemes = signal<ActiveTheme[]>([]);
  
  // Computed signal for working theme (for export component)
  workingThemeSignal = computed(() => this.workingTheme as ActiveTheme);

  // Working theme data
  workingTheme: CustomizableTheme = this.getDefaultTheme();
  selectedThemeId = '';

  // Static data
  themeCategories = THEME_CATEGORIES;
  buttonStyles = ['ROUNDED', 'SQUARE', 'PILL', 'OUTLINED', 'GHOST'];
  cardStyles = ['ELEVATED', 'FLAT', 'OUTLINED', 'MINIMAL', 'GLASS'];
  shadowStyles = ['NONE', 'SOFT', 'MEDIUM', 'STRONG', 'COLORED'];
  
  devicePresets = [
    { name: 'mobile', icon: '📱', class: 'mobile' },
    { name: 'tablet', icon: '📲', class: 'tablet' },
    { name: 'desktop', icon: '💻', class: 'desktop' }
  ];

  constructor() {
    // Set up debounced preview updates
    this.previewDebounce$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyPreview();
    });
  }

  ngOnInit() {
    this.loadAvailableThemes();
    // Load current active theme as base
    const currentTheme = this.themeService.theme();
    if (currentTheme) {
      this.workingTheme = { ...currentTheme };
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    // Reset preview if active
    if (this.previewMode()) {
      this.themeService.resetPreview();
    }
  }

  private getDefaultTheme(): CustomizableTheme {
    return {
      id: 'custom-' + Date.now(),
      name: 'Custom Theme',
      isActive: false,
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      surfaceColor: '#ffffff',
      surfaceAltColor: '#f8fafc',
      textColor: '#1e293b',
      textSecondary: '#64748b',
      borderColor: '#e2e8f0',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      fontSizeBase: '16px',
      fontScaleRatio: 1.25,
      lineHeightBase: 1.6,
      containerWidth: '1200px',
      spacingUnit: '1rem',
      borderRadius: '8px',
      buttonStyle: 'ROUNDED',
      cardStyle: 'ELEVATED',
      shadowStyle: 'SOFT',
      animationSpeed: '300ms',
      category: 'GENERAL',
      isPreview: true
    };
  }

  async loadAvailableThemes() {
    this.loading.set(true);
    try {
      const response = await this.http.get<any>('/api/admin/themes').toPromise();
      const themes = response?.data || response || [];
      this.availableThemes.set(themes);
    } catch (error) {
      console.error('Failed to load themes:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadPredefinedThemes() {
    this.loading.set(true);
    try {
      await this.http.post<any>('/api/admin/themes/predefined', {}).toPromise();
      await this.loadAvailableThemes();
    } catch (error) {
      console.error('Failed to create predefined themes:', error);
    } finally {
      this.loading.set(false);
    }
  }

  loadBaseTheme() {
    const theme = this.availableThemes().find(t => t.id === this.selectedThemeId);
    if (theme) {
      this.workingTheme = { ...theme, isPreview: true };
      this.triggerPreviewUpdate();
    }
  }

  // Event handlers for real-time updates
  onColorChange() {
    this.triggerPreviewUpdate();
  }

  onTypographyChange() {
    this.triggerPreviewUpdate();
  }

  onHeadingFontChange(font: { name: string; category: string }) {
    this.workingTheme.fontHeading = font.name;
    this.onTypographyChange();
  }

  onBodyFontChange(font: { name: string; category: string }) {
    this.workingTheme.fontBody = font.name;
    this.onTypographyChange();
  }

  onBrandPaletteApplied(palette: ColorPalette) {
    // Apply extracted colors to theme
    this.workingTheme.primaryColor = palette.primary;
    this.workingTheme.secondaryColor = palette.secondary;
    this.workingTheme.accentColor = palette.accent;
    this.workingTheme.backgroundColor = palette.background;
    this.workingTheme.surfaceColor = palette.surface;
    
    // Trigger preview update
    this.onColorChange();
    
    // Show success message
    this.showSuccessMessage('¡Paleta de marca aplicada exitosamente!');
  }

  onBrandSaved(brand: ExtractedBrand) {
    // Save brand information (could be stored in local storage or sent to backend)
    localStorage.setItem('savedBrand', JSON.stringify(brand));
    
    // Update theme name if provided
    if (brand.suggestedThemeName) {
      this.workingTheme.name = brand.suggestedThemeName;
    }
    
    this.showSuccessMessage('¡Marca guardada exitosamente!');
  }

  private showSuccessMessage(message: string) {
    // Simple toast notification - could be replaced with a proper toast service
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  onAnimationsChanged(animations: ThemeAnimations) {
    // Store animations configuration for later use
    localStorage.setItem('tempAnimations', JSON.stringify(animations));
  }

  onAnimationsApplied(animations: ThemeAnimations) {
    // Apply animations to the working theme
    // Since animations are managed separately, we just show success
    this.showSuccessMessage('¡Configuración de animaciones aplicada!');
    
    // You could extend the theme model to include animations if needed
    // this.workingTheme.animations = animations;
  }

  onMarketplaceThemeInstalled(theme: ActiveTheme) {
    // Apply the marketplace theme as the working theme
    this.workingTheme = { ...theme, isPreview: true };
    this.triggerPreviewUpdate();
    
    // Show success message
    this.showSuccessMessage(`¡Tema "${theme.name}" aplicado exitosamente!`);
    
    // Optionally save it to the backend
    // this.saveTheme();
  }

  onLayoutChange() {
    this.triggerPreviewUpdate();
  }

  setButtonStyle(style: string) {
    this.workingTheme.buttonStyle = style;
    this.triggerPreviewUpdate();
  }

  setCardStyle(style: string) {
    this.workingTheme.cardStyle = style;
    this.triggerPreviewUpdate();
  }

  setShadowStyle(style: string) {
    this.workingTheme.shadowStyle = style;
    this.triggerPreviewUpdate();
  }

  togglePreview() {
    const newPreviewMode = !this.previewMode();
    this.previewMode.set(newPreviewMode);
    
    if (newPreviewMode) {
      this.applyPreview();
    } else {
      this.themeService.resetPreview();
    }
  }

  setPreviewDevice(device: string) {
    this.currentDevice.set(device);
  }

  private triggerPreviewUpdate() {
    this.previewDebounce$.next();
  }

  private applyPreview() {
    if (this.previewMode()) {
      this.themeService.previewTheme(this.workingTheme as ActiveTheme);
    }
  }

  async saveTheme() {
    this.saving.set(true);
    try {
      const themeData = { ...this.workingTheme };
      delete (themeData as any).isPreview;

      let response;
      if (this.selectedThemeId) {
        // Update existing theme
        response = await this.http.put<any>(`/api/admin/themes/${this.selectedThemeId}`, {
          ...themeData,
          setActive: true
        }).toPromise();
      } else {
        // Create new theme
        response = await this.http.post<any>('/api/admin/themes', themeData).toPromise();
        if (response?.data?.[1]) {
          // If transaction response, activate the theme
          await this.http.put<any>(`/api/admin/themes/${response.data[1].id}/activate`, {}).toPromise();
        }
      }

      // Reload the theme service to apply changes
      this.themeService.load();
      this.previewMode.set(false);
      
      console.log('Theme saved successfully!');
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      this.saving.set(false);
    }
  }
}