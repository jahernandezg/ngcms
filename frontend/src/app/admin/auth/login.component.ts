import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminAuthService } from '../services/admin-auth.service';
import { ToastService } from '../components/toast-container.component';

@Component({
    standalone: true,
    selector: 'app-admin-login',
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
        <form class="w-full max-w-sm bg-white dark:bg-gray-800 shadow p-6 rounded space-y-4 transition-colors" [formGroup]="form" (ngSubmit)="submit()">
      <h1 class="text-xl font-semibold text-center">Admin Login</h1>
      <div>
  <label for="email" class="block text-sm font-medium mb-1">Email</label>
    <input id="email" type="email" formControlName="email" class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm rounded px-3 py-2 transition-colors" />
      </div>
      <div>
  <label for="password" class="block text-sm font-medium mb-1">Password</label>
    <input id="password" type="password" formControlName="password" class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm rounded px-3 py-2 transition-colors" />
      </div>
    <button [disabled]="form.invalid || loading()" class="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600 text-white rounded disabled:opacity-50 transition-colors">{{ loading() ? 'Entrando...' : 'Entrar' }}</button>
      <p *ngIf="error()" class="text-sm text-red-600">{{ error() }}</p>
    </form>
  </div>
  `
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private auth = inject(AdminAuthService);
    private toasts = inject(ToastService);
    loading = signal(false);
    error = signal<string | null>(null);

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
}
