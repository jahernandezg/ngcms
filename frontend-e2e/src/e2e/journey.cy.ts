// E2E principal: home -> abrir post -> back

describe('journey home -> post -> back', () => {
  it('navega al detalle y regresa', () => {
    // Forzar modo blog en caso de que exista homepage como página
    cy.visit('/?view=blog');

    // Consultar si hay posts publicados vía API
    const api = (Cypress.env('API_URL') as string) || `${Cypress.config().baseUrl?.replace(/\/$/, '')}/api`;
    cy.request({ url: `${api.replace(/\/$/,'')}/posts?limit=1`, failOnStatusCode: false }).then((resp) => {
      const ok = resp.status >= 200 && resp.status < 300;
      const hasPosts = ok && Array.isArray(resp.body?.data) && resp.body.data.length > 0;
      if (!ok) {
        // API caída o DB no disponible: la UI debe mostrar un mensaje de error
        cy.contains(/Error/i).should('exist');
        return;
      }
      if (!hasPosts) {
        // Sin posts: validar mensaje de vacío y salir
        cy.contains('No hay posts publicados todavía.').should('exist');
        return;
      }

      // Hay posts: ejecutar el journey
      cy.get('a[href^="/post/"]', { timeout: 10000 }).first().as('firstPostLink');
      cy.get('@firstPostLink').invoke('attr', 'href').then((href) => {
        cy.get('@firstPostLink').click();
        cy.url().should('include', href as string);
        cy.get('h1,h2').first().should('be.visible');
  cy.go('back');
  // Evitamos flakiness por query params (p.ej. ?view=blog) comparando sólo el pathname
  cy.location('pathname').should('eq', '/');
      });
    });
  });
});
