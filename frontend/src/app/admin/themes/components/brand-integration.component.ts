import { Component, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandColorExtractorService, ExtractedBrand, ColorPalette } from '../../../shared/brand-color-extractor.service';

@Component({
  standalone: true,
  selector: 'app-brand-integration',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="brand-integration-container">
      
      <!-- Header -->
      <div class="integration-header">
        <h3>🎨 Integración de Marca</h3>
        <p>Extrae colores automáticamente de tu logo para crear una paleta perfecta</p>
      </div>

      <!-- Upload Options -->
      <div class="upload-options">
        
        <!-- File Upload -->
        <div class="upload-section">
          <h4>📤 Subir Logo</h4>
          <div class="file-upload-area" 
               [class.dragover]="isDragOver()"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               (click)="fileInput.click()">
            
            <div *ngIf="!selectedFile()" class="upload-placeholder">
              <div class="upload-icon">📁</div>
              <p><strong>Arrastra tu logo aquí</strong> o haz clic para seleccionar</p>
              <small>Formatos soportados: PNG, JPG, SVG</small>
            </div>
            
            <div *ngIf="selectedFile()" class="file-preview">
              <img [src]="previewUrl()" [alt]="selectedFile()!.name" class="logo-preview">
              <div class="file-info">
                <p class="file-name">{{ selectedFile()!.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile()!.size) }}</p>
                <button type="button" class="btn-remove" (click)="removeFile($event)">
                  ❌ Quitar
                </button>
              </div>
            </div>
            
            <input 
              #fileInput
              type="file" 
              accept="image/*" 
              (change)="onFileSelected($event)"
              style="display: none">
          </div>
        </div>

        <!-- URL Input -->
        <div class="url-section">
          <h4>🔗 URL del Logo</h4>
          <div class="url-input-group">
            <input 
              type="url" 
              [(ngModel)]="logoUrl"
              placeholder="https://ejemplo.com/logo.png"
              class="url-input"
              (blur)="validateUrl()">
            <button 
              type="button" 
              class="btn-load-url"
              [disabled]="!isValidUrl() || brandExtractor.isExtracting()"
              (click)="loadFromUrl()">
              {{ brandExtractor.isExtracting() ? '⏳' : '🔍' }} Cargar
            </button>
          </div>
          <div *ngIf="urlError()" class="url-error">
            ⚠️ {{ urlError() }}
          </div>
        </div>
      </div>

      <!-- Brand Name Input -->
      <div class="brand-name-section">
        <label for="brandName">🏷️ Nombre de la Marca (opcional)</label>
        <input 
          id="brandName"
          type="text" 
          [(ngModel)]="brandName"
          placeholder="Mi Empresa"
          class="brand-name-input"
          maxlength="50">
        <small>Se usará para generar el nombre del tema automáticamente</small>
      </div>

      <!-- Extraction Progress -->
      <div *ngIf="brandExtractor.isExtracting()" class="extraction-progress">
        <div class="progress-header">
          <h4>🔄 Extrayendo colores...</h4>
          <span class="progress-percentage">{{ brandExtractor.extractionProgress() }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="brandExtractor.extractionProgress()"></div>
        </div>
        <div class="progress-steps">
          <div class="progress-step" [class.active]="brandExtractor.extractionProgress() >= 25">
            📸 Procesando imagen
          </div>
          <div class="progress-step" [class.active]="brandExtractor.extractionProgress() >= 50">
            🎨 Analizando colores
          </div>
          <div class="progress-step" [class.active]="brandExtractor.extractionProgress() >= 75">
            🎯 Generando paleta
          </div>
          <div class="progress-step" [class.active]="brandExtractor.extractionProgress() >= 100">
            ✅ Completado
          </div>
        </div>
      </div>

      <!-- Extracted Palette Display -->
      <div *ngIf="extractedBrand()" class="extracted-palette">
        <div class="palette-header">
          <h4>🎨 Paleta Extraída</h4>
          <div class="confidence-score">
            <span class="confidence-label">Confianza:</span>
            <div class="confidence-bar">
              <div class="confidence-fill" 
                   [style.width.%]="extractedBrand()!.palette.confidence * 100"
                   [class]="getConfidenceClass(extractedBrand()!.palette.confidence)"></div>
            </div>
            <span class="confidence-text">{{ Math.round(extractedBrand()!.palette.confidence * 100) }}%</span>
          </div>
        </div>

        <!-- Main Colors -->
        <div class="main-colors">
          <div class="color-group">
            <div class="color-swatch primary" [style.background-color]="extractedBrand()!.palette.primary">
              <span class="color-label">Principal</span>
              <span class="color-value">{{ extractedBrand()!.palette.primary }}</span>
            </div>
          </div>
          <div class="color-group">
            <div class="color-swatch secondary" [style.background-color]="extractedBrand()!.palette.secondary">
              <span class="color-label">Secundario</span>
              <span class="color-value">{{ extractedBrand()!.palette.secondary }}</span>
            </div>
          </div>
          <div class="color-group">
            <div class="color-swatch accent" [style.background-color]="extractedBrand()!.palette.accent">
              <span class="color-label">Acento</span>
              <span class="color-value">{{ extractedBrand()!.palette.accent }}</span>
            </div>
          </div>
        </div>

        <!-- Dominant Colors -->
        <div class="dominant-colors">
          <h5>Colores dominantes detectados:</h5>
          <div class="dominant-colors-grid">
            <div 
              *ngFor="let color of extractedBrand()!.palette.dominantColors.slice(0, 6)"
              class="dominant-color"
              [style.background-color]="color"
              [title]="color">
            </div>
          </div>
        </div>

        <!-- Suggested Theme Name -->
        <div class="suggested-theme">
          <label>💡 Nombre sugerido del tema:</label>
          <input 
            type="text" 
            [(ngModel)]="suggestedName"
            class="suggested-name-input"
            maxlength="50">
        </div>

        <!-- Actions -->
        <div class="palette-actions">
          <button 
            type="button" 
            class="btn-apply-palette"
            (click)="applyPalette()">
            ✨ Aplicar Paleta
          </button>
          <button 
            type="button" 
            class="btn-regenerate"
            (click)="regeneratePalette()"
            [disabled]="brandExtractor.isExtracting()">
            🔄 Regenerar
          </button>
          <button 
            type="button" 
            class="btn-save-brand"
            (click)="saveBrand()">
            💾 Guardar Marca
          </button>
        </div>
      </div>

      <!-- Error Display -->
      <div *ngIf="extractionError()" class="extraction-error">
        <h4>❌ Error en la extracción</h4>
        <p>{{ extractionError() }}</p>
        <button type="button" class="btn-retry" (click)="clearError()">
          🔄 Reintentar
        </button>
      </div>

    </div>
  `,
  styles: [`
    .brand-integration-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .integration-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f1f5f9;
    }

    .integration-header h3 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
      font-size: 1.5rem;
    }

    .integration-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .upload-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 768px) {
      .upload-options {
        grid-template-columns: 1fr;
      }
    }

    .upload-section h4,
    .url-section h4 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1rem;
    }

    .file-upload-area {
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #f8fafc;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .file-upload-area:hover,
    .file-upload-area.dragover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .upload-placeholder .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .upload-placeholder p {
      margin: 0 0 0.5rem 0;
      color: #374151;
    }

    .upload-placeholder small {
      color: #64748b;
      font-size: 0.875rem;
    }

    .file-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .logo-preview {
      max-width: 120px;
      max-height: 120px;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .file-info {
      text-align: center;
    }

    .file-name {
      margin: 0 0 0.25rem 0;
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .file-size {
      margin: 0 0 0.5rem 0;
      color: #64748b;
      font-size: 0.75rem;
    }

    .btn-remove {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .btn-remove:hover {
      background: #dc2626;
    }

    .url-input-group {
      display: flex;
      gap: 0.5rem;
    }

    .url-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .url-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .btn-load-url {
      padding: 0.75rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      white-space: nowrap;
      transition: background-color 0.2s ease;
    }

    .btn-load-url:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-load-url:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .url-error {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 4px;
      color: #dc2626;
      font-size: 0.875rem;
    }

    .brand-name-section {
      margin-bottom: 1.5rem;
    }

    .brand-name-section label {
      display: block;
      margin-bottom: 0.5rem;
      color: #374151;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .brand-name-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .brand-name-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .brand-name-section small {
      display: block;
      margin-top: 0.25rem;
      color: #64748b;
      font-size: 0.75rem;
    }

    .extraction-progress {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .progress-header h4 {
      margin: 0;
      color: #374151;
    }

    .progress-percentage {
      font-weight: 600;
      color: #3b82f6;
    }

    .progress-bar {
      background: #e5e7eb;
      border-radius: 4px;
      height: 8px;
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .progress-fill {
      background: #3b82f6;
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
    }

    .progress-step {
      font-size: 0.75rem;
      color: #9ca3af;
      transition: color 0.3s ease;
    }

    .progress-step.active {
      color: #3b82f6;
      font-weight: 500;
    }

    .extracted-palette {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .palette-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .palette-header h4 {
      margin: 0;
      color: #374151;
    }

    .confidence-score {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .confidence-label {
      color: #64748b;
    }

    .confidence-bar {
      width: 60px;
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .confidence-fill.high {
      background: #22c55e;
    }

    .confidence-fill.medium {
      background: #f59e0b;
    }

    .confidence-fill.low {
      background: #ef4444;
    }

    .confidence-text {
      color: #374151;
      font-weight: 500;
    }

    .main-colors {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .color-swatch {
      border-radius: 8px;
      padding: 1rem;
      color: white;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      position: relative;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .color-label {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .color-value {
      font-size: 0.75rem;
      opacity: 0.9;
      font-family: monospace;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .dominant-colors {
      margin-bottom: 1.5rem;
    }

    .dominant-colors h5 {
      margin: 0 0 0.75rem 0;
      color: #374151;
      font-size: 0.875rem;
    }

    .dominant-colors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 0.5rem;
      max-width: 300px;
    }

    .dominant-color {
      aspect-ratio: 1;
      border-radius: 6px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .dominant-color:hover {
      transform: scale(1.1);
    }

    .suggested-theme {
      margin-bottom: 1.5rem;
    }

    .suggested-theme label {
      display: block;
      margin-bottom: 0.5rem;
      color: #374151;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .suggested-name-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .suggested-name-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .palette-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .palette-actions button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-apply-palette {
      background: #22c55e;
      color: white;
    }

    .btn-apply-palette:hover {
      background: #16a34a;
    }

    .btn-regenerate {
      background: #f59e0b;
      color: white;
    }

    .btn-regenerate:hover:not(:disabled) {
      background: #d97706;
    }

    .btn-regenerate:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-save-brand {
      background: #3b82f6;
      color: white;
    }

    .btn-save-brand:hover {
      background: #2563eb;
    }

    .extraction-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }

    .extraction-error h4 {
      margin: 0 0 0.5rem 0;
      color: #dc2626;
    }

    .extraction-error p {
      margin: 0 0 1rem 0;
      color: #991b1b;
    }

    .btn-retry {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .btn-retry:hover {
      background: #dc2626;
    }
  `]
})
export class BrandIntegrationComponent {
  
  @Output() paletteApplied = new EventEmitter<ColorPalette>();
  @Output() brandSaved = new EventEmitter<ExtractedBrand>();

  // File upload state
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string>('');
  isDragOver = signal(false);
  
  // URL state
  logoUrl = '';
  urlError = signal<string>('');
  
  // Brand state
  brandName = '';
  suggestedName = '';
  
  // Extraction state
  extractedBrand = signal<ExtractedBrand | null>(null);
  extractionError = signal<string>('');

  constructor(public brandExtractor: BrandColorExtractorService) {}

  // File handling methods
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setSelectedFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.setSelectedFile(event.dataTransfer.files[0]);
    }
  }

  private setSelectedFile(file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.extractionError.set('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.extractionError.set('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    this.selectedFile.set(file);
    this.clearError();
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    this.previewUrl.set(url);
    
    // Auto-extract colors
    this.extractColorsFromFile();
  }

  removeFile(event: Event) {
    event.stopPropagation();
    
    // Revoke URL to free memory
    if (this.previewUrl()) {
      URL.revokeObjectURL(this.previewUrl());
    }
    
    this.selectedFile.set(null);
    this.previewUrl.set('');
    this.extractedBrand.set(null);
  }

  // URL handling methods
  validateUrl() {
    this.urlError.set('');
    
    if (this.logoUrl && !this.isValidUrl()) {
      this.urlError.set('Por favor ingresa una URL válida.');
    }
  }

  isValidUrl(): boolean {
    if (!this.logoUrl.trim()) return false;
    
    try {
      const url = new URL(this.logoUrl);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async loadFromUrl() {
    if (!this.isValidUrl()) return;
    
    try {
      this.clearError();
      await this.extractColorsFromUrl();
    } catch (error) {
      this.extractionError.set('Error al cargar la imagen desde la URL.');
    }
  }

  // Color extraction methods
  private async extractColorsFromFile() {
    if (!this.selectedFile()) return;

    try {
      const extractedBrand = await this.brandExtractor.extractColorsFromLogo(
        this.selectedFile()!,
        this.brandName
      );
      
      this.extractedBrand.set(extractedBrand);
      this.suggestedName = extractedBrand.suggestedThemeName;
      this.clearError();
      
    } catch (error) {
      this.extractionError.set('Error al extraer colores del logo. Por favor intenta con otra imagen.');
    }
  }

  private async extractColorsFromUrl() {
    try {
      const extractedBrand = await this.brandExtractor.extractColorsFromUrl(
        this.logoUrl,
        this.brandName
      );
      
      this.extractedBrand.set(extractedBrand);
      this.suggestedName = extractedBrand.suggestedThemeName;
      this.clearError();
      
    } catch (error) {
      this.extractionError.set('Error al extraer colores desde la URL. Verifica que la imagen sea accesible.');
    }
  }

  async regeneratePalette() {
    if (this.selectedFile()) {
      await this.extractColorsFromFile();
    } else if (this.logoUrl) {
      await this.extractColorsFromUrl();
    }
  }

  // Action methods
  applyPalette() {
    const brand = this.extractedBrand();
    if (!brand) return;

    this.paletteApplied.emit(brand.palette);
  }

  saveBrand() {
    const brand = this.extractedBrand();
    if (!brand) return;

    // Update brand name if changed
    const updatedBrand: ExtractedBrand = {
      ...brand,
      brandName: this.brandName || brand.brandName,
      suggestedThemeName: this.suggestedName || brand.suggestedThemeName
    };

    this.brandSaved.emit(updatedBrand);
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getConfidenceClass(confidence: number): string {
    if (confidence > 0.7) return 'high';
    if (confidence > 0.4) return 'medium';
    return 'low';
  }

  clearError() {
    this.extractionError.set('');
    this.urlError.set('');
  }

  // Expose Math for template
  Math = Math;
}