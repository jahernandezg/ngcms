import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, Output, EventEmitter, SimpleChanges, Type, ViewChild, ViewContainerRef, EnvironmentInjector, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ComponentRegistryService } from '../../services/component-registry.service';
import { ComponentValidatorService } from '../../services/component-validator.service';
import { DynamicHtmlService } from '../../services/dynamic-html.service';

@Component({
  selector: 'app-dynamic-html-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div #root [innerHTML]="processedSafeHtml"></div>
  `,
})
export class DynamicHtmlRendererComponent implements AfterViewInit, OnChanges, OnDestroy {
  private registry = inject(ComponentRegistryService);
  private validator = inject(ComponentValidatorService);
  private parser = inject(DynamicHtmlService);
  private envInjector = inject(EnvironmentInjector);
  private vcRef = inject(ViewContainerRef);
  private sanitizer = inject(DomSanitizer);
  @ViewChild('root', { static: true }) rootRef!: ElementRef<HTMLDivElement>;

  @Input() htmlContent: string | null | undefined;
  /** Emite metadatos básicos derivados del HTML (para SEO automático) */
  @Output() contentAnalyzed = new EventEmitter<{ title?: string; description?: string; headings?: string[] }>();

  private createdComponents: Array<{ host: Element; destroy: () => void }> = [];
  processedHtml = '';
  processedSafeHtml: SafeHtml = '';
  private markerMap = new Map<string, { name: string; params?: Record<string, unknown> }>();
  private markerOrder: string[] = [];

  private decodeHtmlEntities(value: string): string {
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

  private preprocessHtml() {
    let raw = this.htmlContent ?? '';
    this.markerMap.clear();
    this.markerOrder = [];

    // Paso 0: neutralizar casos que NO deben renderizarse
    // - Corchetes escapados como entidades: &#91;, &#x5B;, &lbrack; seguidos de 'component'
    //   Insertamos un carácter de ancho cero para romper el patrón del shortcode al renderizar
    raw = raw
      .replace(/&#0*91;\s*(?=component\b)/gi, '[\u200B')
      .replace(/&#x0*5[bB];\s*(?=component\b)/gi, '[\u200B')
      .replace(/&lbrack;\s*(?=component\b)/gi, '[\u200B');
    // - Escape manual: [[component ...]] no debe procesarse
    raw = raw.replace(/\[\[\s*(?=component\b)/gi, '[\u200B');

    // 1) Crear un contenedor para poder neutralizar shortcodes dentro de <code>, <pre>, etc.
    const containerMask = document.createElement('div');
    containerMask.innerHTML = raw;
    const neutralizeIn = containerMask.querySelectorAll('code, pre, kbd, samp, script, style');
    neutralizeIn.forEach((el) => {
      // Romper el patrón dentro de estos contenedores sin afectar la visualización
      el.innerHTML = el.innerHTML
        .replace(/\[\s*(?=component\b)/gi, '[\u200B')
        .replace(/&#0*91;\s*(?=component\b)/gi, '[\u200B')
        .replace(/&#x0*5[bB];\s*(?=component\b)/gi, '[\u200B')
        .replace(/&lbrack;\s*(?=component\b)/gi, '[\u200B');
    });
    let maskedRaw = containerMask.innerHTML;

    // 2) Soporte a shortcodes de texto fuera de áreas neutralizadas
    const shortcodeRegex = /\[component\s+([a-z0-9-]+)(?:\s+params=(?:"([\s\S]*?)"|'([\s\S]*?)'))?\s*\]/gi;
    maskedRaw = maskedRaw.replace(shortcodeRegex, (_m, name: string, p1?: string, p2?: string) => {
      const paramsRaw = p1 ?? p2;
      let params: Record<string, unknown> | undefined;
      if (paramsRaw) {
        const decoded = this.decodeHtmlEntities(paramsRaw);
        try { params = JSON.parse(decoded); } catch { try { params = JSON.parse(decoded.replace(/&quot;/g, '"')); } catch { params = undefined; } }
      }
      const id = `dc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.markerMap.set(id, { name, params });
      this.markerOrder.push(id);
      return `<div id="${id}" class="dc-marker"></div>`;
    });

    // 3) Usar un contenedor desconectado con el HTML ya procesado para continuar con data-*
    const container = document.createElement('div');
    container.innerHTML = maskedRaw;
    const nodes = Array.from(container.querySelectorAll('[data-component]')) as Element[];
    nodes.forEach((el, i) => {
      const name = el.getAttribute('data-component')?.trim();
      if (!name) return;
      const paramsAttr = el.getAttribute('data-params') ?? undefined;
      let params: Record<string, unknown> | undefined;
      if (paramsAttr) {
        const decoded = this.decodeHtmlEntities(paramsAttr);
        try { params = JSON.parse(decoded); } catch { try { params = JSON.parse(decoded.replace(/&quot;/g, '"')); } catch { params = undefined; } }
      }
      const id = `dc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`;
      el.setAttribute('id', id);
      el.classList.add('dc-marker');
      this.markerMap.set(id, { name, params });
      this.markerOrder.push(id);
    });
  this.processedHtml = container.innerHTML;
  // Convertir a SafeHtml para permitir formularios/inputs/botones sin que el sanitizer los elimine
  this.processedSafeHtml = this.sanitizer.bypassSecurityTrustHtml(this.processedHtml);
    // Extraer metadatos básicos para SEO: primer h1/h2 y primeras ~160 palabras sin etiquetas
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = this.processedHtml;
      const h1 = tmp.querySelector('h1')?.textContent?.trim();
      const h2 = !h1 ? tmp.querySelector('h2')?.textContent?.trim() : undefined;
      const text = tmp.textContent || '';
      const cleaned = text.replace(/\s+/g, ' ').trim();
      const description = cleaned.split(' ').slice(0, 40).join(' '); // ~ 40 palabras ~160 chars aprox
      const headings = Array.from(tmp.querySelectorAll('h1,h2,h3')).map(h => h.textContent?.trim() || '').filter(Boolean);
      this.contentAnalyzed.emit({ title: h1 || h2, description, headings });
    } catch { /* ignore */ }
  }

  ngAfterViewInit() {
    this.preprocessHtml();
    this.render();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['htmlContent'] && this.rootRef) {
      this.preprocessHtml();
      this.render();
    }
  }
  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup() {
    for (const c of this.createdComponents) {
      try { c.destroy(); } catch (_e) { /* ignore */ }
    }
    this.createdComponents = [];
  }

  private render() {
    const root = this.rootRef?.nativeElement;
    if (!root) return;
    // Esperar a que Angular aplique el [innerHTML] antes de buscar marcadores.
    // Usamos requestAnimationFrame y hasta 3 reintentos.
    let attempts = 0;
    const tryMount = () => {
      try {
        this.cleanup();
        // Preferir el mapa preprocesado con IDs estables
        if (this.markerMap.size > 0) {
          const hosts = Array.from(root.querySelectorAll('.dc-marker')) as Element[];
          if (!hosts.length && attempts < 3) {
            attempts++;
            requestAnimationFrame(tryMount);
            return;
          }
          for (let i = 0; i < hosts.length; i++) {
            const host = hosts[i];
            const id = this.markerOrder[i];
            if (!id) continue;
            const meta = this.markerMap.get(id);
            if (!meta) continue;
            const cfg = this.registry.getConfig(meta.name);
            if (!cfg) continue;
            const validation = this.validator.validateParams(cfg, meta.params);
            if (!validation.ok) {
              host.innerHTML = `<div class="text-red-600 text-sm">${validation.error}</div>`;
              continue;
            }
            host.innerHTML = '';
            try {
              const compType = cfg.component as unknown as Type<Record<string, unknown>>;
              const created = this.vcRef.createComponent(compType, { environmentInjector: this.envInjector });
              const params = validation.value;
              for (const [k, v] of Object.entries(params)) {
                if (typeof created.setInput === 'function') {
                  created.setInput(k, v);
                } else {
                  (created.instance as Record<string, unknown>)[k] = v as unknown;
                }
              }
              (created.instance as { setParams?: (p: Record<string, unknown>) => void }).setParams?.(params);
              host.appendChild(created.location.nativeElement as Node);
              created.changeDetectorRef.detectChanges();
              this.createdComponents.push({ host, destroy: () => created.destroy() });
            } catch {
              host.innerHTML = '<div class="text-red-600 text-sm">Error al instanciar componente</div>';
            }
          }
          return; // Hecho con preprocesados
        }

        // Fallback: buscar marcadores vivos en el DOM (si la sanitización no los eliminó)
        const markers = this.parser.findMarkers(root);
        for (const marker of markers) {
          const cfg = this.registry.getConfig(marker.name);
          const host = marker.element as Element | null;
          if (!cfg || !host) continue;
          const validation = this.validator.validateParams(cfg, marker.params);
          if (!validation.ok) {
            host.innerHTML = `<div class="text-red-600 text-sm">${validation.error}</div>`;
            continue;
          }
          // Vaciar host y crear dentro del mismo
          host.innerHTML = '';
          try {
            const compType = cfg.component as unknown as Type<Record<string, unknown>>;
            const created = this.vcRef.createComponent(compType, { environmentInjector: this.envInjector });
            const params = validation.value;
            // Usar setInput si está disponible (Angular 16+)
            for (const [k, v] of Object.entries(params)) {
              if (typeof created.setInput === 'function') {
                created.setInput(k, v);
              } else {
                (created.instance as Record<string, unknown>)[k] = v as unknown;
              }
            }
            (created.instance as { setParams?: (p: Record<string, unknown>) => void }).setParams?.(params);
            // Mover el host element del componente dentro del placeholder
            host.appendChild(created.location.nativeElement as Node);
            created.changeDetectorRef.detectChanges();
            this.createdComponents.push({ host, destroy: () => created.destroy() });
          } catch {
            host.innerHTML = '<div class="text-red-600 text-sm">Error al instanciar componente</div>';
          }
        }
      } catch { /* noop */ }
    };
    requestAnimationFrame(tryMount);
  }
}
