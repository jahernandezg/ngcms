import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ThemeListComponent } from './theme-list.component';

describe('ThemeListComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ThemeListComponent]
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('carga temas iniciales', () => {
    const fixture = TestBed.createComponent(ThemeListComponent);
    fixture.detectChanges();
    const req = http.expectOne('/api/admin/themes');
    req.flush([]);
    fixture.detectChanges();
    expect(fixture.componentInstance.themes().length).toBe(0);
  });

  it('crea un nuevo tema y recarga lista', () => {
    const fixture = TestBed.createComponent(ThemeListComponent);
    fixture.detectChanges();
    // carga inicial vacía
    http.expectOne('/api/admin/themes').flush([]);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.newTheme.name = 'nuevo';
    comp.createNew();
    const createReq = http.expectOne('/api/admin/themes');
    expect(createReq.request.method).toBe('POST');
  createReq.flush({ success: true, data: { id: 't1', name: 'nuevo', isActive: false } });
  // tras crear se dispara reload -> nuevo GET (en implementación responde envelope)
  const reloadReq = http.expectOne('/api/admin/themes');
  reloadReq.flush({ success: true, data: [{ id: 't1', name: 'nuevo', isActive: false }] });
  fixture.detectChanges();
  expect(comp.themes().map(t=>t.id)).toContain('t1');
  });
});
