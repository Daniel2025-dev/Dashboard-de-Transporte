(function (global) {
  'use strict';

  let expandedCard = null;

  function refreshVisuals(card) {
    card.querySelectorAll('canvas[id]').forEach(canvas => {
      if (global.Charts?.renderCanvas) global.Charts.renderCanvas(canvas.id);
    });
    if (card.querySelector('#geoVisitMap') && global.GeoMap?.invalidate) global.GeoMap.invalidate();
  }

  function closeExpanded() {
    if (!expandedCard) return;
    expandedCard.classList.remove('is-expanded');
    const button = expandedCard.querySelector('.expand-card-btn');
    if (button) {
      button.textContent = '⛶';
      button.title = 'Expandir';
      button.setAttribute('aria-label', 'Expandir');
    }
    document.body.classList.remove('card-expanded-open');
    const previous = expandedCard;
    expandedCard = null;
    setTimeout(() => refreshVisuals(previous), 80);
  }

  function expand(card) {
    if (expandedCard === card) {
      closeExpanded();
      return;
    }
    closeExpanded();
    expandedCard = card;
    card.classList.add('is-expanded');
    document.body.classList.add('card-expanded-open');
    const button = card.querySelector('.expand-card-btn');
    if (button) {
      button.textContent = '×';
      button.title = 'Cerrar vista ampliada';
      button.setAttribute('aria-label', 'Cerrar vista ampliada');
    }
    setTimeout(() => refreshVisuals(card), 100);
  }

  function enhanceInteractiveVisuals() {
    document.querySelectorAll('canvas.chart-canvas').forEach(canvas => {
      if (canvas.dataset.interactiveReady === '1') return;
      const card = canvas.closest('.card');
      const title = card?.querySelector('.card-header h3')?.textContent?.trim() || 'Gráfico';
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `${title}. Gráfico interactivo: pasa el cursor o toca los elementos para ver valores completos.`);
      canvas.title = 'Interactivo: pasa el cursor o toca un elemento para ver el detalle.';
      canvas.dataset.interactiveReady = '1';
    });

    document.querySelectorAll('.table-wrap, .data-grid').forEach(grid => {
      if (grid.dataset.focusReady === '1') return;
      grid.tabIndex = 0;
      grid.dataset.focusReady = '1';
    });
  }

  function addExpandButtons() {
    enhanceInteractiveVisuals();
    document.querySelectorAll('.card').forEach(card => {
      if (card.dataset.expandReady === '1') return;
      const expandable = card.querySelector('canvas, .table-wrap, .data-grid, .geo-map, .geo-visit-map');
      const header = card.querySelector(':scope > .card-header');
      if (!expandable || !header) return;

      let actions = header.querySelector('.card-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'card-actions';
        const existingButtons = Array.from(header.querySelectorAll(':scope > .icon-btn'));
        existingButtons.forEach(button => actions.appendChild(button));
        header.appendChild(actions);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'icon-btn expand-card-btn';
      button.textContent = '⛶';
      button.title = 'Expandir';
      button.setAttribute('aria-label', 'Expandir');
      button.addEventListener('click', () => expand(card));
      actions.appendChild(button);
      card.dataset.expandReady = '1';
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expandedCard) closeExpanded();
  });

  const observer = new MutationObserver(() => {
    addExpandButtons();
    enhanceInteractiveVisuals();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  addExpandButtons();

  global.UiEnhancements = { refresh: addExpandButtons, closeExpanded, enhanceInteractiveVisuals };
})(window);
