import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { CLASE_OSCURO, TemaVotacion } from './tema';
import { LICENCIA_PRIMENG } from './licencia-primeng';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding()),
    providePrimeNG({
      ripple: true,
      ...(LICENCIA_PRIMENG ? { license: LICENCIA_PRIMENG } : {}),
      theme: {
        preset: TemaVotacion,
        options: { darkModeSelector: '.' + CLASE_OSCURO, cssLayer: false },
      },
    }),
    MessageService,
    ConfirmationService,
  ],
};
