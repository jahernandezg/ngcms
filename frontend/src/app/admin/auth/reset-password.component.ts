import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoadingDirective } from '../directives/loading.directive';
import { AlertComponent } from '../components/alert.component';

@Component({
  standalone: true,
  selector: 'app-admin-reset-password',
  imports: [CommonModule, ReactiveFormsModule, LoadingDirective, AlertComponent],
  template: `
  <div class="relative p-6 bg-white dark:bg-gray-900 sm:p-0 min-h-screen">
    <div class="relative flex flex-col justify-center w-full min-h-screen dark:bg-gray-900">
      <div class="flex flex-col flex-1 w-full">
        <div class="w-full max-w-md pt-10 mx-auto">
          <a routerLink="/admin/login" class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <svg class="stroke-current mr-2" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Volver al login
          </a>
        </div>
        <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div class="mb-5 sm:mb-8">
              <h1 class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Recuperar contraseña</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">Ingresa tu email y, si existe una cuenta, te enviaremos instrucciones.</p>
            </div>

            @if (message()) {
              <app-admin-alert [variant]="'success'" title="Enviado" [message]="message()!" (closed)="message.set(null)" />
            }
            @if (error()) {
              <app-admin-alert [variant]="'error'" title="Error" [message]="error()!" (closed)="error.set(null)" />
            }

            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
              <div>
                <label for="email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Email<span class="text-error-500">*</span></label>
                <input id="email" type="email" formControlName="email" placeholder="tucorreo@dominio.com"
                  class="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" />
              </div>
              <div>
                <button type="submit" [appLoading]="loading()" [disabled]="form.invalid || loading()" class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50">Enviar instrucciones</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.message.set(null);
    this.error.set(null);
    // Simular envío; integrar API real si está disponible
    setTimeout(() => {
      this.loading.set(false);
      this.message.set('Si el correo existe, recibirás un mensaje con los siguientes pasos.');
    }, 800);
  }
}
