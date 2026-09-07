/** Immutable course checks, outside the learner-editable workspace. */
export function featureBrowserContract(tagName: string): string {
  if (tagName !== 'academy-account-detail') return '';
  return `await (async () => {
    const fixture = document.createElement('academy-account-detail');
    fixture.accountName = 'Cuenta de ensayo';
    fixture.status = 'success';
    fixture.movements = [
      { id: 'train', description: 'Billete de tren', amount: -12 },
      { id: 'market', description: 'Mercado del barrio', amount: -25 },
      { id: 'income', description: 'Ingreso de ejemplo', amount: 70 }
    ];
    document.body.append(fixture);
    try {
      await setContractLanguage('es');
      await fixture.updateComplete;
      const action = fixture.shadowRoot.querySelector('academy-action-button');
      await action?.updateComplete;
      const button = action?.shadowRoot?.querySelector('button');
      check('feature-action', 'El botón compartido tiene comportamiento real', Boolean(button), 'Importar una clase no basta: registra el botón en el host.');
      if (!button) return;
      let navigation;
      fixture.addEventListener('academy-account-detail-navigate', (event) => { navigation = event; });
      button.click();
      await fixture.updateComplete;
      const movements = fixture.shadowRoot.querySelector('academy-movement-list');
      await movements?.updateComplete;
      check('feature-navigation', 'La acción visible abre movimientos y comunica la cuenta', Boolean(movements && navigation?.detail.accountName === 'Cuenta de ensayo' && navigation?.detail.view === 'movements' && navigation.bubbles && navigation.composed), 'El consumidor debe observar el cambio real de vista y el nombre recibido por propiedad.');
      if (!movements?.shadowRoot) return;
      check('feature-input-data', 'La lista utiliza los datos recibidos', movements.shadowRoot.querySelectorAll('li').length === 3, 'Renderiza la colección de entrada, no una lista fija.');
      const input = movements.shadowRoot.querySelector('input');
      const filter = async (query) => {
        input.value = query;
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await fixture.updateComplete;
        await movements.updateComplete;
      };
      await filter(' TREN ');
      const filtered = movements.shadowRoot.querySelectorAll('li');
      check('feature-filter', 'El filtro conecta la vista con el host', filtered.length === 1 && filtered[0].textContent.includes('Billete de tren'), 'Ignora espacios exteriores y mayúsculas sin mutar la colección original.');
      await filter('sin coincidencias');
      check('feature-empty-filter', 'Una búsqueda vacía explica qué ocurrió', movements.shadowRoot.querySelectorAll('li').length === 0 && movements.shadowRoot.textContent.includes('No hay movimientos que coincidan'), 'El caso sin coincidencias necesita una explicación visible.');
      await filter('');
      check('feature-filter-reset', 'Limpiar el filtro recupera la colección', movements.shadowRoot.querySelectorAll('li').length === 3 && fixture.movements.length === 3, 'Filtrar no debe destruir los datos originales.');
      button.click();
      await fixture.updateComplete;
      check('feature-return', 'Volver recupera el resumen', Boolean(fixture.shadowRoot.querySelector('academy-account-summary')) && !fixture.shadowRoot.querySelector('academy-movement-list'), 'Cada vista debe tener una vuelta funcional, no solo cambiar el texto del botón.');
      for (const [state, message] of [['loading', 'Estamos preparando'], ['empty', 'Todavía no hay una cuenta'], ['error', 'No pudimos cargar']]) {
        fixture.status = state;
        await fixture.updateComplete;
        check('feature-state-' + state, 'Estado visible: ' + state, fixture.shadowRoot.textContent.includes(message) && !fixture.shadowRoot.querySelector('academy-account-summary, academy-movement-list'), 'No mezcles una carga o un error con resultados anteriores.');
      }
      let retry;
      fixture.addEventListener('academy-account-detail-retry', (event) => { retry = event; }, { once: true });
      fixture.shadowRoot.querySelector('button')?.click();
      check('feature-retry', 'Reintentar pide datos sin fingir una respuesta', retry?.detail.accountName === 'Cuenta de ensayo' && fixture.status === 'error', 'El consumidor posee la carga; el componente solo solicita el reintento.');
      fixture.status = 'success';
      await setContractLanguage('en');
      await fixture.updateComplete;
      const englishAction = fixture.shadowRoot.querySelector('academy-action-button');
      await englishAction?.updateComplete;
      check('feature-i18n', 'Host y variante cambian juntos de idioma', fixture.shadowRoot.textContent.includes('Your account at a glance') && englishAction?.shadowRoot?.textContent.includes('View transactions'), 'Carga también las traducciones de las dependencias.');
    } finally {
      fixture.remove();
    }
  })();`;
}
