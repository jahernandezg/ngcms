import { Injectable, signal } from '@angular/core';

export interface AnimationConfig {
  name: string;
  displayName: string;
  description: string;
  category: 'entrance' | 'hover' | 'scroll' | 'transition' | 'loading';
  cssClass: string;
  duration: number; // in milliseconds
  delay: number; // in milliseconds
  easing: string;
  previewable: boolean;
}

export interface ThemeAnimations {
  pageTransition: string;
  cardHover: string;
  buttonHover: string;
  linkHover: string;
  imageHover: string;
  modalEntrance: string;
  scrollAnimations: string;
  loadingAnimation: string;
  customAnimations?: Record<string, AnimationConfig>;
}

@Injectable({
  providedIn: 'root'
})
export class AnimationEngineService {
  
  // Current animations configuration
  currentAnimations = signal<ThemeAnimations>(this.getDefaultAnimations());
  
  // Available animation presets
  private animationPresets: Record<string, AnimationConfig> = {
    // Entrance Animations
    'fade-in': {
      name: 'fade-in',
      displayName: 'Fade In',
      description: 'Aparición suave con desvanecimiento',
      category: 'entrance',
      cssClass: 'animate-fade-in',
      duration: 500,
      delay: 0,
      easing: 'ease-out',
      previewable: true
    },
    'slide-up': {
      name: 'slide-up',
      displayName: 'Slide Up',
      description: 'Deslizamiento hacia arriba',
      category: 'entrance',
      cssClass: 'animate-slide-up',
      duration: 600,
      delay: 0,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      previewable: true
    },
    'slide-left': {
      name: 'slide-left',
      displayName: 'Slide Left',
      description: 'Deslizamiento desde la derecha',
      category: 'entrance',
      cssClass: 'animate-slide-left',
      duration: 500,
      delay: 0,
      easing: 'ease-out',
      previewable: true
    },
    'zoom-in': {
      name: 'zoom-in',
      displayName: 'Zoom In',
      description: 'Aparición con efecto zoom',
      category: 'entrance',
      cssClass: 'animate-zoom-in',
      duration: 400,
      delay: 0,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      previewable: true
    },
    'bounce-in': {
      name: 'bounce-in',
      displayName: 'Bounce In',
      description: 'Aparición con rebote',
      category: 'entrance',
      cssClass: 'animate-bounce-in',
      duration: 800,
      delay: 0,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      previewable: true
    },
    
    // Hover Animations
    'hover-lift': {
      name: 'hover-lift',
      displayName: 'Lift Effect',
      description: 'Efecto de elevación al pasar el mouse',
      category: 'hover',
      cssClass: 'hover-lift',
      duration: 200,
      delay: 0,
      easing: 'ease-out',
      previewable: true
    },
    'hover-scale': {
      name: 'hover-scale',
      displayName: 'Scale Effect',
      description: 'Efecto de escala al pasar el mouse',
      category: 'hover',
      cssClass: 'hover-scale',
      duration: 200,
      delay: 0,
      easing: 'ease-out',
      previewable: true
    },
    'hover-glow': {
      name: 'hover-glow',
      displayName: 'Glow Effect',
      description: 'Efecto de brillo al pasar el mouse',
      category: 'hover',
      cssClass: 'hover-glow',
      duration: 300,
      delay: 0,
      easing: 'ease-in-out',
      previewable: true
    },
    'hover-slide': {
      name: 'hover-slide',
      displayName: 'Slide Effect',
      description: 'Efecto de deslizamiento al pasar el mouse',
      category: 'hover',
      cssClass: 'hover-slide',
      duration: 250,
      delay: 0,
      easing: 'ease-out',
      previewable: true
    },
    
    // Transition Animations
    'smooth-transition': {
      name: 'smooth-transition',
      displayName: 'Smooth Transition',
      description: 'Transiciones suaves entre páginas',
      category: 'transition',
      cssClass: 'page-transition-smooth',
      duration: 400,
      delay: 0,
      easing: 'ease-in-out',
      previewable: false
    },
    'slide-transition': {
      name: 'slide-transition',
      displayName: 'Slide Transition',
      description: 'Transición deslizante entre páginas',
      category: 'transition',
      cssClass: 'page-transition-slide',
      duration: 500,
      delay: 0,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      previewable: false
    },
    'fade-transition': {
      name: 'fade-transition',
      displayName: 'Fade Transition',
      description: 'Transición con desvanecimiento',
      category: 'transition',
      cssClass: 'page-transition-fade',
      duration: 300,
      delay: 0,
      easing: 'ease-in-out',
      previewable: false
    },
    
    // Scroll Animations
    'reveal-on-scroll': {
      name: 'reveal-on-scroll',
      displayName: 'Reveal on Scroll',
      description: 'Revelación de elementos al hacer scroll',
      category: 'scroll',
      cssClass: 'scroll-reveal',
      duration: 600,
      delay: 100,
      easing: 'ease-out',
      previewable: true
    },
    'parallax-scroll': {
      name: 'parallax-scroll',
      displayName: 'Parallax Scroll',
      description: 'Efecto parallax al hacer scroll',
      category: 'scroll',
      cssClass: 'parallax-scroll',
      duration: 0,
      delay: 0,
      easing: 'linear',
      previewable: true
    },
    
    // Loading Animations
    'spinner': {
      name: 'spinner',
      displayName: 'Spinner',
      description: 'Indicador de carga giratorio',
      category: 'loading',
      cssClass: 'loading-spinner',
      duration: 1000,
      delay: 0,
      easing: 'linear',
      previewable: true
    },
    'pulse': {
      name: 'pulse',
      displayName: 'Pulse',
      description: 'Efecto de pulso para carga',
      category: 'loading',
      cssClass: 'loading-pulse',
      duration: 2000,
      delay: 0,
      easing: 'ease-in-out',
      previewable: true
    },
    'dots': {
      name: 'dots',
      displayName: 'Dots',
      description: 'Puntos animados para carga',
      category: 'loading',
      cssClass: 'loading-dots',
      duration: 1400,
      delay: 0,
      easing: 'ease-in-out',
      previewable: true
    }
  };

  constructor() {
    this.injectAnimationStyles();
  }

  /**
   * Get all available animation presets
   */
  getAnimationPresets(): Record<string, AnimationConfig> {
    return { ...this.animationPresets };
  }

  /**
   * Get animations by category
   */
  getAnimationsByCategory(category: AnimationConfig['category']): AnimationConfig[] {
    return Object.values(this.animationPresets)
      .filter(anim => anim.category === category);
  }

  /**
   * Update theme animations
   */
  updateThemeAnimations(animations: Partial<ThemeAnimations>) {
    const current = this.currentAnimations();
    this.currentAnimations.set({
      ...current,
      ...animations
    });
    
    this.applyAnimationsToDOM();
  }

  /**
   * Reset to default animations
   */
  resetToDefault() {
    this.currentAnimations.set(this.getDefaultAnimations());
    this.applyAnimationsToDOM();
  }

  /**
   * Preview animation on element
   */
  previewAnimation(elementId: string, animationName: string) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const animation = this.animationPresets[animationName];
    if (!animation || !animation.previewable) return;

    // Remove any existing animation classes
    element.className = element.className.replace(/animate-\S+/g, '');
    
  // Force reflow to ensure class removal (asignamos a variable para evitar no-unused-expressions)
  const _forceReflow = element.offsetHeight;
    
    // Add animation class
    element.classList.add(animation.cssClass);
    
    // Remove class after animation completes
    setTimeout(() => {
      element.classList.remove(animation.cssClass);
    }, animation.duration + animation.delay);
  }

  /**
   * Get CSS for current animations
   */
  generateAnimationCSS(): string {
    const animations = this.currentAnimations();
    let css = '';
    
    // Add CSS for each enabled animation
  Object.entries(animations).forEach(([_key, value]) => {
      if (typeof value === 'string' && this.animationPresets[value]) {
        const config = this.animationPresets[value];
        css += this.generateAnimationRule(config);
      }
    });
    
    return css;
  }

  /**
   * Export animations configuration
   */
  exportAnimationsConfig(): ThemeAnimations {
    return { ...this.currentAnimations() };
  }

  /**
   * Import animations configuration
   */
  importAnimationsConfig(config: ThemeAnimations) {
    this.currentAnimations.set(config);
    this.applyAnimationsToDOM();
  }

  /**
   * Default animations configuration
   */
  private getDefaultAnimations(): ThemeAnimations {
    return {
      pageTransition: 'smooth-transition',
      cardHover: 'hover-lift',
      buttonHover: 'hover-scale',
      linkHover: 'hover-glow',
      imageHover: 'hover-scale',
      modalEntrance: 'fade-in',
      scrollAnimations: 'reveal-on-scroll',
      loadingAnimation: 'spinner'
    };
  }

  /**
   * Apply animations to DOM
   */
  private applyAnimationsToDOM() {
    // Update CSS custom properties for animations
    const root = document.documentElement;
    const animations = this.currentAnimations();
    
  Object.entries(animations).forEach(([key, value]) => {
      if (typeof value === 'string' && this.animationPresets[value]) {
        const config = this.animationPresets[value];
        root.style.setProperty(`--animation-${key}-duration`, `${config.duration}ms`);
        root.style.setProperty(`--animation-${key}-easing`, config.easing);
        root.style.setProperty(`--animation-${key}-delay`, `${config.delay}ms`);
      }
    });
  }

  /**
   * Generate CSS rule for animation
   */
  private generateAnimationRule(config: AnimationConfig): string {
    switch (config.category) {
      case 'entrance':
        return this.generateEntranceAnimation(config);
      case 'hover':
        return this.generateHoverAnimation(config);
      case 'transition':
        return this.generateTransitionAnimation(config);
      case 'scroll':
        return this.generateScrollAnimation(config);
      case 'loading':
        return this.generateLoadingAnimation(config);
      default:
        return '';
    }
  }

  /**
   * Generate entrance animation CSS
   */
  private generateEntranceAnimation(config: AnimationConfig): string {
    const keyframes = this.getEntranceKeyframes(config.name);
    return `
      .${config.cssClass} {
        animation: ${config.name} ${config.duration}ms ${config.easing} ${config.delay}ms forwards;
      }
      
      @keyframes ${config.name} {
        ${keyframes}
      }
    `;
  }

  /**
   * Generate hover animation CSS
   */
  private generateHoverAnimation(config: AnimationConfig): string {
    const transform = this.getHoverTransform(config.name);
    return `
      .${config.cssClass} {
        transition: all ${config.duration}ms ${config.easing};
      }
      
      .${config.cssClass}:hover {
        ${transform}
      }
    `;
  }

  /**
   * Generate transition animation CSS
   */
  private generateTransitionAnimation(config: AnimationConfig): string {
    return `
      .${config.cssClass} {
        transition: all ${config.duration}ms ${config.easing};
      }
    `;
  }

  /**
   * Generate scroll animation CSS
   */
  private generateScrollAnimation(config: AnimationConfig): string {
    if (config.name === 'reveal-on-scroll') {
      return `
        .${config.cssClass} {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity ${config.duration}ms ${config.easing} ${config.delay}ms,
                      transform ${config.duration}ms ${config.easing} ${config.delay}ms;
        }
        
        .${config.cssClass}.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `;
    }
    
    if (config.name === 'parallax-scroll') {
      return `
        .${config.cssClass} {
          will-change: transform;
        }
      `;
    }
    
    return '';
  }

  /**
   * Generate loading animation CSS
   */
  private generateLoadingAnimation(config: AnimationConfig): string {
    const keyframes = this.getLoadingKeyframes(config.name);
    return `
      .${config.cssClass} {
        animation: ${config.name} ${config.duration}ms ${config.easing} infinite;
      }
      
      @keyframes ${config.name} {
        ${keyframes}
      }
    `;
  }

  /**
   * Get entrance animation keyframes
   */
  private getEntranceKeyframes(name: string): string {
    const keyframesMap: Record<string, string> = {
      'fade-in': `
        from { opacity: 0; }
        to { opacity: 1; }
      `,
      'slide-up': `
        from { 
          opacity: 0; 
          transform: translateY(30px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      `,
      'slide-left': `
        from { 
          opacity: 0; 
          transform: translateX(30px); 
        }
        to { 
          opacity: 1; 
          transform: translateX(0); 
        }
      `,
      'zoom-in': `
        from { 
          opacity: 0; 
          transform: scale(0.8); 
        }
        to { 
          opacity: 1; 
          transform: scale(1); 
        }
      `,
      'bounce-in': `
        0% { 
          opacity: 0; 
          transform: scale(0.3); 
        }
        50% { 
          opacity: 1; 
          transform: scale(1.05); 
        }
        70% { 
          transform: scale(0.9); 
        }
        100% { 
          opacity: 1; 
          transform: scale(1); 
        }
      `
    };
    
    return keyframesMap[name] || '';
  }

  /**
   * Get hover animation transforms
   */
  private getHoverTransform(name: string): string {
    const transformMap: Record<string, string> = {
      'hover-lift': `
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      `,
      'hover-scale': `
        transform: scale(1.05);
      `,
      'hover-glow': `
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        border-color: #3b82f6;
      `,
      'hover-slide': `
        transform: translateX(4px);
      `
    };
    
    return transformMap[name] || '';
  }

  /**
   * Get loading animation keyframes
   */
  private getLoadingKeyframes(name: string): string {
    const keyframesMap: Record<string, string> = {
      'spinner': `
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      `,
      'pulse': `
        0%, 100% { 
          opacity: 1; 
          transform: scale(1); 
        }
        50% { 
          opacity: 0.5; 
          transform: scale(1.05); 
        }
      `,
      'dots': `
        0%, 20% { 
          opacity: 0; 
          transform: scale(1); 
        }
        50% { 
          opacity: 1; 
          transform: scale(1.2); 
        }
        100% { 
          opacity: 0; 
          transform: scale(1); 
        }
      `
    };
    
    return keyframesMap[name] || '';
  }

  /**
   * Inject animation styles into DOM
   */
  private injectAnimationStyles() {
    if (typeof document === 'undefined') return;
    
    const styleId = 'theme-animations';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Generate and inject CSS
    const css = this.generateAnimationCSS();
    styleElement.textContent = css;
  }
}