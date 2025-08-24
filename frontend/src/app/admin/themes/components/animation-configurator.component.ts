import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnimationEngineService, AnimationConfig, ThemeAnimations } from '../../../shared/animation-engine.service';

@Component({
  standalone: true,
  selector: 'app-animation-configurator',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animation-configurator">
      
      <!-- Header -->
      <div class="configurator-header">
        <h3>⚡ Configuración de Animaciones</h3>
        <p>Personaliza los efectos de animación para crear una experiencia única</p>
      </div>

      <!-- Animation Categories -->
      <div class="animation-categories">
        
        <!-- Page Transitions -->
        <div class="category-section">
          <h4>🔄 Transiciones de Página</h4>
          <div class="animation-selector">
            <select 
              [(ngModel)]="workingAnimations.pageTransition"
              (change)="onAnimationChange()"
              class="animation-select">
              <option value="">Sin animación</option>
              <option 
                *ngFor="let anim of getAnimationsByCategory('transition')"
                [value]="anim.name">
                {{ anim.displayName }} - {{ anim.description }}
              </option>
            </select>
            <button 
              type="button" 
              class="btn-preview"
              (click)="previewAnimation('page-transition-demo', workingAnimations.pageTransition)"
              [disabled]="!workingAnimations.pageTransition">
              👁️ Preview
            </button>
          </div>
          <div id="page-transition-demo" class="animation-demo-box">
            Transición de página
          </div>
        </div>

        <!-- Hover Effects -->
        <div class="category-section">
          <h4>🎯 Efectos Hover</h4>
          
          <!-- Card Hover -->
          <div class="sub-category">
            <label for="card-hover">Tarjetas:</label>
            <div class="animation-selector">
              <select 
                [(ngModel)]="workingAnimations.cardHover"
                (change)="onAnimationChange()"
                class="animation-select">
                <option value="">Sin efecto</option>
                <option 
                  *ngFor="let anim of getAnimationsByCategory('hover')"
                  [value]="anim.name">
                  {{ anim.displayName }}
                </option>
              </select>
              <button 
                type="button" 
                class="btn-preview"
                (click)="previewAnimation('card-hover-demo', workingAnimations.cardHover)"
                [disabled]="!workingAnimations.cardHover">
                👁️ Preview
              </button>
            </div>
            <div id="card-hover-demo" class="animation-demo-card">
              <div class="demo-card-content">
                <h5>Tarjeta de ejemplo</h5>
                <p>Pasa el mouse para ver el efecto</p>
              </div>
            </div>
          </div>

          <!-- Button Hover -->
          <div class="sub-category">
            <label for="button-hover">Botones:</label>
            <div class="animation-selector">
              <select 
                [(ngModel)]="workingAnimations.buttonHover"
                (change)="onAnimationChange()"
                class="animation-select">
                <option value="">Sin efecto</option>
                <option 
                  *ngFor="let anim of getAnimationsByCategory('hover')"
                  [value]="anim.name">
                  {{ anim.displayName }}
                </option>
              </select>
              <button 
                type="button" 
                class="btn-preview"
                (click)="previewAnimation('button-hover-demo', workingAnimations.buttonHover)"
                [disabled]="!workingAnimations.buttonHover">
                👁️ Preview
              </button>
            </div>
            <button id="button-hover-demo" class="animation-demo-button">
              Botón de ejemplo
            </button>
          </div>

          <!-- Link Hover -->
          <div class="sub-category">
            <label for="link-hover">Enlaces:</label>
            <div class="animation-selector">
              <select 
                [(ngModel)]="workingAnimations.linkHover"
                (change)="onAnimationChange()"
                class="animation-select">
                <option value="">Sin efecto</option>
                <option 
                  *ngFor="let anim of getAnimationsByCategory('hover')"
                  [value]="anim.name">
                  {{ anim.displayName }}
                </option>
              </select>
              <button 
                type="button" 
                class="btn-preview"
                (click)="previewAnimation('link-hover-demo', workingAnimations.linkHover)"
                [disabled]="!workingAnimations.linkHover">
                👁️ Preview
              </button>
            </div>
            <a id="link-hover-demo" href="#" class="animation-demo-link" (click)="$event.preventDefault()">
              Enlace de ejemplo
            </a>
          </div>
        </div>

        <!-- Entrance Animations -->
        <div class="category-section">
          <h4>✨ Animaciones de Entrada</h4>
          <div class="animation-selector">
            <select 
              [(ngModel)]="workingAnimations.modalEntrance"
              (change)="onAnimationChange()"
              class="animation-select">
              <option value="">Sin animación</option>
              <option 
                *ngFor="let anim of getAnimationsByCategory('entrance')"
                [value]="anim.name">
                {{ anim.displayName }} - {{ anim.description }}
              </option>
            </select>
            <button 
              type="button" 
              class="btn-preview"
              (click)="previewAnimation('entrance-demo', workingAnimations.modalEntrance)"
              [disabled]="!workingAnimations.modalEntrance">
              👁️ Preview
            </button>
          </div>
          <div id="entrance-demo" class="animation-demo-box">
            <div class="demo-content">
              <h5>🎉 Elemento con animación</h5>
              <p>Aparece con el efecto seleccionado</p>
            </div>
          </div>
        </div>

        <!-- Scroll Animations -->
        <div class="category-section">
          <h4>📜 Animaciones de Scroll</h4>
          <div class="animation-selector">
            <select 
              [(ngModel)]="workingAnimations.scrollAnimations"
              (change)="onAnimationChange()"
              class="animation-select">
              <option value="">Sin animación</option>
              <option 
                *ngFor="let anim of getAnimationsByCategory('scroll')"
                [value]="anim.name">
                {{ anim.displayName }} - {{ anim.description }}
              </option>
            </select>
            <button 
              type="button" 
              class="btn-preview"
              (click)="previewScrollAnimation()"
              [disabled]="!workingAnimations.scrollAnimations">
              👁️ Preview
            </button>
          </div>
          <div class="scroll-demo-container">
            <div class="scroll-content">
              <div class="scroll-item" data-scroll-animation>🔥 Elemento 1</div>
              <div class="scroll-item" data-scroll-animation>⚡ Elemento 2</div>
              <div class="scroll-item" data-scroll-animation>🎯 Elemento 3</div>
            </div>
          </div>
        </div>

        <!-- Loading Animations -->
        <div class="category-section">
          <h4>⏳ Animaciones de Carga</h4>
          <div class="animation-selector">
            <select 
              [(ngModel)]="workingAnimations.loadingAnimation"
              (change)="onAnimationChange()"
              class="animation-select">
              <option value="">Sin animación</option>
              <option 
                *ngFor="let anim of getAnimationsByCategory('loading')"
                [value]="anim.name">
                {{ anim.displayName }} - {{ anim.description }}
              </option>
            </select>
            <button 
              type="button" 
              class="btn-preview"
              (click)="previewAnimation('loading-demo', workingAnimations.loadingAnimation)"
              [disabled]="!workingAnimations.loadingAnimation">
              👁️ Preview
            </button>
          </div>
          <div id="loading-demo" class="animation-demo-loading">
            <div class="loading-indicator"></div>
          </div>
        </div>
      </div>

      <!-- Performance Settings -->
      <div class="performance-section">
        <h4>⚡ Configuración de Rendimiento</h4>
        <div class="performance-controls">
          <div class="control-group">
            <label>
              <input 
                type="checkbox" 
                [(ngModel)]="performanceSettings.reduceMotion"
                (change)="onPerformanceChange()">
              Respetar preferencia "reduce motion" del sistema
            </label>
          </div>
          <div class="control-group">
            <label>
              <input 
                type="checkbox" 
                [(ngModel)]="performanceSettings.disableOnMobile"
                (change)="onPerformanceChange()">
              Desactivar animaciones en dispositivos móviles
            </label>
          </div>
          <div class="control-group">
            <label>
              Velocidad general:
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1"
                [(ngModel)]="performanceSettings.globalSpeed"
                (input)="onPerformanceChange()"
                class="speed-slider">
              <span class="speed-value">{{ performanceSettings.globalSpeed }}x</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Animation Presets -->
      <div class="presets-section">
        <h4>🎨 Presets de Animación</h4>
        <div class="presets-grid">
          <button 
            *ngFor="let preset of animationPresets"
            type="button"
            class="preset-button"
            [class.active]="isCurrentPreset(preset.name)"
            (click)="applyPreset(preset)">
            <div class="preset-icon">{{ preset.icon }}</div>
            <div class="preset-info">
              <h5>{{ preset.name }}</h5>
              <p>{{ preset.description }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="configurator-actions">
        <button 
          type="button" 
          class="btn-apply"
          (click)="applyAnimations()"
          [disabled]="!hasChanges()">
          ✨ Aplicar Animaciones
        </button>
        <button 
          type="button" 
          class="btn-reset"
          (click)="resetToDefault()">
          🔄 Restablecer
        </button>
        <button 
          type="button" 
          class="btn-export"
          (click)="exportConfig()">
          📤 Exportar Config
        </button>
      </div>

    </div>
  `,
  styles: [`
    .animation-configurator {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .configurator-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f1f5f9;
    }

    .configurator-header h3 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
      font-size: 1.5rem;
    }

    .configurator-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .animation-categories {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .category-section {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      background: #f8fafc;
    }

    .category-section h4 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1.125rem;
    }

    .sub-category {
      margin-bottom: 1rem;
    }

    .sub-category:last-child {
      margin-bottom: 0;
    }

    .sub-category label {
      display: block;
      margin-bottom: 0.5rem;
      color: #4b5563;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .animation-selector {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .animation-select {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      background: white;
    }

    .animation-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .btn-preview {
      padding: 0.5rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color 0.2s ease;
    }

    .btn-preview:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-preview:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    /* Demo Elements */
    .animation-demo-box {
      padding: 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
      margin-top: 0.5rem;
    }

    .animation-demo-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.5rem;
    }

    .demo-card-content h5 {
      margin: 0 0 0.5rem 0;
      color: #374151;
    }

    .demo-card-content p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .animation-demo-button {
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.5rem;
    }

    .animation-demo-link {
      display: inline-block;
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0;
      margin-top: 0.5rem;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .animation-demo-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 60px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-top: 0.5rem;
    }

    .loading-indicator {
      width: 24px;
      height: 24px;
      border: 2px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
    }

    .scroll-demo-container {
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      margin-top: 0.5rem;
    }

    .scroll-content {
      padding: 1rem;
    }

    .scroll-item {
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      background: #f1f5f9;
      border-radius: 6px;
      font-weight: 500;
    }

    .scroll-item:last-child {
      margin-bottom: 0;
    }

    /* Performance Section */
    .performance-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .performance-section h4 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1.125rem;
    }

    .performance-controls {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .control-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #4b5563;
      font-size: 0.875rem;
    }

    .speed-slider {
      width: 100px;
      margin: 0 0.5rem;
    }

    .speed-value {
      font-weight: 500;
      color: #3b82f6;
      min-width: 30px;
    }

    /* Presets Section */
    .presets-section {
      margin-bottom: 2rem;
    }

    .presets-section h4 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1.125rem;
    }

    .presets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .preset-button {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .preset-button:hover {
      border-color: #3b82f6;
      background: #f8fafc;
    }

    .preset-button.active {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .preset-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .preset-info h5 {
      margin: 0 0 0.25rem 0;
      color: #374151;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .preset-info p {
      margin: 0;
      color: #6b7280;
      font-size: 0.75rem;
      line-height: 1.4;
    }

    /* Actions */
    .configurator-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .configurator-actions button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-apply {
      background: #22c55e;
      color: white;
    }

    .btn-apply:hover:not(:disabled) {
      background: #16a34a;
    }

    .btn-apply:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-reset {
      background: #f59e0b;
      color: white;
    }

    .btn-reset:hover {
      background: #d97706;
    }

    .btn-export {
      background: #6366f1;
      color: white;
    }

    .btn-export:hover {
      background: #4f46e5;
    }

    @media (max-width: 768px) {
      .animation-configurator {
        padding: 1rem;
      }

      .presets-grid {
        grid-template-columns: 1fr;
      }

      .configurator-actions {
        flex-direction: column;
      }

      .configurator-actions button {
        width: 100%;
      }
    }
  `]
})
export class AnimationConfiguratorComponent implements OnInit {
  
  @Output() animationsChanged = new EventEmitter<ThemeAnimations>();
  @Output() animationsApplied = new EventEmitter<ThemeAnimations>();
    private animationEngine = inject(AnimationEngineService)

  workingAnimations: ThemeAnimations = this.animationEngine.currentAnimations();
  originalAnimations: ThemeAnimations = { ...this.workingAnimations };

  performanceSettings = {
    reduceMotion: true,
    disableOnMobile: false,
    globalSpeed: 1.0
  };

  animationPresets = [
    {
      name: 'Suave y Elegante',
      icon: '✨',
      description: 'Animaciones sutiles y profesionales',
      config: {
        pageTransition: 'fade-transition',
        cardHover: 'hover-lift',
        buttonHover: 'hover-scale',
        linkHover: 'hover-glow',
        imageHover: 'hover-scale',
        modalEntrance: 'fade-in',
        scrollAnimations: 'reveal-on-scroll',
        loadingAnimation: 'spinner'
      }
    },
    {
      name: 'Dinámico y Energético',
      icon: '⚡',
      description: 'Animaciones llamativas y vibrantes',
      config: {
        pageTransition: 'slide-transition',
        cardHover: 'hover-lift',
        buttonHover: 'hover-scale',
        linkHover: 'hover-slide',
        imageHover: 'hover-scale',
        modalEntrance: 'bounce-in',
        scrollAnimations: 'reveal-on-scroll',
        loadingAnimation: 'pulse'
      }
    },
    {
      name: 'Minimalista',
      icon: '🎯',
      description: 'Animaciones mínimas y funcionales',
      config: {
        pageTransition: 'smooth-transition',
        cardHover: 'hover-lift',
        buttonHover: '',
        linkHover: '',
        imageHover: '',
        modalEntrance: 'fade-in',
        scrollAnimations: '',
        loadingAnimation: 'spinner'
      }
    },
    {
      name: 'Sin Animaciones',
      icon: '⭕',
      description: 'Desactiva todas las animaciones',
      config: {
        pageTransition: '',
        cardHover: '',
        buttonHover: '',
        linkHover: '',
        imageHover: '',
        modalEntrance: '',
        scrollAnimations: '',
        loadingAnimation: ''
      }
    }
  ];




  ngOnInit() {
    this.workingAnimations = { ...this.animationEngine.currentAnimations() };
    this.originalAnimations = { ...this.workingAnimations };
  }

  getAnimationsByCategory(category: AnimationConfig['category']): AnimationConfig[] {
    return this.animationEngine.getAnimationsByCategory(category);
  }

  onAnimationChange() {
    this.animationsChanged.emit(this.workingAnimations);
  }

  onPerformanceChange() {
    // Apply performance settings
    const root = document.documentElement;
    
    if (this.performanceSettings.reduceMotion) {
      root.style.setProperty('--respect-reduced-motion', 'true');
    } else {
      root.style.removeProperty('--respect-reduced-motion');
    }

    if (this.performanceSettings.disableOnMobile) {
      root.style.setProperty('--disable-mobile-animations', 'true');
    } else {
      root.style.removeProperty('--disable-mobile-animations');
    }

    root.style.setProperty('--global-animation-speed', this.performanceSettings.globalSpeed.toString());
  }

  previewAnimation(elementId: string, animationName: string) {
    if (!animationName) return;
    this.animationEngine.previewAnimation(elementId, animationName);
  }

  previewScrollAnimation() {
    const scrollItems = document.querySelectorAll('.scroll-item');
    scrollItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('revealed');
      }, index * 200);
    });

    // Reset after 2 seconds
    setTimeout(() => {
      scrollItems.forEach(item => {
        item.classList.remove('revealed');
      });
    }, 2000);
  }

  applyPreset(preset: typeof this.animationPresets[0]) {
    this.workingAnimations = { ...preset.config };
    this.onAnimationChange();
  }

  isCurrentPreset(presetName: string): boolean {
    const preset = this.animationPresets.find(p => p.name === presetName);
    if (!preset) return false;

    return (Object.keys(preset.config) as Array<keyof ThemeAnimations>).every((configKey) => {
      return this.workingAnimations[configKey] === preset.config[configKey as keyof typeof preset.config];
    });
  }

  applyAnimations() {
    this.animationEngine.updateThemeAnimations(this.workingAnimations);
    this.originalAnimations = { ...this.workingAnimations };
    this.animationsApplied.emit(this.workingAnimations);
    this.showSuccessMessage('¡Animaciones aplicadas exitosamente!');
  }

  resetToDefault() {
    this.animationEngine.resetToDefault();
    this.workingAnimations = { ...this.animationEngine.currentAnimations() };
    this.onAnimationChange();
  }

  exportConfig() {
    const config = {
      animations: this.workingAnimations,
      performance: this.performanceSettings
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-animations-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  hasChanges(): boolean {
    return JSON.stringify(this.workingAnimations) !== JSON.stringify(this.originalAnimations);
  }

  private showSuccessMessage(message: string) {
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
}