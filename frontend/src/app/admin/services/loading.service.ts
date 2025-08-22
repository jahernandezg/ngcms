import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = signal(0);
  readonly isLoading = computed(() => this.pending() > 0);
  start() { this.pending.update(v => v + 1); }
  stop() { this.pending.update(v => Math.max(0, v - 1)); }
  reset() { this.pending.set(0); }
}
