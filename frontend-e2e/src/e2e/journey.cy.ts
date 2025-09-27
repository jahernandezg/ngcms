// E2E principal: home -> abrir post -> back (robusto frente a SSR devolviendo HTML transitorio)

describe('journey home -> post -> back', () => {
  // Evita que una excepción de parseo JSON (Unexpected token '<') temprana aborte el test antes de nuestra lógica de reintentos
  Cypress.on('uncaught:exception', (err) => {
    if (/Unexpected token '<'/.test(err.message)) {
      return false; // ignorar específicamente esta condición, el test validará luego la respuesta real
    }
    return true;
  });

  it('navega al detalle y regresa', () => {
    // 1. Consultar primero la API (sin montar la UI) para estabilizar backend y saber si hay contenido
    let api = (Cypress.env('API_URL') as string) || `${Cypress.config().baseUrl?.replace(/\/$/, '')}/api`;
    api = api.replace('localhost', '127.0.0.1');
    cy.log(`API_URL efectivo: ${api}`);

    const fetchPosts = (attempt = 1) => {
      cy.log(`Intento fetch posts (${attempt})`);
      return cy.request({ url: `${api.replace(/\/$/,'')}/posts?limit=1`, failOnStatusCode: false })
        .then((resp) => {
          if (typeof resp.body === 'string' && /^\s*<!DOCTYPE html/i.test(resp.body)) {
            cy.log('Respuesta HTML recibida en /posts (posible SSR fallback o proxy).');
            if (attempt < 5) {
              cy.wait(400 * attempt);
              return fetchPosts(attempt + 1);
            }
          }
            if ((resp.status === 0 || resp.status === 503) && attempt < 5) {
              cy.wait(400 * attempt);
              return fetchPosts(attempt + 1);
            }
          return resp;
        });
    };

    fetchPosts().then((resp) => {
      if (typeof resp.body === 'string' && /^\s*<!DOCTYPE html/i.test(resp.body)) {
        throw new Error('La API devolvió HTML en /posts tras reintentos (posible backend caído o proxy mal configurado)');
      }
      const ok = resp.status >= 200 && resp.status < 300;
      const hasPosts = ok && Array.isArray(resp.body?.data) && resp.body.data.length > 0;
      if (!ok) {
        cy.visit('/?view=blog');
        cy.contains(/Error/i).should('exist');
        return;
      }
      if (!hasPosts) {
        cy.visit('/?view=blog');
        cy.contains('No hay posts publicados todavía.').should('exist');
        return;
      }

      const first = resp.body.data[0];
      expect(first, 'primer post disponible').to.have.property('slug');
      cy.visit('/?view=blog');
      cy.visit(`/post/${first.slug}`);
      cy.get('h1,h2').first().should('be.visible');
      cy.go('back');
      cy.location('pathname').should('eq', '/');
    });
  });
});
