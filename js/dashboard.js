(function (global) {
  'use strict';

  let dataset = null;
  let filterRequest = null;
  let detailTable = null;
  let activeView = 'summary';
  let lastContext = null;

  const C = global.Calculations;
  const COLORS = global.Charts.COLORS;

  function byId(id) { return document.getElementById(id); }
  function clear(id) { const el = byId(id); if (el) el.innerHTML = ''; return el; }
  function cell(value, className = '') { return { value, className }; }
  function valueOf(item) { return item && typeof item === 'object' && 'value' in item ? item.value : item; }
  function classOf(item) { return item && typeof item === 'object' ? item.className || '' : ''; }

  function createTable(containerId, headers, rows, options = {}) {
    const container = clear(containerId);
    if (!container) return;
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    headers.forEach(header => { const th = document.createElement('th'); th.textContent = header; trh.appendChild(th); });
    thead.appendChild(trh); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      if (options.onRowClick) { tr.style.cursor = 'pointer'; tr.addEventListener('click', () => options.onRowClick(rowIndex)); }
      row.forEach(item => {
        const td = document.createElement('td');
        td.textContent = valueOf(item) ?? '';
        const cls = classOf(item); if (cls) td.className = cls;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    if (!rows.length) {
      const tr = document.createElement('tr'); const td = document.createElement('td');
      td.colSpan = headers.length; td.textContent = options.emptyMessage || 'Sin datos para mostrar.'; td.style.padding = '22px'; td.style.textAlign = 'center';
      tr.appendChild(td); tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    if (options.footer) {
      const tfoot = document.createElement('tfoot'); const tr = document.createElement('tr');
      options.footer.forEach(item => { const td = document.createElement('td'); td.textContent = valueOf(item) ?? ''; const cls = classOf(item); if (cls) td.className = cls; tr.appendChild(td); });
      tfoot.appendChild(tr); table.appendChild(tfoot);
    }
    container.appendChild(table);
  }

  function variationClass(value, favorableLower = false) {
    if (value === null || value === undefined || !Number.isFinite(value) || value === 0) return 'neutral';
    const positive = favorableLower ? value < 0 : value > 0;
    return positive ? 'up' : 'down';
  }

  function kpiCard(item) {
    const card = document.createElement('article');
    card.className = `kpi-card ${item.tone || ''}`;
    const label = document.createElement('span'); label.className = 'kpi-label'; label.textContent = item.label;
    const value = document.createElement('strong'); value.className = 'kpi-value'; value.textContent = item.value;
    const footer = document.createElement('div'); footer.className = 'kpi-footer';
    const note = document.createElement('span'); note.textContent = item.note || '';
    footer.appendChild(note);
    if ('variation' in item) {
      const badge = document.createElement('span');
      const state = variationClass(item.variation, item.favorableLower);
      badge.className = `variation-badge ${state}`;
      badge.textContent = item.variation === null || item.variation === undefined ? 'N/A' : `${item.variation > 0 ? '↑' : item.variation < 0 ? '↓' : '•'} ${C.formatVariation(item.variation)}`;
      badge.title = item.variation === null ? 'Sin base de comparación' : 'Variación frente al mismo período del año anterior';
      footer.appendChild(badge);
    }
    card.append(label, value, footer);
    return card;
  }

  function renderKpis(containerId, items) {
    const container = clear(containerId);
    if (!container) return;
    items.forEach(item => container.appendChild(kpiCard(item)));
  }

  function monthlyData(records) { return C.monthlyForFiltered(records); }

  function metricComparison(currentRecords, previousRecords) {
    const current = C.metrics(currentRecords);
    const previous = previousRecords ? C.metrics(previousRecords) : null;
    return { current, previous, variation: C.compareMetrics(current, previous) };
  }

  // Compara contra el mismo rango de meses del año anterior cuando el año actual
  // aún no termina (ej.: ene-nov 2026 vs ene-nov 2025).
  function comparablePreviousRecords(currentRecords, previousRecords, filters) {
    if (!Array.isArray(previousRecords)) return [];
    if (!filters?.year || filters.month || filters.dateFrom || filters.dateTo) return previousRecords;
    const activeMonths = currentRecords.map(record => record.__month).filter(Number.isFinite);
    if (!activeMonths.length) return previousRecords;
    const lastMonth = Math.max(...activeMonths);
    return previousRecords.filter(record => Number(record.__month) <= lastMonth);
  }

  function renderSummary(context) {
    const { currentRecords, previousRecords, filters } = context;
    const comparablePrevious = comparablePreviousRecords(currentRecords, previousRecords, filters);
    const { current, previous, variation } = metricComparison(currentRecords, comparablePrevious);
    byId('summaryPeriodLabel').textContent = global.Filters.periodLabel(filters);

    renderKpis('summaryKpis', [
      { label: 'Total de servicios', value: C.formatNumber(current.services, 0), variation: variation.services, note: 'IDs únicos', tone: 'accent' },
      { label: 'Total de pallets', value: C.formatNumber(current.pallets, 1), variation: variation.pallets, note: 'Entregados; respaldo solicitados' },
      { label: 'Venta total', value: C.formatCurrency(current.sale), variation: variation.sale, note: 'Venta Total', tone: 'accent' },
      { label: 'Costo total', value: C.formatCurrency(current.cost), variation: variation.cost, favorableLower: true, note: 'Costo Total' },
      { label: 'Utilidad total', value: C.formatCurrency(current.profit), variation: variation.profit, note: 'Venta - Costo', tone: current.profit < 0 ? 'negative' : 'positive' },
      { label: 'Margen porcentual', value: C.formatPercent(current.margin, 1), variation: variation.margin, note: 'Utilidad / Venta', tone: current.margin < 0 ? 'negative' : 'positive' },
      { label: 'Variación de servicios', value: C.formatVariation(variation.services), note: 'Mismo período año anterior', tone: variationClass(variation.services) === 'down' ? 'negative' : 'positive' },
      { label: 'Variación de ventas', value: C.formatVariation(variation.sale), note: 'Mismo período año anterior', tone: variationClass(variation.sale) === 'down' ? 'negative' : 'positive' },
      { label: 'Variación de costos', value: C.formatVariation(variation.cost), note: 'Mismo período año anterior', tone: variationClass(variation.cost, true) === 'down' ? 'negative' : 'positive' },
      { label: 'Variación de utilidad', value: C.formatVariation(variation.profit), note: 'Mismo período año anterior', tone: variationClass(variation.profit) === 'down' ? 'negative' : 'positive' },
      { label: 'Variación de margen', value: C.formatVariation(variation.margin), note: previous ? `${(variation.marginPoints * 100).toLocaleString('es-CL', { maximumFractionDigits: 1 })} pp` : 'Sin base', tone: variationClass(variation.margin) === 'down' ? 'negative' : 'positive' }
    ]);

    const monthlyCurrent = monthlyData(currentRecords);
    const monthlyPrevious = comparablePrevious.length ? monthlyData(comparablePrevious) : monthlyData([]);
    global.Charts.mixed('financialSummaryChart', {
      labels: monthlyCurrent.map(item => item.monthShort),
      datasets: [
        { type: 'bar', label: 'Ventas', data: monthlyCurrent.map(item => item.sale), color: COLORS.orange, format: 'currency' },
        { type: 'bar', label: 'Costos', data: monthlyCurrent.map(item => item.cost), color: COLORS.blue, format: 'currency' },
        { type: 'line', label: 'Utilidad', data: monthlyCurrent.map(item => item.profit), color: COLORS.green, format: 'currency' },
        { type: 'line', label: 'Margen', data: monthlyCurrent.map(item => item.margin), color: COLORS.red, axis: 'right', format: 'percent' }
      ],
      leftFormat: 'currency', rightFormat: 'percent',
      onClickLabel: (_, index) => filterRequest?.('month', index + 1)
    });
    global.Charts.mixed('servicePalletChart', {
      labels: monthlyCurrent.map(item => item.monthShort),
      datasets: [
        { type: 'bar', label: 'Servicios', data: monthlyCurrent.map(item => item.services), color: COLORS.orange, format: 'number' },
        { type: 'line', label: 'Pallets', data: monthlyCurrent.map(item => item.pallets), color: COLORS.green, format: 'decimal' }
      ],
      onClickLabel: (_, index) => filterRequest?.('month', index + 1)
    });
    const currentYearLabel = filters.year ? String(filters.year) : 'Actual';
    const previousYearLabel = filters.year ? String(filters.year - 1) : 'Anterior';

    // En vista anual, no muestra meses futuros vacíos. Si el usuario selecciona un
    // mes, compara exclusivamente ese mes contra el mismo mes del año anterior.
    const activeMonthIndexes = monthlyCurrent.reduce((indexes, item, index) => {
      if (item.services || item.pallets || item.sale || item.cost || item.profit) indexes.push(index);
      return indexes;
    }, []);
    const visibleMonthIndexes = filters.month
      ? [Math.max(0, Math.min(11, Number(filters.month) - 1))]
      : Array.from({ length: activeMonthIndexes.length ? Math.max(...activeMonthIndexes) + 1 : 12 }, (_, index) => index);
    const comparisonCurrent = visibleMonthIndexes.map(index => monthlyCurrent[index]);
    const comparisonPrevious = visibleMonthIndexes.map(index => monthlyPrevious[index]);

    const comparisonPeriodLabel = byId('comparisonPeriodLabel');
    if (comparisonPeriodLabel) {
      comparisonPeriodLabel.textContent = `${previousYearLabel} vs ${currentYearLabel} · comparación a igual período`;
    }

    global.Charts.mixed('annualSalesChart', {
      labels: comparisonCurrent.map(item => item.monthShort),
      datasets: [
        { type: 'line', label: currentYearLabel, data: comparisonCurrent.map(item => item.sale), color: COLORS.orange, format: 'currency' },
        { type: 'line', label: previousYearLabel, data: comparisonPrevious.map(item => item.sale), color: COLORS.blueLight, format: 'currency' }
      ],
      leftFormat: 'currency', onClickLabel: (_, index) => filterRequest?.('month', visibleMonthIndexes[index] + 1)
    });

    const comparisonRows = comparisonCurrent.map((item, index) => {
      const prev = comparisonPrevious[index];
      const saleDiff = item.sale - prev.sale;
      const saleVar = C.variation(item.sale, prev.sale);
      const profitDiff = item.profit - prev.profit;
      const marginPoints = (item.margin - prev.margin) * 100;
      return [
        item.monthName,
        cell(C.formatCurrency(prev.sale), 'numeric previous-period'),
        cell(C.formatCurrency(item.sale), 'numeric current-period'),
        cell(C.formatCurrency(saleDiff), `numeric ${saleDiff < 0 ? 'negative-text' : saleDiff > 0 ? 'positive-text' : 'muted'}`),
        cell(C.formatVariation(saleVar), `numeric ${saleVar < 0 ? 'negative-text' : saleVar > 0 ? 'positive-text' : 'muted'}`),
        cell(C.formatCurrency(prev.cost), 'numeric previous-period'),
        cell(C.formatCurrency(item.cost), 'numeric current-period'),
        cell(C.formatCurrency(prev.profit), `numeric previous-period ${prev.profit < 0 ? 'negative-text' : ''}`),
        cell(C.formatCurrency(item.profit), `numeric current-period ${item.profit < 0 ? 'negative-text' : 'positive-text'}`),
        cell(C.formatCurrency(profitDiff), `numeric ${profitDiff < 0 ? 'negative-text' : profitDiff > 0 ? 'positive-text' : 'muted'}`),
        cell(C.formatPercent(prev.margin, 1), `numeric previous-period ${prev.margin < 0 ? 'negative-text' : ''}`),
        cell(C.formatPercent(item.margin, 1), `numeric current-period ${item.margin < 0 ? 'negative-text' : ''}`),
        cell(`${marginPoints > 0 ? '+' : ''}${marginPoints.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp`, `numeric ${marginPoints < 0 ? 'negative-text' : marginPoints > 0 ? 'positive-text' : 'muted'}`)
      ];
    });

    const sumRows = rows => {
      const sale = rows.reduce((sum, item) => sum + (Number(item.sale) || 0), 0);
      const cost = rows.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const profit = sale - cost;
      return { sale, cost, profit, margin: sale > 0 ? profit / sale : 0 };
    };
    const currentComparable = sumRows(comparisonCurrent);
    const previousComparable = sumRows(comparisonPrevious);
    const totalSaleDiff = currentComparable.sale - previousComparable.sale;
    const totalSaleVar = C.variation(currentComparable.sale, previousComparable.sale);
    const totalProfitDiff = currentComparable.profit - previousComparable.profit;
    const totalMarginPoints = (currentComparable.margin - previousComparable.margin) * 100;

    createTable(
      'monthlyComparisonTable',
      [
        'Mes',
        `Venta ${previousYearLabel}`, `Venta ${currentYearLabel}`, 'Δ Venta $', 'Var. Venta',
        `Costo ${previousYearLabel}`, `Costo ${currentYearLabel}`,
        `Utilidad ${previousYearLabel}`, `Utilidad ${currentYearLabel}`, 'Δ Utilidad $',
        `Margen ${previousYearLabel}`, `Margen ${currentYearLabel}`, 'Δ Margen pp'
      ],
      comparisonRows,
      {
        footer: [
          'Total período',
          C.formatCurrency(previousComparable.sale), C.formatCurrency(currentComparable.sale), C.formatCurrency(totalSaleDiff), C.formatVariation(totalSaleVar),
          C.formatCurrency(previousComparable.cost), C.formatCurrency(currentComparable.cost),
          C.formatCurrency(previousComparable.profit), C.formatCurrency(currentComparable.profit), C.formatCurrency(totalProfitDiff),
          C.formatPercent(previousComparable.margin, 1), C.formatPercent(currentComparable.margin, 1),
          `${totalMarginPoints > 0 ? '+' : ''}${totalMarginPoints.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp`
        ]
      }
    );

    const clients = C.sortGroups(C.group(currentRecords, '__client'), 'sale').slice(0, 10);
    global.Charts.horizontalBars('topClientsChart', {
      items: clients.map(item => ({ label: item.label, value: item.sale, extraTooltip: `Servicios: ${C.formatNumber(item.services,0)} · Margen: ${C.formatPercent(item.margin,1)}` })),
      format: 'currency', valueLabel: 'Venta', color: COLORS.orange,
      onClick: item => filterRequest?.('client', item.label)
    });

    const carriers = C.sortGroups(C.group(currentRecords, '__carrier'), 'services').slice(0, 12);
    createTable('topCarriersTable', ['Transportista','Serv.','Costo','Venta','Utilidad','Margen'], carriers.map(item => [
      item.label, cell(C.formatNumber(item.services,0),'numeric'), cell(C.formatCurrency(item.cost),'numeric'), cell(C.formatCurrency(item.sale),'numeric'),
      cell(C.formatCurrency(item.profit),`numeric ${item.profit < 0 ? 'negative-text':'positive-text'}`), cell(C.formatPercent(item.margin,1),`numeric ${item.margin < 0 ? 'negative-text':''}`)
    ]), { onRowClick: index => filterRequest?.('carrier', carriers[index].label) });

    const recent = C.recent(currentRecords, 12);
    createTable('recentRecordsTable', ['Fecha','ID','Cliente','Destino','Estado'], recent.map(item => [
      C.formatDate(item.__date), item.__id || 'Sin ID', item.__client || 'Sin cliente', item.__destination || 'Sin destino', item.__status || 'Sin estado'
    ]), { onRowClick: index => showRecord(recent[index]) });
  }

  function renderServices(context) {
    const { currentRecords, previousRecords } = context;
    const { current, variation } = metricComparison(currentRecords, previousRecords);
    renderKpis('serviceKpis', [
      { label: 'Servicios', value: C.formatNumber(current.services,0), variation: variation.services, note: 'IDs únicos', tone: 'accent' },
      { label: 'Entregados', value: C.formatNumber(current.delivered,0), note: `${C.formatPercent(current.services ? current.delivered/current.services : 0,1)} del total`, tone: 'positive' },
      { label: 'Rechazados', value: C.formatNumber(current.rejected,0), note: `${C.formatPercent(current.services ? current.rejected/current.services : 0,1)} del total`, tone: current.rejected ? 'negative':'' },
      { label: 'Cancelados', value: C.formatNumber(current.cancelled,0), note: 'Estado registrado', tone: current.cancelled ? 'negative':'' },
      { label: 'Pallets', value: C.formatNumber(current.pallets,1), variation: variation.pallets, note: 'Entregados' },
      { label: 'Promedio pallets/servicio', value: C.formatNumber(current.avgPallets,1), note: 'Pallets / servicios' },
      { label: 'Peso total', value: `${C.formatNumber(current.weight,0)} kg`, note: 'Suma de Peso' },
      { label: 'Servicios con peoneta', value: C.formatNumber(current.helperServices,0), note: 'Exigencia Peoneta = Sí' }
    ]);
    const monthly = monthlyData(currentRecords);
    global.Charts.mixed('servicesTrendChart', {
      labels: monthly.map(item => item.monthShort),
      datasets: [
        { type: 'bar', label: 'Servicios', data: monthly.map(item => item.services), color: COLORS.orange, format: 'number' },
        { type: 'line', label: 'Pallets', data: monthly.map(item => item.pallets), color: COLORS.blue, format: 'decimal' }
      ], onClickLabel: (_, index) => filterRequest?.('month', index + 1)
    });
    const status = C.statusGroups(currentRecords);
    global.Charts.horizontalBars('statusChart', {
      items: status.map(item => ({ label: item.label, value: item.services, extraTooltip: `Participación: ${C.formatPercent(item.participation,1)}` })),
      format: 'number', valueLabel: 'Servicios', color: COLORS.blue,
      onClick: item => filterRequest?.('status', item.label === 'Sin estado' ? '' : item.label)
    });
    const destinations = C.sortGroups(C.group(currentRecords, '__destination'), 'services').slice(0, 15);
    global.Charts.horizontalBars('destinationsChart', {
      items: destinations.map(item => ({ label: item.label, value: item.services, extraTooltip: `Pallets: ${C.formatNumber(item.pallets,1)}` })),
      format: 'number', valueLabel: 'Servicios', color: COLORS.orange,
      onClick: item => filterRequest?.('destination', item.label === 'Sin información' ? '' : item.label)
    });
    const alerts = C.financialAlerts(currentRecords);
    const panel = clear('serviceAlertsPanel');
    const grid = document.createElement('div'); grid.className = 'alert-grid';
    [
      ['Registros incompletos', alerts.incomplete.length, 'warning'],
      ['Duplicados potenciales', alerts.potentialDuplicate.length, 'warning'],
      ['Servicios rechazados', current.rejected, current.rejected ? 'danger' : 'success'],
      ['Servicios cancelados', current.cancelled, current.cancelled ? 'danger' : 'success'],
      ['Sin venta', alerts.noSale.length, alerts.noSale.length ? 'danger' : 'success'],
      ['Sin costo', alerts.noCost.length, alerts.noCost.length ? 'warning' : 'success']
    ].forEach(([label, value, tone]) => {
      const card = document.createElement('div'); card.className = `alert-card ${tone}`;
      card.innerHTML = `<strong>${Number(value).toLocaleString('es-CL')}</strong><span>${label}</span>`; grid.appendChild(card);
    });
    panel?.appendChild(grid);
  }

  function groupComparison(currentRecords, previousRecords, field) {
    const current = C.group(currentRecords, field);
    const previousMap = new Map(C.group(previousRecords || [], field).map(item => [item.label, item]));
    return current.map(item => ({ ...item, previous: previousMap.get(item.label) || null }));
  }

  function renderClients(context) {
    const { currentRecords, previousRecords, filters } = context;
    const groups = groupComparison(currentRecords, previousRecords, '__client');
    const bySale = C.sortGroups(groups, 'sale');
    const byProfit = C.sortGroups(groups, 'profit');
    const bestMargin = [...groups].filter(item => item.sale > 0 && item.services >= 2).sort((a,b) => b.margin-a.margin)[0];
    const topClient = bySale[0];
    renderKpis('clientKpis', [
      { label: 'Clientes activos', value: C.formatNumber(groups.length,0), note: 'Con servicios en el período', tone: 'accent' },
      { label: 'Cliente con mayor venta', value: topClient?.label || 'Sin datos', note: topClient ? C.formatCurrency(topClient.sale) : '' },
      { label: 'Cliente con mayor utilidad', value: byProfit[0]?.label || 'Sin datos', note: byProfit[0] ? C.formatCurrency(byProfit[0].profit) : '' },
      { label: 'Mejor margen', value: bestMargin ? C.formatPercent(bestMargin.margin,1) : 'N/A', note: bestMargin?.label || 'Sin base' },
      { label: 'Participación del principal', value: topClient ? C.formatPercent(topClient.participation,1) : 'N/A', note: 'Según cantidad de servicios' }
    ]);
    global.Charts.horizontalBars('clientSalesChart', {
      items: bySale.slice(0,15).map(item => ({ label: item.label, value: item.sale, extraTooltip: `Servicios: ${C.formatNumber(item.services,0)} · Participación: ${C.formatPercent(item.participation,1)}` })),
      format: 'currency', valueLabel: 'Venta', color: COLORS.orange, onClick: item => filterRequest?.('client', item.label)
    });
    global.Charts.horizontalBars('clientProfitChart', {
      items: byProfit.slice(0,15).map(item => ({ label: item.label, value: item.profit, color: item.profit < 0 ? COLORS.red : COLORS.green, extraTooltip: `Margen: ${C.formatPercent(item.margin,1)}` })),
      format: 'currency', valueLabel: 'Utilidad', onClick: item => filterRequest?.('client', item.label)
    });
    const selectedClient = filters.client || topClient?.label;
    const clientRecords = selectedClient ? currentRecords.filter(record => record.__client === selectedClient) : [];
    const monthly = monthlyData(clientRecords);
    byId('clientEvolutionLabel').textContent = selectedClient || 'Sin cliente seleccionado';
    global.Charts.mixed('clientEvolutionChart', {
      labels: monthly.map(item => item.monthShort),
      datasets: [
        { type: 'bar', label: 'Ventas', data: monthly.map(item => item.sale), color: COLORS.orange, format: 'currency' },
        { type: 'line', label: 'Utilidad', data: monthly.map(item => item.profit), color: COLORS.green, format: 'currency' },
        { type: 'line', label: 'Margen', data: monthly.map(item => item.margin), color: COLORS.blue, axis: 'right', format: 'percent' }
      ], leftFormat: 'currency', rightFormat: 'percent', onClickLabel: (_, index) => filterRequest?.('month', index + 1)
    });
    createTable('clientDetailTable', ['Cliente','Servicios','Pallets','Venta','Costo','Utilidad','Margen','Participación','Var. ventas'], bySale.map(item => {
      const v = C.variation(item.sale, item.previous?.sale);
      return [item.label, cell(C.formatNumber(item.services,0),'numeric'), cell(C.formatNumber(item.pallets,1),'numeric'), cell(C.formatCurrency(item.sale),'numeric'), cell(C.formatCurrency(item.cost),'numeric'),
        cell(C.formatCurrency(item.profit),`numeric ${item.profit<0?'negative-text':'positive-text'}`), cell(C.formatPercent(item.margin,1),`numeric ${item.margin<0?'negative-text':''}`),
        cell(C.formatPercent(item.participation,1),'numeric'), cell(C.formatVariation(v),`numeric ${v<0?'negative-text':v>0?'positive-text':'muted'}`)];
    }), { onRowClick: index => filterRequest?.('client', bySale[index].label) });
  }

  function renderCarriers(context) {
    const { currentRecords, previousRecords, filters } = context;
    const groups = groupComparison(currentRecords, previousRecords, '__carrier');
    const byServices = C.sortGroups(groups, 'services');
    const byCost = C.sortGroups(groups, 'cost');
    const byProfit = C.sortGroups(groups, 'profit');
    const top = byServices[0];
    renderKpis('carrierKpis', [
      { label: 'Transportistas activos', value: C.formatNumber(groups.length,0), note: 'Con servicios en el período', tone: 'accent' },
      { label: 'Mayor cantidad de servicios', value: top?.label || 'Sin datos', note: top ? `${C.formatNumber(top.services,0)} servicios` : '' },
      { label: 'Mayor costo acumulado', value: byCost[0]?.label || 'Sin datos', note: byCost[0] ? C.formatCurrency(byCost[0].cost) : '' },
      { label: 'Mayor utilidad asociada', value: byProfit[0]?.label || 'Sin datos', note: byProfit[0] ? C.formatCurrency(byProfit[0].profit) : '' },
      { label: 'Participación principal', value: top ? C.formatPercent(top.participation,1) : 'N/A', note: 'Según servicios' }
    ]);
    global.Charts.horizontalBars('carrierServicesChart', {
      items: byServices.map(item => ({ label: item.label, value: item.services, extraTooltip: `Costo: ${C.formatCurrency(item.cost)} · Margen: ${C.formatPercent(item.margin,1)}` })),
      format: 'number', valueLabel: 'Servicios', color: COLORS.blue, onClick: item => filterRequest?.('carrier', item.label)
    });
    global.Charts.horizontalBars('carrierCostChart', {
      items: byCost.map(item => ({ label: item.label, value: item.cost, extraTooltip: `Venta asociada: ${C.formatCurrency(item.sale)}` })),
      format: 'currency', valueLabel: 'Costo', color: COLORS.orange, onClick: item => filterRequest?.('carrier', item.label)
    });
    const selectedCarrier = filters.carrier || top?.label;
    const carrierRecords = selectedCarrier ? currentRecords.filter(record => record.__carrier === selectedCarrier) : [];
    const monthly = monthlyData(carrierRecords);
    byId('carrierEvolutionLabel').textContent = selectedCarrier || 'Sin transportista seleccionado';
    global.Charts.mixed('carrierEvolutionChart', {
      labels: monthly.map(item => item.monthShort),
      datasets: [
        { type: 'bar', label: 'Servicios', data: monthly.map(item => item.services), color: COLORS.blue, format: 'number' },
        { type: 'line', label: 'Costo', data: monthly.map(item => item.cost), color: COLORS.orange, axis: 'right', format: 'currency' }
      ], leftFormat: 'number', rightFormat: 'currency', onClickLabel: (_, index) => filterRequest?.('month', index + 1)
    });
    createTable('carrierDetailTable', ['Transportista','Servicios','Costo','Venta','Utilidad','Margen','Participación','Var. costo'], byServices.map(item => {
      const v = C.variation(item.cost, item.previous?.cost);
      return [item.label, cell(C.formatNumber(item.services,0),'numeric'), cell(C.formatCurrency(item.cost),'numeric'), cell(C.formatCurrency(item.sale),'numeric'),
        cell(C.formatCurrency(item.profit),`numeric ${item.profit<0?'negative-text':'positive-text'}`), cell(C.formatPercent(item.margin,1),`numeric ${item.margin<0?'negative-text':''}`),
        cell(C.formatPercent(item.participation,1),'numeric'), cell(C.formatVariation(v),`numeric ${v>0?'warning-text':v<0?'positive-text':'muted'}`)];
    }), { onRowClick: index => filterRequest?.('carrier', byServices[index].label) });
  }

  function renderGeography(context) {
    const { currentRecords } = context;
    const regions = C.sortGroups(C.group(currentRecords, '__region'), 'services');
    const destinationsAll = C.sortGroups(C.group(currentRecords, '__destination'), 'services');
    const mapped = [];
    const unmapped = [];

    destinationsAll.forEach((item, index) => {
      const location = global.GeographyData?.resolve(item.label);
      if (!location) {
        unmapped.push(item);
        return;
      }
      mapped.push({
        ...item,
        ...location,
        rank: index + 1,
        palletsLabel: C.formatNumber(item.pallets, 1),
        saleLabel: C.formatCurrency(item.sale)
      });
    });

    const totalServices = C.metrics(currentRecords).services;
    const mappedServices = mapped.reduce((sum, item) => sum + item.services, 0);
    const coverage = totalServices > 0 ? mappedServices / totalServices : 0;
    const topDestination = destinationsAll[0];

    renderKpis('geoKpis', [
      { label: 'Destinos distintos', value: C.formatNumber(destinationsAll.length, 0), note: 'Según columna Destino', tone: 'accent' },
      { label: 'Destinos georreferenciados', value: C.formatNumber(mapped.length, 0), note: `${C.formatPercent(coverage, 1)} de los servicios`, tone: 'positive' },
      { label: 'Destino más visitado', value: topDestination?.label || 'Sin datos', note: topDestination ? `${C.formatNumber(topDestination.services,0)} servicios` : '' },
      { label: 'Sin coordenadas', value: C.formatNumber(unmapped.length, 0), note: 'Localidades no homologadas', tone: unmapped.length ? '' : 'positive' }
    ]);

    global.GeoMap?.render('geoVisitMap', mapped, {
      onPointClick: point => filterRequest?.('destination', point.label === 'Sin información' ? '' : point.label)
    });

    const coverageNote = byId('geoMapCoverageNote');
    if (coverageNote) {
      const missingText = unmapped.length
        ? ` · ${unmapped.length} destinos sin coordenadas homologadas: ${unmapped.slice(0,5).map(item=>item.label).join(', ')}${unmapped.length>5?'…':''}`
        : '';
      coverageNote.textContent = `Mapa: ${mapped.length} destinos georreferenciados · ${C.formatNumber(mappedServices,0)} servicios representados (${C.formatPercent(coverage,1)})${missingText}`;
    }

    const destinations = destinationsAll.slice(0, 20);
    global.Charts.horizontalBars('geoDestinationsChart', {
      items: destinations.map(item => ({ label:item.label,value:item.services,extraTooltip:`Pallets: ${C.formatNumber(item.pallets,1)} · Venta: ${C.formatCurrency(item.sale)}` })),
      format:'number',valueLabel:'Servicios',color:COLORS.orange,onClick:item=>filterRequest?.('destination',item.label==='Sin información'?'':item.label)
    });

    createTable('destinationSummaryTable',['Destino','Servicios','Pallets','Venta','Utilidad','Margen'],destinationsAll.slice(0,30).map(item=>[
      item.label,
      cell(C.formatNumber(item.services,0),'numeric'),
      cell(C.formatNumber(item.pallets,1),'numeric'),
      cell(C.formatCurrency(item.sale),'numeric'),
      cell(C.formatCurrency(item.profit),`numeric ${item.profit<0?'negative-text':'positive-text'}`),
      cell(C.formatPercent(item.margin,1),`numeric ${item.margin<0?'negative-text':''}`)
    ]),{onRowClick:index=>filterRequest?.('destination',destinationsAll[index].label==='Sin información'?'':destinationsAll[index].label)});

    createTable('regionSummaryTable',['Clasificación','Servicios','Pallets','Venta','Costo','Utilidad','Margen'],regions.map(item=>[
      item.label,cell(C.formatNumber(item.services,0),'numeric'),cell(C.formatNumber(item.pallets,1),'numeric'),cell(C.formatCurrency(item.sale),'numeric'),cell(C.formatCurrency(item.cost),'numeric'),cell(C.formatCurrency(item.profit),`numeric ${item.profit<0?'negative-text':'positive-text'}`),cell(C.formatPercent(item.margin,1),'numeric')
    ]),{onRowClick:index=>filterRequest?.('region',regions[index].label==='Sin información'?'':regions[index].label)});

    const addresses=C.destinationAddressGroups(currentRecords,25);
    createTable('destinationAddressTable',['Destino','Dirección','Servicios','Pallets'],addresses.map(item=>[item.destination,item.address,cell(C.formatNumber(item.services,0),'numeric'),cell(C.formatNumber(item.pallets,1),'numeric')]));
  }

  function renderDetail(context) {
    detailTable?.setData(context.currentRecords);
  }

  function renderQuality() {
    if (!dataset) return;
    const q=dataset.quality;
    const cards=clear('qualityCards');
    [
      ['Registros procesados',q.processed,''],['Registros válidos',q.valid,'good'],['Registros observados',q.observed,q.observed?'warn':'good'],['Registros incompletos',q.incomplete,q.incomplete?'bad':'good'],
      ['Fechas no reconocidas',q.invalidDates,q.invalidDates?'warn':'good'],['Valores monetarios inválidos',q.invalidMonetary,q.invalidMonetary?'bad':'good'],['IDs duplicados',q.duplicateIds,q.duplicateIds?'bad':'good'],['Duplicados potenciales',q.potentialDuplicates,q.potentialDuplicates?'warn':'good'],['Columnas encontradas',q.columnsFound,'good'],['Columnas solicitadas no encontradas',q.missingOptional.length,q.missingOptional.length?'warn':'good']
    ].forEach(([label,value,tone])=>{const card=document.createElement('div');card.className=`quality-card ${tone}`;card.innerHTML=`<strong>${Number(value).toLocaleString('es-CL')}</strong><span>${label}</span>`;cards?.appendChild(card);});

    const mappingRows=[];
    Object.entries(dataset.mapping).forEach(([field,header])=>{if(global.ExcelReader.FIELD_META[field]||['serviceType','origin','center'].includes(field)){mappingRows.push([global.ExcelReader.FIELD_META[field]?.label||field,header||'No encontrada',header?'Disponible':'Pendiente']);}});
    createTable('columnMappingTable',['Campo requerido','Columna real','Estado'],mappingRows.map(row=>[row[0],row[1],cell(row[2],row[2]==='Disponible'?'positive-text':'warning-text')]));
    const obs=clear('qualityObservations');
    const observations=[
      `La hoja “${dataset.sheetName}” fue encontrada y la fila de encabezados se identificó en la fila ${dataset.headerRow}.`,
      `El servicio se cuenta por ID único. Cuando falta el ID, se utiliza una llave de respaldo basada en fecha, cliente, pedido, guía y dirección.`,
      `El período del dashboard se calcula exclusivamente con “${dataset.mapping.needDate || 'Fecha de necesidad'}”, correspondiente a la columna C del archivo.`,
      `La columna “${dataset.mapping.region || 'Region'}” contiene principalmente RM y RG; no corresponde a las 16 regiones administrativas de Chile.`,
      `Pallets utiliza “${dataset.mapping.palletsDelivered || 'Pallets Entregados'}” y, cuando está vacío, “${dataset.mapping.palletsRequested || 'Pallets solicitados'}”.`,
      `Utilidad y margen se recalculan desde Venta Total y Costo Total, evitando depender de fórmulas almacenadas o divisiones por cero.`
    ];
    if(q.missingOptional.length) observations.push('No se encontraron columnas identificables para: Tipo de servicio, Comuna de origen y Centro/Bodega. Los filtros aparecen deshabilitados para no inventar datos.');
    const list=document.createElement('div');list.className='observation-list';observations.forEach(text=>{const item=document.createElement('div');item.className='observation';item.textContent=text;list.appendChild(item);});obs?.appendChild(list);
    const sheetList=clear('sheetList');dataset.sheetNames.forEach(name=>{const tag=document.createElement('span');tag.className='tag';tag.textContent=name;sheetList?.appendChild(tag);});
    createTable('dataDictionaryTable',['Columna','Tipo','Uso en el dashboard','Cálculo / indicador'],dataset.dictionary.map(item=>[item.column,item.type,item.use,item.calculation]));
  }

  function showRecord(record) {
    if (!record || !dataset) return;
    byId('recordModalTitle').textContent = record.__id ? `Servicio ${record.__id}` : `Fila ${record.__rowNumber}`;
    const body=clear('recordModalBody');
    const typeMap=new Map(dataset.dictionary.map(item=>[item.column,item.type]));
    dataset.headers.forEach(header=>{
      const field=document.createElement('div');field.className='record-field';
      const label=document.createElement('span');label.textContent=header;
      const value=document.createElement('strong');value.textContent=global.TableModule.formatRaw(record,header,typeMap.get(header)||'Texto')||'Sin información';
      field.append(label,value);body?.appendChild(field);
    });
    if(record.__issues?.length){const field=document.createElement('div');field.className='record-field';field.style.gridColumn='1 / -1';const label=document.createElement('span');label.textContent='Observaciones de calidad';const value=document.createElement('strong');value.textContent=record.__issues.join(' | ');value.style.color=COLORS.red;field.append(label,value);body?.appendChild(field);}
    byId('recordModal').hidden=false;
  }

  function showView(view) {
    activeView=view;
    document.querySelectorAll('[data-view-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.viewPanel===view));
    document.querySelectorAll('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
    if(lastContext) renderActive(lastContext);
  }

  function renderActive(context) {
    if(activeView==='summary') renderSummary(context);
    else if(activeView==='services') renderServices(context);
    else if(activeView==='clients') renderClients(context);
    else if(activeView==='carriers') renderCarriers(context);
    else if(activeView==='geography') renderGeography(context);
    else if(activeView==='detail') renderDetail(context);
  }

  function initialize(data, onFilterRequest, tableInstance) {
    dataset=data;filterRequest=onFilterRequest;detailTable=tableInstance;
    renderQuality();
  }

  function render(context) {
    lastContext=context;
    renderActive(context);
  }

  global.Dashboard={initialize,render,showView,renderQuality,showRecord};
})(window);
