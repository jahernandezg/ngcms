import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges, inject } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appLoading]'
})
export class LoadingDirective implements OnChanges {
  @Input('appLoading') loading = false;

  private spinnerEl?: HTMLElement;

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private r = inject(Renderer2);

  ngOnChanges(changes: SimpleChanges): void {
    if ('loading' in changes) {
      this.update();
    }
  }

  private update() {
    const el = this.host.nativeElement;

    // Disable/enable
    if ('disabled' in el) {
      (el as HTMLButtonElement).disabled = this.loading;
    }

    // Create/remove spinner
    if (this.loading) {
      if (!this.spinnerEl) {
        const span = this.r.createElement('span');
        this.r.addClass(span, 'inline-spinner');
        this.r.addClass(span, 'mr-2');
        this.r.setAttribute(span, 'aria-hidden', 'true');
        this.r.insertBefore(el, span, el.firstChild);
        this.spinnerEl = span;
      }
    } else if (this.spinnerEl) {
      this.r.removeChild(el, this.spinnerEl);
      this.spinnerEl = undefined;
    }
  }
}
