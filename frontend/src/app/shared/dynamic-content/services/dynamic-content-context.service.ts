import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DynamicContentContextService {
  // Contexto del contenido actual (por ejemplo, el slug del post/página)
  readonly currentPostSlug = signal<string | null>(null);
  setPostSlug(slug: string | null) { this.currentPostSlug.set(slug); }
}
