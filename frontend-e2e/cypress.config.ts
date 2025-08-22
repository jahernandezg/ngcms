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
  specPattern: 'src/e2e/journey.cy.ts'
  },
});
