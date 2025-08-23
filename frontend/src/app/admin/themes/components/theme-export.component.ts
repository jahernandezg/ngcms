import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeExportService, ExportOptions } from '../../../shared/theme-export.service';
import { ActiveTheme } from '../../../shared/theme.service';

@Component({
  standalone: true,
  selector: 'app-theme-export',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="theme-export-container">
      
      <!-- Header -->
      <div class="export-header">
        <h3>📤 Exportar Tema</h3>
        <p>Descarga tu tema personalizado como CSS listo para usar</p>
      </div>

      <!-- Export Options -->
      <div class="export-options">
        <h4>⚙️ Opciones de Exportación</h4>
        
        <div class="options-grid">
          
          <!-- Content Options -->
          <div class="option-group">
            <h5>Contenido a incluir:</h5>
            <label class="option-item">
              <input 
                type="checkbox" 
                [(ngModel)]="exportOptions.includeCustomProperties"
                class="option-checkbox">
              <div class="option-info">
                <span class="option-title">CSS Custom Properties</span>
                <small>Variables CSS para fácil personalización</small>
              </div>
            </label>
            
            <label class="option-item">
              <input 
                type="checkbox" 
                [(ngModel)]="exportOptions.includeComponents"
                class="option-checkbox">
              <div class="option-info">
                <span class="option-title">Componentes</span>
                <small>Estilos para botones, tarjetas, formularios, etc.</small>
              </div>
            </label>
            
            <label class="option-item">
              <input 
                type="checkbox" 
                [(ngModel)]="exportOptions.includeUtilities"
                class="option-checkbox">
              <div class="option-info">
                <span class="option-title">Clases Utilitarias</span>
                <small>Clases para espaciado, colores, tipografía, etc.</small>
              </div>
            </label>
            
            <label class="option-item">
              <input 
                type="checkbox" 
                [(ngModel)]="exportOptions.includeAnimations"
                class="option-checkbox">
              <div class="option-info">
                <span class="option-title">Animaciones</span>
                <small>CSS de animaciones y transiciones</small>
              </div>
            </label>
          </div>

          <!-- Format Options -->
          <div class="option-group">
            <h5>Formato de salida:</h5>
            <div class="format-options">
              <label class="format-option">
                <input 
                  type="radio" 
                  name="format" 
                  value="css"
                  [(ngModel)]="exportOptions.format">
                <div class="format-info">
                  <span class="format-title">CSS</span>
                  <small>Archivo CSS estándar</small>
                </div>
              </label>
              
              <label class="format-option">
                <input 
                  type="radio" 
                  name="format" 
                  value="scss"
                  [(ngModel)]="exportOptions.format">
                <div class="format-info">
                  <span class="format-title">SCSS</span>
                  <small>Sass/SCSS con variables anidadas</small>
                </div>
              </label>
              
              <label class="format-option">
                <input 
                  type="radio" 
                  name="format" 
                  value="less"
                  [(ngModel)]="exportOptions.format">
                <div class="format-info">
                  <span class="format-title">Less</span>
                  <small>Less CSS con variables</small>
                </div>
              </label>
            </div>
          </div>

          <!-- Output Options -->
          <div class="option-group">
            <h5>Configuración de salida:</h5>
            <label class="option-item">
              <input 
                type="checkbox" 
                [(ngModel)]="exportOptions.minify"
                class="option-checkbox">
              <div class="option-info">
                <span class="option-title">Minificar CSS</span>
                <small>Reduce el tamaño del archivo eliminando espacios</small>
              </div>
            </label>
          </div>
          
        </div>
      </div>

      <!-- Preview Section -->
      <div class="export-preview">
        <h4>👁️ Vista Previa del Export</h4>
        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-label">Formato:</span>
            <span class="stat-value">{{ exportOptions.format.toUpperCase() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Tamaño estimado:</span>
            <span class="stat-value">{{ getEstimatedSize() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Componentes:</span>
            <span class="stat-value">{{ getComponentCount() }}</span>
          </div>
        </div>

        <!-- CSS Preview -->
        <div class="css-preview" *ngIf="previewCSS()">
          <div class="preview-header">
            <span>Vista previa del CSS:</span>
            <button 
              type="button" 
              class="btn-copy"
              (click)="copyCSSToClipboard()"
              [title]="copySuccess() ? '¡Copiado!' : 'Copiar CSS'">
              {{ copySuccess() ? '✅' : '📋' }}
            </button>
          </div>
          <pre class="css-code">{{ previewCSS() }}</pre>
        </div>
      </div>

      <!-- Export Actions -->
      <div class="export-actions">
        
        <!-- Single File Export -->
        <div class="action-group">
          <h5>Archivo Individual:</h5>
          <div class="action-buttons">
            <button 
              type="button" 
              class="btn-export primary"
              (click)="exportSingleFile()"
              [disabled]="!theme()">
              📄 Descargar CSS
            </button>
            
            <button 
              type="button" 
              class="btn-export"
              (click)="generatePreview()"
              [disabled]="!theme()">
              👁️ Generar Vista Previa
            </button>
          </div>
        </div>

        <!-- Package Export -->
        <div class="action-group">
          <h5>Paquete Completo:</h5>
          <div class="action-buttons">
            <button 
              type="button" 
              class="btn-export primary"
              (click)="exportPackage()"
              [disabled]="!theme()">
              📦 Descargar Paquete
            </button>
          </div>
          <small class="action-description">
            Incluye CSS, configuración JSON y documentación
          </small>
        </div>

        <!-- Integration Code -->
        <div class="action-group">
          <h5>Código de Integración:</h5>
          <div class="integration-code">
            <div class="code-tabs">
              <button 
                *ngFor="let tab of integrationTabs"
                type="button"
                class="code-tab"
                [class.active]="activeTab() === tab.id"
                (click)="activeTab.set(tab.id)">
                {{ tab.label }}
              </button>
            </div>
            
            <div class="code-content">
              <pre class="integration-snippet">{{ getCurrentIntegrationCode() }}</pre>
              <button 
                type="button" 
                class="btn-copy-code"
                (click)="copyIntegrationCode()"
                [title]="copyIntegrationSuccess() ? '¡Copiado!' : 'Copiar código'">
                {{ copyIntegrationSuccess() ? '✅ Copiado' : '📋 Copiar' }}
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Usage Instructions -->
      <div class="usage-instructions">
        <h4>📋 Instrucciones de Uso</h4>
        <div class="instructions-content">
          <div class="instruction-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h5>Incluir el CSS</h5>
              <p>Agrega el archivo CSS a tu proyecto usando una etiqueta &lt;link&gt; o importándolo en tu CSS principal.</p>
            </div>
          </div>
          
          <div class="instruction-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h5>Usar las Clases</h5>
              <p>Aplica las clases del tema a tus elementos HTML. Por ejemplo: <code>class="theme-button theme-primary"</code></p>
            </div>
          </div>
          
          <div class="instruction-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h5>Personalizar</h5>
              <p>Modifica las variables CSS para ajustar colores, fuentes y espaciado según tus necesidades.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .theme-export-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .export-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f1f5f9;
    }

    .export-header h3 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
      font-size: 1.5rem;
    }

    .export-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .export-options {
      margin-bottom: 2rem;
    }

    .export-options h4 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1.125rem;
    }

    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .option-group {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .option-group h5 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1rem;
      font-weight: 600;
    }

    .option-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .option-item:last-child {
      border-bottom: none;
    }

    .option-item:hover {
      background: rgba(59, 130, 246, 0.05);
      border-radius: 6px;
      margin: 0 -0.5rem;
      padding: 0.75rem 0.5rem;
    }

    .option-checkbox {
      margin-top: 0.125rem;
    }

    .option-info {
      flex: 1;
    }

    .option-title {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .option-info small {
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.3;
    }

    .format-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .format-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .format-option:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .format-option input[type="radio"]:checked + .format-info .format-title {
      color: #3b82f6;
      font-weight: 600;
    }

    .format-title {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .format-info small {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .export-preview {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .export-preview h4 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1.125rem;
    }

    .preview-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: white;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .stat-value {
      color: #374151;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .css-preview {
      margin-top: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .btn-copy {
      padding: 0.25rem 0.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .btn-copy:hover {
      background: #2563eb;
    }

    .css-code {
      padding: 1rem;
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.4;
      color: #374151;
      background: white;
      overflow-x: auto;
      max-height: 200px;
    }

    .export-actions {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .action-group h5 {
      margin: 0 0 0.75rem 0;
      color: #374151;
      font-size: 1rem;
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-export {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e5e7eb;
      background: white;
      color: #374151;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-export:hover:not(:disabled) {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #3b82f6;
    }

    .btn-export.primary {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .btn-export.primary:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-export:disabled {
      background: #f3f4f6;
      border-color: #d1d5db;
      color: #9ca3af;
      cursor: not-allowed;
    }

    .action-description {
      display: block;
      margin-top: 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
      font-style: italic;
    }

    .integration-code {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .code-tabs {
      display: flex;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .code-tab {
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      font-size: 0.875rem;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 2px solid transparent;
    }

    .code-tab:hover {
      color: #374151;
      background: #f3f4f6;
    }

    .code-tab.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
      background: white;
    }

    .code-content {
      position: relative;
      padding: 1rem;
      background: #1f2937;
    }

    .integration-snippet {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.4;
      color: #e5e7eb;
      background: none;
      overflow-x: auto;
    }

    .btn-copy-code {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #374151;
      color: #d1d5db;
      border: 1px solid #4b5563;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-copy-code:hover {
      background: #4b5563;
      color: white;
    }

    .usage-instructions {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .usage-instructions h4 {
      margin: 0 0 1.5rem 0;
      color: #374151;
      font-size: 1.125rem;
    }

    .instructions-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .instruction-step {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      font-size: 0.875rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-content h5 {
      margin: 0 0 0.5rem 0;
      color: #374151;
      font-size: 1rem;
      font-weight: 600;
    }

    .step-content p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .step-content code {
      background: #f1f5f9;
      padding: 0.125rem 0.25rem;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.75rem;
      color: #1e293b;
    }

    @media (max-width: 768px) {
      .theme-export-container {
        padding: 1rem;
      }

      .options-grid {
        grid-template-columns: 1fr;
      }

      .preview-stats {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
      }

      .code-tabs {
        flex-wrap: wrap;
      }

      .instruction-step {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class ThemeExportComponent {
  
  @Input() theme = signal<ActiveTheme | null>(null);

  exportOptions: ExportOptions = {
    includeAnimations: true,
    includeCustomProperties: true,
    includeUtilities: true,
    includeComponents: true,
    minify: false,
    format: 'css'
  };

  previewCSS = signal<string>('');
  copySuccess = signal<boolean>(false);
  copyIntegrationSuccess = signal<boolean>(false);
  activeTab = signal<string>('html');

  integrationTabs = [
    { id: 'html', label: 'HTML' },
    { id: 'react', label: 'React' },
    { id: 'vue', label: 'Vue' },
    { id: 'angular', label: 'Angular' }
  ];

  constructor(private themeExportService: ThemeExportService) {}

  exportSingleFile() {
    const currentTheme = this.theme();
    if (!currentTheme) return;

    this.themeExportService.downloadThemeCSS(
      currentTheme, 
      this.exportOptions,
      this.generateFileName()
    );

    this.showSuccessMessage('¡Archivo CSS descargado exitosamente!');
  }

  exportPackage() {
    const currentTheme = this.theme();
    if (!currentTheme) return;

    this.themeExportService.downloadThemePackage(currentTheme, this.exportOptions);
    this.showSuccessMessage('¡Paquete de tema descargado exitosamente!');
  }

  generatePreview() {
    const currentTheme = this.theme();
    if (!currentTheme) return;

    const themeExport = this.themeExportService.exportThemeCSS(currentTheme, this.exportOptions);
    this.previewCSS.set(themeExport.css.slice(0, 2000) + (themeExport.css.length > 2000 ? '...\n/* CSS truncado para vista previa */' : ''));
  }

  copyCSSToClipboard() {
    const css = this.previewCSS();
    if (!css) return;

    navigator.clipboard.writeText(css).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    });
  }

  copyIntegrationCode() {
    const code = this.getCurrentIntegrationCode();
    
    navigator.clipboard.writeText(code).then(() => {
      this.copyIntegrationSuccess.set(true);
      setTimeout(() => this.copyIntegrationSuccess.set(false), 2000);
    });
  }

  getCurrentIntegrationCode(): string {
    const themeName = this.generateFileName();
    
    switch (this.activeTab()) {
      case 'html':
        return `<!-- Incluir en el <head> de tu HTML -->
<link rel="stylesheet" href="${themeName}">

<!-- Usar las clases en tu HTML -->
<button class="theme-button">Mi Botón</button>
<div class="theme-card">
  <h3 class="theme-heading">Título</h3>
  <p>Contenido de la tarjeta</p>
</div>`;

      case 'react':
        return `// Importar en tu componente React
import './${themeName}';

// Usar en JSX
function MyComponent() {
  return (
    <div className="theme-container">
      <button className="theme-button">Mi Botón</button>
      <div className="theme-card">
        <h3 className="theme-heading">Título</h3>
        <p>Contenido de la tarjeta</p>
      </div>
    </div>
  );
}`;

      case 'vue':
        return `<!-- Importar en tu componente Vue -->
<template>
  <div class="theme-container">
    <button class="theme-button">Mi Botón</button>
    <div class="theme-card">
      <h3 class="theme-heading">Título</h3>
      <p>Contenido de la tarjeta</p>
    </div>
  </div>
</template>

<style>
@import './${themeName}';
</style>`;

      case 'angular':
        return `// Importar en styles.css o en el componente
@import './${themeName}';

// Usar en el template
<div class="theme-container">
  <button class="theme-button">Mi Botón</button>
  <div class="theme-card">
    <h3 class="theme-heading">Título</h3>
    <p>Contenido de la tarjeta</p>
  </div>
</div>`;

      default:
        return '';
    }
  }

  getEstimatedSize(): string {
    const currentTheme = this.theme();
    if (!currentTheme) return '0 KB';

    const themeExport = this.themeExportService.exportThemeCSS(currentTheme, this.exportOptions);
    const sizeInBytes = new Blob([themeExport.css]).size;
    
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  getComponentCount(): string {
    let count = 0;
    
    if (this.exportOptions.includeComponents) count += 8; // buttons, cards, forms, etc.
    if (this.exportOptions.includeUtilities) count += 20; // utility classes
    if (this.exportOptions.includeCustomProperties) count += 1; // root variables
    if (this.exportOptions.includeAnimations) count += 5; // animation styles
    
    return `${count} estilos`;
  }

  private generateFileName(): string {
    const currentTheme = this.theme();
    if (!currentTheme) return 'theme.css';

    const baseName = currentTheme.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const extension = this.exportOptions.format;
    
    return `${baseName}-theme.${extension}`;
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