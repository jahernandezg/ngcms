import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface SiteSettings { siteName: string; tagline?: string | null; defaultMetaDesc?: string | null; logoUrl?: string | null; faviconUrl?: string | null; }

@Component({
  standalone: true,
  selector: 'app-admin-site-settings',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <div class="max-w-2xl mx-auto p-4 space-y-6">
    <h1 class="text-2xl font-semibold">Site Settings</h1>
    <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
      <div>
  <label for="siteName" class="block text-sm font-medium mb-1">Site Name</label>
  <input id="siteName" type="text" formControlName="siteName" class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
  <label for="tagline" class="block text-sm font-medium mb-1">Tagline</label>
  <input id="tagline" type="text" formControlName="tagline" class="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
  <label for="defaultMetaDesc" class="block text-sm font-medium mb-1">Default Meta Description</label>
  <textarea id="defaultMetaDesc" rows="3" formControlName="defaultMetaDesc" class="w-full border rounded px-3 py-2 text-sm"></textarea>
      </div>
      <div class="flex gap-3">
        <div class="flex-1">
          <label for="logoUrl" class="block text-sm font-medium mb-1">Logo URL</label>
          <input id="logoUrl" type="text" formControlName="logoUrl" class="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div class="flex-1">
          <label for="faviconUrl" class="block text-sm font-medium mb-1">Favicon URL</label>
          <input id="faviconUrl" type="text" formControlName="faviconUrl" class="w-full border rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button type="submit" [disabled]="form.invalid || saving()" class="px-4 py-2 bg-blue-600 text-white rounded text-sm" >Guardar</button>
        <span *ngIf="saved()" class="text-green-600 text-sm">Guardado</span>
        <span *ngIf="error()" class="text-red-600 text-sm">{{error()}}</span>
      </div>
    </form>
  </div>
  `
})
export class SiteSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);
  form = this.fb.group({
    siteName: ['', [Validators.required, Validators.minLength(2)]],
    tagline: [''],
    defaultMetaDesc: ['',[Validators.maxLength(300)]],
    logoUrl: [''],
    faviconUrl: [''],
  });
  ngOnInit() { this.load(); }

  load() {
    this.http.get<SiteSettings>('/api/site-settings/public').subscribe(r => {
      this.form.patchValue(r);
    });
  }
  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.saved.set(false); this.error.set(null);
    this.http.put<SiteSettings>('/api/admin/site-settings', this.form.getRawValue()).subscribe({
      next: r => { this.form.patchValue(r); this.saving.set(false); this.saved.set(true); },
      error: () => { this.error.set('Error guardando'); this.saving.set(false); }
    });
  }
}
