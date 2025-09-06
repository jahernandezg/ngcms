import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { apiBaseInterceptor } from './shared/api-base.interceptor';
import { authInterceptor } from './admin/interceptors/auth.interceptor';
import { loadingInterceptor } from './admin/interceptors/loading.interceptor';
import { errorInterceptor } from './admin/interceptors/error.interceptor';
import { SiteSettingsService } from './shared/site-settings.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        apiBaseInterceptor,
        loadingInterceptor,
        authInterceptor,
        errorInterceptor
      ])
    ),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const s = inject(SiteSettingsService);
        return () => { s.load(); };
      }
    },
  ],
};
