import { Injectable, inject } from '@angular/core';
import { ComponentConfig, RegistryDefinition } from '../interfaces/component-config.interface';
import { HttpClient } from '@angular/common/http';
import { LatestPostsComponent } from '../components/dynamic-components/latest-posts/latest-posts.component';
import { RelatedPostsComponent } from '../components/dynamic-components/related-posts/related-posts.component';
import { CategoryWidgetComponent } from '../components/dynamic-components/category-widget/category-widget.component';
import { TagCloudComponent } from '../components/dynamic-components/tag-cloud/tag-cloud.component';

@Injectable({ providedIn: 'root' })
export class ComponentRegistryService {
  private http = inject(HttpClient);
  private localRegistry: RegistryDefinition = {};
  private loaded = false;

  // Permite registrar componentes en el cliente (MVP)
  register(name: string, config: ComponentConfig) {
    this.localRegistry[name] = config;
  }

  getConfig(name: string): ComponentConfig | undefined {
    return this.localRegistry[name];
  }

  list(): Array<{ name: string; config: ComponentConfig }> {
    return Object.entries(this.localRegistry).map(([name, config]) => ({ name, config }));
  }

  // Opcional: cargar metadatos desde backend si existe el endpoint
  async ensureLoadedFromApi(): Promise<void> {
    if (this.loaded) return;
    try {
      const res = await this.http.get<{ name: string; config: ComponentConfig }[] | Record<string, ComponentConfig>>('/api/dynamic-components/registry').toPromise();
      if (Array.isArray(res)) {
        res.forEach(e => this.register(e.name, e.config));
      } else if (res && typeof res === 'object') {
        Object.entries(res).forEach(([name, cfg]) => this.register(name, cfg));
      }
    } catch { /* endpoint opcional en MVP */ }
    this.loaded = true;
  }

  constructor() {
    // Registro inicial del MVP en cliente
    this.register('latest-posts', {
      component: LatestPostsComponent,
      name: 'Últimos Posts',
      description: 'Muestra los posts más recientes',
      category: 'content',
      icon: 'list',
      inputs: [
        { name: 'count', type: 'number', required: false, defaultValue: 5, description: 'Número de posts' },
        { name: 'category', type: 'string', required: false, description: 'Slug de categoría para filtrar' },
        { name: 'noCache', type: 'boolean', required: false, defaultValue: false, description: 'Forzar omitir caché (x-skip-cache: 1)' }
      ]
    });

    this.register('related-posts', {
      component: RelatedPostsComponent,
      name: 'Artículos Relacionados',
      description: 'Lista posts relacionados al post actual (por slug)',
      category: 'content',
      icon: 'link',
      inputs: [
        { name: 'currentSlug', type: 'string', required: true, description: 'Slug del post actual (o "auto" si implementamos contexto)' },
        { name: 'count', type: 'number', required: false, defaultValue: 4, description: 'Cantidad máxima' }
      ]
    });

    this.register('category-widget', {
      component: CategoryWidgetComponent,
      name: 'Widget de Categorías',
      description: 'Lista de categorías con contador de posts',
      category: 'widget',
      icon: 'list',
      inputs: [
        { name: 'limit', type: 'number', required: false, description: 'Limitar cantidad de categorías' }
      ]
    });

    this.register('tag-cloud', {
      component: TagCloudComponent,
      name: 'Nube de Tags',
      description: 'Nube de tags con tamaño proporcional a frecuencia',
      category: 'widget',
      icon: 'hash',
      inputs: [
        { name: 'minSize', type: 'number', required: false, defaultValue: 12, description: 'Tamaño mínimo en px' },
        { name: 'maxSize', type: 'number', required: false, defaultValue: 24, description: 'Tamaño máximo en px' },
        { name: 'limit', type: 'number', required: false, description: 'Cantidad máxima de tags' }
      ]
    });
  }
}
