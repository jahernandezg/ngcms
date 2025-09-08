import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertComponent } from '../components/alert.component';
import { buildAssetUrl } from '../../shared/asset-url.util';

interface BlogConfig {
  blogName: string;
  description?: string | null;
  siteUrl?: string | null;
  logoLight?: string | null; logoDark?: string | null; favicon?: string | null; defaultPostImage?: string | null; ogImage?: string | null;
  metaDescription?: string | null; keywords?: string | null; analyticsId?: string | null; searchConsoleCode?: string | null;
  contactEmail?: string | null; socialTwitter?: string | null; socialLinkedIn?: string | null; socialGithub?: string | null; socialInstagram?: string | null;
  locale: string; timezone: string; postsPerPage: number; enableComments: boolean;
}
type Envelope<T> = { success: boolean; message?: string; data: T };
function isEnvelope<T>(r: unknown): r is Envelope<T> {
  return typeof r === 'object' && r !== null && 'data' in (r as Record<string, unknown>);
}
function unwrap<T>(r: Envelope<T> | T): T { return isEnvelope<T>(r) ? r.data : r; }

@Component({
  standalone: true,
  selector: 'app-admin-branding',
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  template: `
  <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 mt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6">
    <div class="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Identidad y Branding</h3>
      <div class="flex items-center gap-3">
        <button type="submit" form="brandingForm" [disabled]="form.invalid || saving()"
          class="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-50 hover:text-brand-800 dark:border-brand-700 dark:bg-brand-800 dark:text-brand-400 dark:hover:bg-white/[0.03] dark:hover:text-brand-200">
          Guardar
        </button>
      </div>
    </div>

    @if (saved()) { <app-admin-alert [variant]="'success'" title="Éxito" [message]="'Configuración guardada'" (closed)="saved.set(false)" /> }
    @if (error()) { <app-admin-alert [variant]="'error'" title="Error" [message]="error()!" (closed)="error.set(null)" /> }

    <form id="brandingForm" [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
      <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">Identidad del sitio</h4>
      <div>
        <label for="blogName" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Nombre del blog</label>
        <input id="blogName" type="text" formControlName="blogName" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
      </div>

      <div>
        <label for="description" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Descripción</label>
        <textarea id="description" rows="3" formControlName="description" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"></textarea>
      </div>

      <div>
        <label for="siteUrl" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">URL del sitio</label>
        <input id="siteUrl" type="text" formControlName="siteUrl" placeholder="https://tusitio.com o http://localhost:4200" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
        <p class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">Debe incluir protocolo (http/https). Se permite localhost en desarrollo.</p>
      </div>

  <hr class="my-2 border-gray-200 dark:border-gray-800" />
  <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">Identidad visual (Logos)</h4>
  <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label for="logoLight" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Logo Light</label>
          <div class="flex items-start gap-4">
            <div class="w-40 h-16 border rounded-md bg-white flex items-center justify-center overflow-hidden dark:border-gray-700">
              <img [src]="buildPreview(form.value.logoLight) || '/placeholders/logo-light.svg'" alt="logo light" class="max-h-16 object-contain"/>
            </div>
            <div class="flex-1 space-y-2">
              <input id="logoLight" type="text" formControlName="logoLight" placeholder="https://.../logo-light.svg" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"/>
              <div class="flex items-center gap-2">
                <label class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 shadow-theme-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer">
                  <input type="file" class="hidden" (change)="upload($event, 'logo-light')" accept="image/png,image/jpeg,image/svg+xml" />
                  Seleccionar archivo
                </label>
                <button type="button" class="text-sm text-gray-600 underline disabled:opacity-50" (click)="form.get('logoLight')?.setValue('')" [disabled]="!form.value.logoLight">Quitar</button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label for="logoDark" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Logo Dark</label>
          <div class="flex items-start gap-4">
            <div class="w-40 h-16 border rounded-md bg-gray-900 flex items-center justify-center overflow-hidden dark:border-gray-700">
              <img [src]="buildPreview(form.value.logoDark) || '/placeholders/logo-dark.svg'" alt="logo dark" class="max-h-16 object-contain"/>
            </div>
            <div class="flex-1 space-y-2">
              <input id="logoDark" type="text" formControlName="logoDark" placeholder="https://.../logo-dark.svg" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"/>
              <div class="flex items-center gap-2">
                <label class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 shadow-theme-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer">
                  <input type="file" class="hidden" (change)="upload($event, 'logo-dark')" accept="image/png,image/jpeg,image/svg+xml" />
                  Seleccionar archivo
                </label>
                <button type="button" class="text-sm text-gray-600 underline disabled:opacity-50" (click)="form.get('logoDark')?.setValue('')" [disabled]="!form.value.logoDark">Quitar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

  <hr class="my-2 border-gray-200 dark:border-gray-800" />
  <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">Iconos e Imagen social</h4>
  <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label for="favicon" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Favicon</label>
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 border rounded-md bg-white flex items-center justify-center overflow-hidden dark:border-gray-700">
              <img [src]="buildPreview(form.value.favicon) || '/placeholders/favicon.svg'" alt="favicon" class="max-h-12 object-contain"/>
            </div>
            <div class="flex-1 space-y-2">
              <input id="favicon" type="text" formControlName="favicon" placeholder="https://.../favicon.ico" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"/>
              <div class="flex items-center gap-2">
                <label class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 shadow-theme-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer">
                  <input type="file" class="hidden" (change)="upload($event, 'favicon')" accept="image/png,image/x-icon,image/vnd.microsoft.icon" />
                  Seleccionar archivo
                </label>
                <button type="button" class="text-sm text-gray-600 underline disabled:opacity-50" (click)="form.get('favicon')?.setValue('')" [disabled]="!form.value.favicon">Quitar</button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label for="ogImage" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Imagen OG</label>
          <div class="flex items-start gap-4">
            <div class="w-full max-w-[320px] h-32 border rounded-md bg-white flex items-center justify-center overflow-hidden dark:border-gray-700">
              <img [src]="buildPreview(form.value.ogImage) || '/placeholders/og-image.svg'" alt="og image" class="max-h-28 object-contain"/>
            </div>
            <div class="flex-1 space-y-2">
              <input id="ogImage" type="text" formControlName="ogImage" placeholder="https://.../og-image.png" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"/>
              <div class="flex items-center gap-2">
                <label class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 shadow-theme-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer">
                  <input type="file" class="hidden" (change)="upload($event, 'og-image')" accept="image/png,image/jpeg,image/webp" />
                  Seleccionar archivo
                </label>
                <button type="button" class="text-sm text-gray-600 underline disabled:opacity-50" (click)="form.get('ogImage')?.setValue('')" [disabled]="!form.value.ogImage">Quitar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-2">Imagen por defecto de post</h4>
        <label for="defaultPostImage" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Imagen por defecto de post</label>
        <div class="flex items-start gap-4">
          <div class="w-full max-w-[320px] h-32 border rounded-md bg-white flex items-center justify-center overflow-hidden dark:border-gray-700">
            <img [src]="buildPreview(form.value.defaultPostImage) || '/placeholders/post-image.svg'" alt="post image" class="max-h-28 object-contain"/>
          </div>
          <div class="flex-1 space-y-2">
            <input id="defaultPostImage" type="text" formControlName="defaultPostImage" placeholder="https://.../default-post.png" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"/>
            <div class="flex items-center gap-2">
              <label class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 shadow-theme-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer">
                <input type="file" class="hidden" (change)="upload($event, 'post-image')" accept="image/png,image/jpeg,image/webp" />
                Seleccionar archivo
              </label>
              <button type="button" class="text-sm text-gray-600 underline disabled:opacity-50" (click)="form.get('defaultPostImage')?.setValue('')" [disabled]="!form.value.defaultPostImage">Quitar</button>
            </div>
          </div>
        </div>
      </div>

  <hr class="my-2 border-gray-200 dark:border-gray-800" />
  <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">Regionalización</h4>
  <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label for="locale" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Idioma</label>
          <select id="locale" formControlName="locale" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            @for (opt of locales; track opt) { <option [value]="opt">{{opt}}</option> }
          </select>
        </div>
        <div>
          <label for="timezone" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Zona horaria</label>
          <select id="timezone" formControlName="timezone" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            @for (tz of timezones(); track tz) { <option [value]="tz">{{tz}}</option> }
          </select>
        </div>
      </div>

  <hr class="my-2 border-gray-200 dark:border-gray-800" />
  <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">Contenido y comentarios</h4>
  <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label for="postsPerPage" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Posts por página</label>
          <input id="postsPerPage" type="number" min="5" max="50" formControlName="postsPerPage" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        </div>
        <div class="flex items-center gap-3 mt-6">
          <input id="enableComments" type="checkbox" formControlName="enableComments" class="h-4 w-4" />
          <label for="enableComments" class="text-sm text-gray-700 dark:text-gray-300">Habilitar comentarios globalmente</label>
        </div>
      </div>

      <hr class="my-4 border-gray-200 dark:border-gray-800" />

      <div>
        <h4 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-3">SEO y tracking</h4>
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <label for="keywords" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Keywords</label>
            <input id="keywords" type="text" formControlName="keywords" placeholder="angular, typescript, nestjs" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
          </div>
          <div>
            <label for="analyticsId" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Google Analytics 4 ID</label>
            <input id="analyticsId" type="text" formControlName="analyticsId" placeholder="G-XXXXXXXX" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
          </div>
          <div class="md:col-span-2">
            <label for="searchConsoleCode" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Search Console verification</label>
            <input id="searchConsoleCode" type="text" formControlName="searchConsoleCode" placeholder="code de verificación (meta)" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
          </div>
        </div>
      </div>

      <hr class="my-4 border-gray-200 dark:border-gray-800" />

      <div>
        <h4 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-3">Contacto y Redes</h4>
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <label for="contactEmail" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Email de contacto</label>
            <input id="contactEmail" type="email" formControlName="contactEmail" placeholder="contacto@tusitio.com" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
          </div>
          <div>
            <label for="socialTwitter" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Twitter/X</label>
            <input id="socialTwitter" type="url" formControlName="socialTwitter" placeholder="https://twitter.com/tuusuario" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
          </div>
          <div>
            <label for="socialLinkedIn" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">LinkedIn</label>
            <input id="socialLinkedIn" type="url" formControlName="socialLinkedIn" placeholder="https://www.linkedin.com/in/tuusuario" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
          </div>
          <div>
            <label for="socialGithub" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">GitHub</label>
            <input id="socialGithub" type="url" formControlName="socialGithub" placeholder="https://github.com/tuusuario" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
          </div>
          <div class="md:col-span-2">
            <label for="socialInstagram" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Instagram</label>
            <input id="socialInstagram" type="url" formControlName="socialInstagram" placeholder="https://instagram.com/tuusuario" class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
          </div>
        </div>
      </div>
    </form>
  </div>
  `
})
export class BrandingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);
  // Listas i18n
  locales: string[] = [
    'es-ES','en-US','en-GB','fr-FR','de-DE','it-IT','pt-PT','pt-BR','nl-NL','pl-PL','ru-RU','tr-TR','ar-SA','he-IL','hi-IN','ja-JP','ko-KR','zh-CN','zh-TW'
  ];
  timezones = signal<string[]>(['Europe/Madrid','UTC','Europe/London','Europe/Paris','America/New_York','America/Los_Angeles','America/Mexico_City','America/Bogota','America/Sao_Paulo','Asia/Tokyo','Asia/Kolkata','Australia/Sydney']);
  form = this.fb.group({
    blogName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: [''],
    siteUrl: [''],
    logoLight: [''], logoDark: [''], favicon: [''], defaultPostImage: [''], ogImage: [''],
  keywords: [''], analyticsId: [''], searchConsoleCode: [''],
  contactEmail: [''], socialTwitter: [''], socialLinkedIn: [''], socialGithub: [''], socialInstagram: [''],
  locale: ['es-ES'], timezone: ['Europe/Madrid'], postsPerPage: [10], enableComments: [true],
  });

  buildPreview(u?: string | null): string | null {
    return buildAssetUrl(u);
  }

  ngOnInit() { this.load(); }

  load() {
    this.http.get<Envelope<BlogConfig> | BlogConfig>('/api/blog-config').subscribe(r => {
      const cfg = unwrap(r);
      this.form.patchValue({
        blogName: cfg.blogName,
        description: cfg.description ?? '',
        siteUrl: cfg.siteUrl ?? '',
        logoLight: cfg.logoLight ?? '',
        logoDark: cfg.logoDark ?? '',
        favicon: cfg.favicon ?? '',
        defaultPostImage: cfg.defaultPostImage ?? '',
        ogImage: cfg.ogImage ?? '',
  keywords: cfg.keywords ?? '',
  analyticsId: cfg.analyticsId ?? '',
  searchConsoleCode: cfg.searchConsoleCode ?? '',
  contactEmail: cfg.contactEmail ?? '',
  socialTwitter: cfg.socialTwitter ?? '',
  socialLinkedIn: cfg.socialLinkedIn ?? '',
  socialGithub: cfg.socialGithub ?? '',
  socialInstagram: cfg.socialInstagram ?? '',
  locale: cfg.locale,
  timezone: cfg.timezone,
  postsPerPage: cfg.postsPerPage,
  enableComments: cfg.enableComments,
      });
    });
  }
  constructor() {
    // Si el entorno soporta Intl.supportedValuesOf('timeZone'), usar lista completa
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const IntlAny = Intl as any;
      if (IntlAny && typeof IntlAny.supportedValuesOf === 'function') {
        const tzs = IntlAny.supportedValuesOf('timeZone') as string[];
        if (Array.isArray(tzs) && tzs.length > 0) this.timezones.set(tzs);
      }
    } catch (_err) {
      // Ignorar: fallback ya definido para timezones
    }
  }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.saved.set(false); this.error.set(null);
    const raw = this.form.getRawValue();
    // Omite campos vacíos ('') para evitar errores de validación (e.g., IsUrl en siteUrl)
    const dto: Record<string, unknown> = {};
    Object.keys(raw).forEach((k) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (raw as any)[k];
      if (val === '') return; // omitir vacíos
      dto[k] = val;
    });
    this.http.put('/api/blog-config', dto).subscribe({
      next: () => { this.saving.set(false); this.saved.set(true); },
      error: (err) => { this.saving.set(false); this.error.set('Error guardando'); console.error('branding save error', err); }
    });
  }
  upload(ev: Event, type: 'logo-light' | 'logo-dark' | 'favicon' | 'og-image' | 'post-image') {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    type UploadRes = { url: string; path?: string };
  this.http.post<Envelope<UploadRes> | UploadRes>(`/api/admin/uploads/${type}`, fd).subscribe({
      next: (resp) => {
        const u = unwrap<UploadRes>(resp);
    const absolute = buildAssetUrl(u.url) ?? u.url;
        const map: Record<string, string> = { 'logo-light': 'logoLight', 'logo-dark': 'logoDark', 'favicon': 'favicon', 'og-image': 'ogImage', 'post-image': 'defaultPostImage' };
        const ctrl = this.form.get(map[type]);
    ctrl?.setValue(absolute);
        ctrl?.markAsDirty({ onlySelf: true });
        ctrl?.updateValueAndValidity({ onlySelf: true });
      },
      error: (err) => {
        console.error('upload failed', err);
        this.error.set('Error subiendo archivo');
      }
    });
  }
}
