import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActiveTheme } from './theme.service';
import { ThemeAnimations } from './animation-engine.service';

export interface MarketplaceTheme extends ActiveTheme {
  marketplaceId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  downloads: number;
  rating: number;
  ratingCount: number;
  featured: boolean;
  premium: boolean;
  price?: number;
  tags: string[];
  screenshots: string[];
  demoUrl?: string;
  publishedAt: Date;
  updatedAt: Date;
  version: string;
  compatibility: string[];
  license: 'free' | 'premium' | 'exclusive';
  animations?: ThemeAnimations;
}

export interface ThemeRating {
  id: string;
  themeId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

export interface MarketplaceFilters {
  category?: string;
  license?: 'free' | 'premium' | 'exclusive' | 'all';
  featured?: boolean;
  minRating?: number;
  tags?: string[];
  priceRange?: { min: number; max: number };
  sortBy?: 'popular' | 'newest' | 'rating' | 'downloads' | 'price';
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class ThemeMarketplaceService {

  // Marketplace state
  marketplaceThemes = signal<MarketplaceTheme[]>([]);
  featuredThemes = signal<MarketplaceTheme[]>([]);
  isLoading = signal(false);
  
  // Popular tags
  popularTags = [
    'moderno', 'minimalista', 'corporativo', 'creativo', 'oscuro', 'colorido',
    'responsive', 'profesional', 'e-commerce', 'blog', 'portfolio', 'landing'
  ];

  constructor(private http: HttpClient) {
    this.loadMockThemes();
  }

  /**
   * Get marketplace themes with filters
   */
  getMarketplaceThemes(filters?: MarketplaceFilters): Observable<MarketplaceTheme[]> {
    // En una implementación real, esto haría una petición HTTP al backend
    // return this.http.get<MarketplaceTheme[]>('/api/marketplace/themes', { params: filters });
    
    let themes = this.marketplaceThemes();
    
    if (filters) {
      themes = this.applyFilters(themes, filters);
    }
    
    return new Promise(resolve => {
      setTimeout(() => resolve(themes), 500);
    }) as any;
  }

  /**
   * Get featured themes
   */
  getFeaturedThemes(): MarketplaceTheme[] {
    return this.marketplaceThemes().filter(theme => theme.featured).slice(0, 6);
  }

  /**
   * Get theme by ID
   */
  getThemeById(id: string): Observable<MarketplaceTheme | null> {
    const theme = this.marketplaceThemes().find(t => t.marketplaceId === id);
    return new Promise(resolve => {
      setTimeout(() => resolve(theme || null), 300);
    }) as any;
  }

  /**
   * Search themes
   */
  searchThemes(query: string, filters?: MarketplaceFilters): Observable<MarketplaceTheme[]> {
    let themes = this.marketplaceThemes().filter(theme => 
      theme.name.toLowerCase().includes(query.toLowerCase()) ||
      theme.description?.toLowerCase().includes(query.toLowerCase()) ||
      theme.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
      theme.authorName.toLowerCase().includes(query.toLowerCase())
    );

    if (filters) {
      themes = this.applyFilters(themes, filters);
    }

    return new Promise(resolve => {
      setTimeout(() => resolve(themes), 400);
    }) as any;
  }

  /**
   * Download/Install theme
   */
  downloadTheme(themeId: string): Observable<ActiveTheme> {
    const marketplaceTheme = this.marketplaceThemes().find(t => t.marketplaceId === themeId);
    
    if (!marketplaceTheme) {
      throw new Error('Theme not found');
    }

    // Increment download count
    marketplaceTheme.downloads++;
    
    // Convert to regular theme
    const { marketplaceId, authorId, authorName, downloads, rating, ratingCount, 
            featured, premium, price, tags, screenshots, demoUrl, publishedAt, 
            updatedAt, version, compatibility, license, animations, ...theme } = marketplaceTheme;

    return new Promise(resolve => {
      setTimeout(() => resolve(theme as ActiveTheme), 1000);
    }) as any;
  }

  /**
   * Rate theme
   */
  rateTheme(themeId: string, rating: number, comment?: string): Observable<ThemeRating> {
    const newRating: ThemeRating = {
      id: `rating_${Date.now()}`,
      themeId,
      userId: 'current_user', // En una app real, vendría del servicio de auth
      userName: 'Usuario Actual',
      rating,
      comment,
      createdAt: new Date()
    };

    // Update theme rating
    const theme = this.marketplaceThemes().find(t => t.marketplaceId === themeId);
    if (theme) {
      const totalRating = (theme.rating * theme.ratingCount) + rating;
      theme.ratingCount++;
      theme.rating = totalRating / theme.ratingCount;
    }

    return new Promise(resolve => {
      setTimeout(() => resolve(newRating), 500);
    }) as any;
  }

  /**
   * Get theme ratings
   */
  getThemeRatings(themeId: string): Observable<ThemeRating[]> {
    // Mock ratings
    const mockRatings: ThemeRating[] = [
      {
        id: '1',
        themeId,
        userId: 'user1',
        userName: 'María García',
        rating: 5,
        comment: '¡Excelente tema! Muy fácil de personalizar y se ve profesional.',
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        themeId,
        userId: 'user2',
        userName: 'Carlos Ruiz',
        rating: 4,
        comment: 'Muy bueno, aunque me gustaría más opciones de color.',
        createdAt: new Date('2024-01-10')
      },
      {
        id: '3',
        themeId,
        userId: 'user3',
        userName: 'Ana López',
        rating: 5,
        comment: 'Perfecto para mi sitio web. Altamente recomendado.',
        createdAt: new Date('2024-01-08')
      }
    ];

    return new Promise(resolve => {
      setTimeout(() => resolve(mockRatings), 300);
    }) as any;
  }

  /**
   * Submit theme to marketplace
   */
  submitTheme(theme: ActiveTheme, marketplaceData: Partial<MarketplaceTheme>): Observable<MarketplaceTheme> {
    const marketplaceTheme: MarketplaceTheme = {
      ...theme,
      marketplaceId: `theme_${Date.now()}`,
      authorId: 'current_user',
      authorName: marketplaceData.authorName || 'Usuario Actual',
      downloads: 0,
      rating: 0,
      ratingCount: 0,
      featured: false,
      premium: marketplaceData.premium || false,
      price: marketplaceData.price,
      tags: marketplaceData.tags || [],
      screenshots: marketplaceData.screenshots || [],
      demoUrl: marketplaceData.demoUrl,
      publishedAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      compatibility: ['web', 'mobile'],
      license: marketplaceData.license || 'free',
      animations: marketplaceData.animations
    };

    // Add to marketplace
    const currentThemes = this.marketplaceThemes();
    this.marketplaceThemes.set([...currentThemes, marketplaceTheme]);

    return new Promise(resolve => {
      setTimeout(() => resolve(marketplaceTheme), 1000);
    }) as any;
  }

  /**
   * Get user's submitted themes
   */
  getUserThemes(): Observable<MarketplaceTheme[]> {
    const userThemes = this.marketplaceThemes().filter(theme => theme.authorId === 'current_user');
    
    return new Promise(resolve => {
      setTimeout(() => resolve(userThemes), 400);
    }) as any;
  }

  /**
   * Delete user theme
   */
  deleteTheme(themeId: string): Observable<boolean> {
    const currentThemes = this.marketplaceThemes();
    const filteredThemes = currentThemes.filter(theme => theme.marketplaceId !== themeId);
    this.marketplaceThemes.set(filteredThemes);

    return new Promise(resolve => {
      setTimeout(() => resolve(true), 500);
    }) as any;
  }

  /**
   * Apply filters to themes array
   */
  private applyFilters(themes: MarketplaceTheme[], filters: MarketplaceFilters): MarketplaceTheme[] {
    let filtered = [...themes];

    if (filters.category) {
      filtered = filtered.filter(theme => theme.category === filters.category);
    }

    if (filters.license && filters.license !== 'all') {
      filtered = filtered.filter(theme => theme.license === filters.license);
    }

    if (filters.featured !== undefined) {
      filtered = filtered.filter(theme => theme.featured === filters.featured);
    }

    if (filters.minRating) {
      filtered = filtered.filter(theme => theme.rating >= filters.minRating!);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(theme => 
        filters.tags!.some(tag => theme.tags.includes(tag))
      );
    }

    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      filtered = filtered.filter(theme => {
        const price = theme.price || 0;
        return price >= min && price <= max;
      });
    }

    // Sort results
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (filters.sortBy) {
          case 'popular':
            comparison = b.downloads - a.downloads;
            break;
          case 'newest':
            comparison = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            break;
          case 'rating':
            comparison = b.rating - a.rating;
            break;
          case 'downloads':
            comparison = b.downloads - a.downloads;
            break;
          case 'price':
            comparison = (a.price || 0) - (b.price || 0);
            break;
          default:
            comparison = 0;
        }
        
        return filters.sortOrder === 'asc' ? -comparison : comparison;
      });
    }

    return filtered;
  }

  /**
   * Load mock themes for demonstration
   */
  private loadMockThemes() {
    const mockThemes: MarketplaceTheme[] = [
      {
        id: '1',
        marketplaceId: 'marketplace_1',
        name: 'Professional Business',
        description: 'Tema elegante y profesional perfecto para sitios corporativos',
        category: 'BUSINESS',
        authorId: 'author1',
        authorName: 'Design Studio Pro',
        authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        downloads: 2847,
        rating: 4.8,
        ratingCount: 156,
        featured: true,
        premium: true,
        price: 29.99,
        tags: ['profesional', 'corporativo', 'moderno', 'responsive'],
        screenshots: [
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop'
        ],
        demoUrl: 'https://demo.example.com/professional-business',
        publishedAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        version: '2.1.0',
        compatibility: ['web', 'mobile', 'tablet'],
        license: 'premium',
        // Theme properties
        primaryColor: '#1e40af',
        secondaryColor: '#374151',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        surfaceColor: '#f8fafc',
        surfaceAltColor: '#f1f5f9',
        textColor: '#1f2937',
        textSecondary: '#6b7280',
        borderColor: '#e5e7eb',
        fontHeading: 'Roboto',
        fontBody: 'Open Sans',
        fontSizeBase: '16px',
        fontScaleRatio: 1.2,
        lineHeightBase: 1.6,
        containerWidth: '1400px',
        borderRadius: '4px',
        spacingUnit: '1rem'
      },
      {
        id: '2',
        marketplaceId: 'marketplace_2',
        name: 'Creative Portfolio',
        description: 'Tema vibrante y creativo ideal para portfolios y sitios artísticos',
        category: 'PORTFOLIO',
        authorId: 'author2',
        authorName: 'Creative Minds',
        downloads: 1923,
        rating: 4.6,
        ratingCount: 89,
        featured: true,
        premium: false,
        tags: ['creativo', 'portfolio', 'colorido', 'artístico'],
        screenshots: [
          'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&h=600&fit=crop'
        ],
        publishedAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-12'),
        version: '1.5.2',
        compatibility: ['web', 'mobile'],
        license: 'free',
        // Theme properties
        primaryColor: '#7c3aed',
        secondaryColor: '#6b7280',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        surfaceColor: '#fafafa',
        textColor: '#18181b',
        fontHeading: 'Poppins',
        fontBody: 'Inter',
        containerWidth: '1200px',
        borderRadius: '12px'
      },
      {
        id: '3',
        marketplaceId: 'marketplace_3',
        name: 'Minimal Blog',
        description: 'Tema limpio y minimalista perfecto para blogs y contenido editorial',
        category: 'BLOG',
        authorId: 'author3',
        authorName: 'Minimal Design Co.',
        downloads: 3421,
        rating: 4.9,
        ratingCount: 203,
        featured: true,
        premium: false,
        tags: ['minimalista', 'blog', 'limpio', 'editorial'],
        screenshots: [
          'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&h=600&fit=crop'
        ],
        publishedAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-18'),
        version: '1.8.1',
        compatibility: ['web', 'mobile', 'tablet'],
        license: 'free',
        // Theme properties
        primaryColor: '#374151',
        secondaryColor: '#6b7280',
        accentColor: '#10b981',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        fontHeading: 'Inter',
        fontBody: 'Source Sans Pro',
        containerWidth: '800px'
      },
      {
        id: '4',
        marketplaceId: 'marketplace_4',
        name: 'E-commerce Store',
        description: 'Tema optimizado para tiendas online con excelente UX de compra',
        category: 'ECOMMERCE',
        authorId: 'author4',
        authorName: 'E-commerce Experts',
        downloads: 1567,
        rating: 4.7,
        ratingCount: 124,
        featured: false,
        premium: true,
        price: 49.99,
        tags: ['e-commerce', 'tienda', 'ventas', 'profesional'],
        screenshots: [
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop'
        ],
        publishedAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20'),
        version: '3.2.0',
        compatibility: ['web', 'mobile', 'tablet'],
        license: 'premium',
        // Theme properties
        primaryColor: '#059669',
        secondaryColor: '#4b5563',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        containerWidth: '1400px'
      },
      {
        id: '5',
        marketplaceId: 'marketplace_5',
        name: 'Dark Corporate',
        description: 'Tema oscuro y sofisticado para empresas tecnológicas',
        category: 'BUSINESS',
        authorId: 'author5',
        authorName: 'Dark Design Studio',
        downloads: 892,
        rating: 4.5,
        ratingCount: 67,
        featured: false,
        premium: true,
        price: 19.99,
        tags: ['oscuro', 'corporativo', 'tecnología', 'moderno'],
        screenshots: [
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop'
        ],
        publishedAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-22'),
        version: '1.3.0',
        compatibility: ['web', 'mobile'],
        license: 'premium',
        // Theme properties
        primaryColor: '#3b82f6',
        backgroundColor: '#0f172a',
        surfaceColor: '#1e293b',
        textColor: '#f8fafc',
        fontHeading: 'Inter',
        containerWidth: '1200px'
      }
    ];

    this.marketplaceThemes.set(mockThemes);
  }
}