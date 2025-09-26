import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminAuthService } from '../services/admin-auth.service';
import { ToastService } from '../components/toast-container.component';
import { LoadingDirective } from '../directives/loading.directive';
import { AlertComponent } from '../components/alert.component';
import { SiteSettingsService } from '../../shared/site-settings.service';
import { buildAssetUrl } from '../../shared/asset-url.util';

@Component({
    standalone: true,
    selector: 'app-admin-login',
    imports: [CommonModule, ReactiveFormsModule, LoadingDirective, AlertComponent],
    templateUrl: './login.component.html'
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private auth = inject(AdminAuthService);
    private toasts = inject(ToastService);
    private siteSettings = inject(SiteSettingsService);
    loading = signal(false);
    error = signal<string | null>(null);
    showPassword = false;

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
    });

    submit() {
        if (this.form.invalid) return;
        this.loading.set(true);
        this.error.set(null);
        const { email, password } = this.form.getRawValue();
        if (!email || !password) return;
        this.auth.login(email, password).subscribe({
            next: r => {
                this.loading.set(false);
                if (!r.success) { this.error.set(r.message || 'Error'); const msg = this.error() || 'Error'; this.toasts.error(msg); }
                else this.toasts.success('Sesión iniciada');
            },
            error: () => {
                this.loading.set(false);
                this.error.set('Credenciales inválidas');
                this.toasts.error('Credenciales inválidas');
            }
        });
    }

  togglePassword() { this.showPassword = !this.showPassword; }


    toggleDarkMode(event: Event) {
      event.preventDefault();
      const root = document.documentElement;
      root.classList.toggle('dark');
    }

        // Branding logos dinámicos
        logoLight() {
            const s = this.siteSettings.settings();
            const raw = s?.logoLight || s?.logoUrl || '/placeholders/logo-light.svg';
            return buildAssetUrl(raw) || raw;
        }
        logoDark() {
            const s = this.siteSettings.settings();
            const raw = s?.logoDark || s?.logoUrl || '/placeholders/logo-dark.svg';
            return buildAssetUrl(raw) || raw;
        }

        // Descripción/tagline del sitio para el texto de apoyo
        siteDescription() {
            const s = this.siteSettings.settings();
            return s?.tagline || s?.defaultMetaDesc || '';
        }
}
