import { Injectable, inject } from '@angular/core';
import { ComponentRegistryService } from './component-registry.service';

export interface FoundMarker {
  name: string;
  params: Record<string, unknown> | undefined;
  element: Element;
}

@Injectable({ providedIn: 'root' })
export class DynamicHtmlService {
  private registry = inject(ComponentRegistryService);

  private decodeHtmlEntities(value: string): string {
    // Decodifica entidades HTML comunes usando un elemento temporal.
    // Repite hasta 3 veces por si viene doblemente escapado.
    let current = value;
    for (let i = 0; i < 3; i++) {
      const ta = document.createElement('textarea');
      ta.innerHTML = current;
      const next = ta.value;
      if (next === current) break;
      current = next;
    }
    return current;
  }

  findMarkers(root: Element): FoundMarker[] {
    const nodes = Array.from(root.querySelectorAll('[data-component]')) as Element[];
    const markers: FoundMarker[] = [];
    for (const el of nodes) {
      const name = el.getAttribute('data-component')?.trim();
      if (!name) continue;
      const paramsAttr = el.getAttribute('data-params');
      let params: Record<string, unknown> | undefined;
      if (paramsAttr) {
        const decoded = this.decodeHtmlEntities(paramsAttr);
        try {
          params = JSON.parse(decoded);
        } catch {
          // Fallback: intentar reemplazar &quot; si sobreviven
          const replaced = decoded.replace(/&quot;/g, '"');
          try { params = JSON.parse(replaced); } catch { params = undefined; }
        }
      }
      markers.push({ name, params, element: el });
    }
    return markers;
  }
}
