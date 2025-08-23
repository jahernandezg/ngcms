import { Component, OnInit, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeMarketplaceService, MarketplaceTheme, MarketplaceFilters } from '../../../shared/theme-marketplace.service';
import { ActiveTheme } from '../../../shared/theme.service';

@Component({
  standalone: true,
  selector: 'app-theme-marketplace',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="theme-marketplace">
      
      <!-- Header -->
      <div class="marketplace-header">
        <h3>🛍️ Marketplace de Temas</h3>
        <p>Descubre y descarga temas creados por la comunidad</p>
      </div>

      <!-- Search and Filters -->
      <div class="search-section">
        <div class="search-bar">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Buscar temas..."
            class="search-input">
          <button 
            type="button" 
            class="search-btn"
            (click)="onSearch()">
            🔍
          </button>
        </div>

        <div class="filters-bar">
          <select 
            [(ngModel)]="filters.category"
            (change)="applyFilters()"
            class="filter-select">
            <option value="">Todas las categorías</option>
            <option value="GENERAL">General</option>
            <option value="BUSINESS">Business</option>
            <option value="BLOG">Blog</option>
            <option value="PORTFOLIO">Portfolio</option>
            <option value="ECOMMERCE">E-commerce</option>
            <option value="CREATIVE">Creativo</option>
          </select>

          <select 
            [(ngModel)]="filters.license"
            (change)="applyFilters()"
            class="filter-select">
            <option value="all">Todas las licencias</option>
            <option value="free">Gratuito</option>
            <option value="premium">Premium</option>
          </select>

          <select 
            [(ngModel)]="filters.sortBy"
            (change)="applyFilters()"
            class="filter-select">
            <option value="popular">Más popular</option>
            <option value="newest">Más reciente</option>
            <option value="rating">Mejor valorado</option>
            <option value="downloads">Más descargado</option>
          </select>

          <button 
            type="button" 
            class="filter-toggle"
            (click)="showAdvancedFilters.set(!showAdvancedFilters())">
            ⚙️ {{ showAdvancedFilters() ? 'Menos filtros' : 'Más filtros' }}
          </button>
        </div>

        <!-- Advanced Filters -->
        <div class="advanced-filters" [class.expanded]="showAdvancedFilters()">
          <div class="filter-group">
            <label>Rating mínimo:</label>
            <select 
              [(ngModel)]="filters.minRating"
              (change)="applyFilters()"
              class="rating-select">
              <option value="">Cualquier rating</option>
              <option value="4">4+ estrellas</option>
              <option value="4.5">4.5+ estrellas</option>
              <option value="4.8">4.8+ estrellas</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Tags populares:</label>
            <div class="tag-filters">
              <button 
                *ngFor="let tag of marketplaceService.popularTags"
                type="button"
                class="tag-filter"
                [class.active]="isTagSelected(tag)"
                (click)="toggleTag(tag)">
                {{ tag }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Featured Themes -->
      <div class="featured-section" *ngIf="featuredThemes().length > 0">
        <h4>⭐ Temas Destacados</h4>
        <div class="featured-grid">
          <div 
            *ngFor="let theme of featuredThemes()"
            class="featured-theme-card"
            (click)="selectTheme(theme)">
            <div class="theme-screenshot">
              <img 
                [src]="theme.screenshots[0] || '/assets/theme-placeholder.jpg'"
                [alt]="theme.name"
                class="screenshot-img">
              <div class="theme-overlay">
                <button class="btn-preview">👁️ Vista Previa</button>
              </div>
            </div>
            <div class="theme-info">
              <h5>{{ theme.name }}</h5>
              <p class="theme-author">por {{ theme.authorName }}</p>
              <div class="theme-stats">
                <span class="rating">
                  ⭐ {{ theme.rating | number:'1.1-1' }}
                </span>
                <span class="downloads">
                  ⬇️ {{ formatNumber(theme.downloads) }}
                </span>
                <span class="price" *ngIf="theme.premium">
                  💰 ${{ theme.price }}
                </span>
                <span class="free-badge" *ngIf="!theme.premium">GRATIS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div class="results-section">
        <div class="results-header">
          <h4>
            {{ searchQuery ? 'Resultados de búsqueda' : 'Todos los temas' }}
            <span class="results-count">({{ filteredThemes().length }})</span>
          </h4>
          
          <div class="view-toggle">
            <button 
              type="button"
              class="view-btn"
              [class.active]="viewMode() === 'grid'"
              (click)="viewMode.set('grid')">
              ⊞ Grid
            </button>
            <button 
              type="button"
              class="view-btn"
              [class.active]="viewMode() === 'list'"
              (click)="viewMode.set('list')">
              ☰ Lista
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading()" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Cargando temas...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading() && filteredThemes().length === 0" class="empty-state">
          <div class="empty-icon">🎨</div>
          <h5>No se encontraron temas</h5>
          <p>Intenta ajustar los filtros o buscar otros términos.</p>
        </div>

        <!-- Themes Grid -->
        <div 
          *ngIf="!isLoading() && filteredThemes().length > 0"
          class="themes-grid"
          [class.list-view]="viewMode() === 'list'">
          
          <div 
            *ngFor="let theme of filteredThemes()"
            class="theme-card"
            [class.premium]="theme.premium"
            (click)="selectTheme(theme)">
            
            <div class="theme-screenshot">
              <img 
                [src]="theme.screenshots[0] || '/assets/theme-placeholder.jpg'"
                [alt]="theme.name"
                class="screenshot-img">
              <div class="theme-overlay">
                <div class="overlay-buttons">
                  <button class="btn-overlay btn-preview">👁️</button>
                  <button class="btn-overlay btn-download">⬇️</button>
                </div>
              </div>
              <div class="theme-badges">
                <span class="badge featured" *ngIf="theme.featured">⭐ Destacado</span>
                <span class="badge premium" *ngIf="theme.premium">💎 Premium</span>
                <span class="badge free" *ngIf="!theme.premium">🆓 Gratis</span>
              </div>
            </div>

            <div class="theme-details">
              <div class="theme-header">
                <h5 class="theme-title">{{ theme.name }}</h5>
                <div class="theme-price">
                  <span *ngIf="theme.premium">${{ theme.price }}</span>
                  <span *ngIf="!theme.premium" class="free-text">GRATIS</span>
                </div>
              </div>

              <p class="theme-description">{{ theme.description }}</p>
              
              <div class="theme-author">
                <img 
                  [src]="theme.authorAvatar || '/assets/default-avatar.jpg'"
                  [alt]="theme.authorName"
                  class="author-avatar"
                  *ngIf="theme.authorAvatar">
                <span class="author-name">{{ theme.authorName }}</span>
              </div>

              <div class="theme-tags">
                <span 
                  *ngFor="let tag of theme.tags.slice(0, 3)"
                  class="theme-tag">
                  {{ tag }}
                </span>
                <span *ngIf="theme.tags.length > 3" class="more-tags">
                  +{{ theme.tags.length - 3 }}
                </span>
              </div>

              <div class="theme-stats">
                <div class="stat-item">
                  <span class="stat-icon">⭐</span>
                  <span class="stat-value">{{ theme.rating | number:'1.1-1' }}</span>
                  <span class="stat-label">({{ theme.ratingCount }})</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">⬇️</span>
                  <span class="stat-value">{{ formatNumber(theme.downloads) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">📅</span>
                  <span class="stat-value">{{ formatDate(theme.updatedAt) }}</span>
                </div>
              </div>

              <div class="theme-actions">
                <button 
                  class="btn-install"
                  [class.premium]="theme.premium"
                  (click)="installTheme(theme, $event)">
                  {{ theme.premium ? '💰 Comprar' : '⬇️ Instalar' }}
                </button>
                <button 
                  class="btn-preview"
                  (click)="previewTheme(theme, $event)">
                  👁️ Vista Previa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Theme Details Modal -->
      <div class="theme-modal" [class.visible]="selectedTheme()" *ngIf="selectedTheme()">
        <div class="modal-backdrop" (click)="closeModal()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ selectedTheme()!.name }}</h3>
            <button class="btn-close" (click)="closeModal()">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="theme-screenshots">
              <img 
                [src]="selectedTheme()!.screenshots[0] || '/assets/theme-placeholder.jpg'"
                [alt]="selectedTheme()!.name"
                class="main-screenshot">
            </div>
            
            <div class="theme-details-full">
              <p class="theme-description">{{ selectedTheme()!.description }}</p>
              
              <div class="theme-meta">
                <div class="meta-item">
                  <strong>Autor:</strong> {{ selectedTheme()!.authorName }}
                </div>
                <div class="meta-item">
                  <strong>Versión:</strong> {{ selectedTheme()!.version }}
                </div>
                <div class="meta-item">
                  <strong>Licencia:</strong> {{ selectedTheme()!.license }}
                </div>
                <div class="meta-item">
                  <strong>Compatibilidad:</strong> {{ selectedTheme()!.compatibility.join(', ') }}
                </div>
              </div>

              <div class="theme-tags-full">
                <span 
                  *ngFor="let tag of selectedTheme()!.tags"
                  class="theme-tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button 
              class="btn-install-modal"
              [class.premium]="selectedTheme()!.premium"
              (click)="installTheme(selectedTheme()!)">
              {{ selectedTheme()!.premium ? '💰 Comprar por $' + selectedTheme()!.price : '⬇️ Instalar Gratis' }}
            </button>
            <button class="btn-demo" *ngIf="selectedTheme()!.demoUrl">
              🔗 Ver Demo
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .theme-marketplace {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .marketplace-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f1f5f9;
    }

    .marketplace-header h3 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
      font-size: 1.5rem;
    }

    .marketplace-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .search-section {
      margin-bottom: 2rem;
    }

    .search-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .search-input {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .search-btn {
      padding: 0.75rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .filter-toggle {
      padding: 0.5rem 1rem;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .advanced-filters {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
      background: #f8fafc;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .advanced-filters.expanded {
      max-height: 200px;
      padding: 1rem;
    }

    .filter-group {
      margin-bottom: 1rem;
    }

    .filter-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .tag-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .tag-filter {
      padding: 0.25rem 0.75rem;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tag-filter:hover {
      border-color: #3b82f6;
    }

    .tag-filter.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .featured-section {
      margin-bottom: 2rem;
    }

    .featured-section h4 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1.125rem;
    }

    .featured-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .featured-theme-card {
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    .featured-theme-card:hover {
      transform: translateY(-4px);
    }

    .results-section {
      margin-bottom: 2rem;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .results-header h4 {
      margin: 0;
      color: #374151;
      font-size: 1.125rem;
    }

    .results-count {
      color: #6b7280;
      font-weight: normal;
      font-size: 0.875rem;
    }

    .view-toggle {
      display: flex;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
    }

    .view-btn {
      padding: 0.5rem 0.75rem;
      background: white;
      border: none;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .view-btn:hover {
      background: #f3f4f6;
    }

    .view-btn.active {
      background: #3b82f6;
      color: white;
    }

    .themes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .themes-grid.list-view {
      grid-template-columns: 1fr;
    }

    .theme-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .theme-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .theme-screenshot {
      position: relative;
      aspect-ratio: 16/10;
      overflow: hidden;
    }

    .screenshot-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .theme-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .theme-card:hover .theme-overlay {
      opacity: 1;
    }

    .theme-badges {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      display: flex;
      gap: 0.25rem;
      flex-direction: column;
      align-items: flex-start;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.featured {
      background: #f59e0b;
      color: white;
    }

    .badge.premium {
      background: #7c3aed;
      color: white;
    }

    .badge.free {
      background: #10b981;
      color: white;
    }

    .theme-details {
      padding: 1rem;
    }

    .theme-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .theme-title {
      margin: 0;
      color: #374151;
      font-size: 1rem;
      font-weight: 600;
    }

    .theme-price {
      font-weight: 600;
      color: #059669;
    }

    .theme-description {
      margin: 0 0 0.75rem 0;
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .theme-author {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .author-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }

    .author-name {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .theme-tags {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .theme-tag {
      padding: 0.125rem 0.5rem;
      background: #f1f5f9;
      color: #475569;
      border-radius: 12px;
      font-size: 0.625rem;
    }

    .more-tags {
      padding: 0.125rem 0.5rem;
      background: #e2e8f0;
      color: #64748b;
      border-radius: 12px;
      font-size: 0.625rem;
    }

    .theme-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .theme-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-install,
    .btn-preview {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-install {
      background: #22c55e;
      color: white;
      border-color: #22c55e;
    }

    .btn-install.premium {
      background: #7c3aed;
      border-color: #7c3aed;
    }

    .btn-preview {
      background: white;
      color: #374151;
    }

    .btn-install:hover {
      transform: translateY(-1px);
    }

    .loading-state,
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    /* Modal Styles */
    .theme-modal {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .theme-modal.visible {
      opacity: 1;
      visibility: visible;
    }

    .modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
      position: relative;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      margin: 2rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      color: #374151;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
    }

    .modal-body {
      padding: 1.5rem;
      max-height: 50vh;
      overflow-y: auto;
    }

    .main-screenshot {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 1rem;
    }

    .btn-install-modal {
      flex: 1;
      padding: 0.75rem 1.5rem;
      background: #22c55e;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-install-modal.premium {
      background: #7c3aed;
    }

    .btn-demo {
      padding: 0.75rem 1.5rem;
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .theme-marketplace {
        padding: 1rem;
      }

      .themes-grid {
        grid-template-columns: 1fr;
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .modal-content {
        margin: 1rem;
        max-height: 90vh;
      }
    }
  `]
})
export class ThemeMarketplaceComponent implements OnInit {
  
  @Output() themeInstalled = new EventEmitter<ActiveTheme>();

  // Search and filters
  searchQuery = '';
  filters: MarketplaceFilters = {
    sortBy: 'popular',
    sortOrder: 'desc'
  };

  // UI state
  showAdvancedFilters = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  selectedTheme = signal<MarketplaceTheme | null>(null);

  // Data
  allThemes = signal<MarketplaceTheme[]>([]);
  filteredThemes = signal<MarketplaceTheme[]>([]);
  featuredThemes = computed(() => this.marketplaceService.getFeaturedThemes());

  // Loading state
  isLoading = signal(false);

  constructor(public marketplaceService: ThemeMarketplaceService) {}

  ngOnInit() {
    this.loadThemes();
  }

  async loadThemes() {
    this.isLoading.set(true);
    
    try {
      const themes = await this.marketplaceService.getMarketplaceThemes();
      this.allThemes.set(themes);
      this.filteredThemes.set(themes);
    } catch (error) {
      console.error('Error loading themes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredThemes.set(this.allThemes());
      return;
    }

    this.isLoading.set(true);
    
    try {
      const themes = await this.marketplaceService.searchThemes(this.searchQuery, this.filters);
      this.filteredThemes.set(themes);
    } catch (error) {
      console.error('Error searching themes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async applyFilters() {
    this.isLoading.set(true);
    
    try {
      let themes: MarketplaceTheme[];
      
      if (this.searchQuery.trim()) {
        themes = await this.marketplaceService.searchThemes(this.searchQuery, this.filters);
      } else {
        themes = await this.marketplaceService.getMarketplaceThemes(this.filters);
      }
      
      this.filteredThemes.set(themes);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  isTagSelected(tag: string): boolean {
    return this.filters.tags?.includes(tag) || false;
  }

  toggleTag(tag: string) {
    if (!this.filters.tags) {
      this.filters.tags = [];
    }

    const index = this.filters.tags.indexOf(tag);
    if (index > -1) {
      this.filters.tags.splice(index, 1);
    } else {
      this.filters.tags.push(tag);
    }

    this.applyFilters();
  }

  selectTheme(theme: MarketplaceTheme) {
    this.selectedTheme.set(theme);
  }

  closeModal() {
    this.selectedTheme.set(null);
  }

  async installTheme(theme: MarketplaceTheme, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (theme.premium) {
      // En una app real, aquí iría el proceso de pago
      if (!confirm(`¿Quieres comprar "${theme.name}" por $${theme.price}?`)) {
        return;
      }
    }

    try {
      const installedTheme = await this.marketplaceService.downloadTheme(theme.marketplaceId);
      this.themeInstalled.emit(installedTheme);
      this.showSuccessMessage(`¡Tema "${theme.name}" instalado exitosamente!`);
      this.closeModal();
    } catch (error) {
      console.error('Error installing theme:', error);
      this.showErrorMessage('Error al instalar el tema. Por favor intenta de nuevo.');
    }
  }

  previewTheme(theme: MarketplaceTheme, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (theme.demoUrl) {
      window.open(theme.demoUrl, '_blank');
    } else {
      this.selectTheme(theme);
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays}d`;
    } else if (diffDays < 30) {
      return `${Math.ceil(diffDays / 7)}sem`;
    } else if (diffDays < 365) {
      return `${Math.ceil(diffDays / 30)}m`;
    } else {
      return `${Math.ceil(diffDays / 365)}a`;
    }
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

  private showErrorMessage(message: string) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
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