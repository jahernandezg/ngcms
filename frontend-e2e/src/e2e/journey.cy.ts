// E2E principal: home -> abrir post -> back

describe('journey home -> post -> back', () => {
  it('navega al detalle y regresa', () => {
    cy.visit('/');
    // Espera al menos un enlace de post (seed)
    cy.get('a[href^="/post/"]').first().as('firstPostLink');
    cy.get('@firstPostLink').invoke('attr', 'href').then((href) => {
      cy.get('@firstPostLink').click();
      cy.url().should('include', href as string);
      cy.get('h1,h2').first().should('be.visible');
      cy.go('back');
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });
});
