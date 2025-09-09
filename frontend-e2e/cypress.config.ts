import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'node tools/e2e-server.js',
        production: 'node tools/e2e-server.js',
      },
      ciWebServerCommand: 'node tools/e2e-server.js',
      ciBaseUrl: 'http://localhost:4300',
    }),
    baseUrl: 'http://localhost:4300',
    // Ejecutar smoke + journey por defecto; admin-branding puede correrse vía CLI con --spec
    specPattern: ['src/e2e/smoke.cy.ts', 'src/e2e/journey.cy.ts'],
    env: {
      ADMIN_EMAIL: process.env["ADMIN_EMAIL"],
      ADMIN_PASSWORD: process.env["ADMIN_PASSWORD"],
  // Forzar IPv4 para evitar resolución a ::1 en CI que causa ECONNREFUSED
  API_URL: process.env["API_URL"] || 'http://127.0.0.1:3000/api',
    },
  },
});
