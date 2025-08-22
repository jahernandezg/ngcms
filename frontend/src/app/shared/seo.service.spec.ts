import { TestBed } from '@angular/core/testing';
import { SeoService } from './seo.service';
import { SiteSettingsService, SiteSettingsPublic } from './site-settings.service';
import { Meta, Title } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

describe('SeoService', () => {
  let seo: SeoService;
  let meta: Meta;
  let title: Title;
  let settingsSvc: SiteSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SeoService, SiteSettingsService, provideHttpClient()]
    });
    seo = TestBed.inject(SeoService);
    meta = TestBed.inject(Meta);
    title = TestBed.inject(Title);
    settingsSvc = TestBed.inject(SiteSettingsService);
  });

  function pushSettings(s: Partial<SiteSettingsPublic>) {    
    settingsSvc['settingsSig'].set({ siteName: 'Demo', ...s });
  }

  it('usa siteName del settings y fallback a tagline para description', () => {
    pushSettings({ siteName: 'Mi Sitio', tagline: 'Tagline base' });
    seo.set({ title: 'Página X' });
    expect(title.getTitle()).toBe('Página X | Mi Sitio');
    const tag = meta.getTag("name='description'");
    expect(tag?.content).toBe('Tagline base');
  });

  it('prefiere defaultMetaDesc sobre tagline', () => {
    pushSettings({ siteName: 'Mi Sitio', tagline: 'Tagline base', defaultMetaDesc: 'Descripción por defecto' });
    seo.set({ title: 'Inicio' });
    const desc = meta.getTag("name='description'")?.content;
    expect(desc).toBe('Descripción por defecto');
  });

  it('usa description explícita si se pasa', () => {
    pushSettings({ siteName: 'Mi Sitio', defaultMetaDesc: 'Desc def' });
    seo.set({ title: 'Detalle', description: 'Custom desc' });
    const desc = meta.getTag("name='description'")?.content;
    expect(desc).toBe('Custom desc');
  });
});
