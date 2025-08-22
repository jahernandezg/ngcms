import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SiteSettingsComponent } from './site-settings.component';
import { provideRouter } from '@angular/router';

describe('SiteSettingsComponent', () => {
  let httpMock: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SiteSettingsComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });
  it('loads existing settings and saves', () => {
    const fixture = TestBed.createComponent(SiteSettingsComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/site-settings/public');
    req.flush({ siteName: 'CMS Demo', tagline: 'Tag', defaultMetaDesc: 'Desc', logoUrl: null, faviconUrl: null });
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.form.value.siteName).toBe('CMS Demo');
    // simulate save
    comp.form.patchValue({ siteName: 'Nuevo Nombre' });
    comp.save();
    const put = httpMock.expectOne('/api/admin/site-settings');
    expect(put.request.method).toBe('PUT');
    put.flush({ siteName: 'Nuevo Nombre' });
    fixture.detectChanges();
    expect(comp.form.value.siteName).toBe('Nuevo Nombre');
    httpMock.verify();
  });
});
