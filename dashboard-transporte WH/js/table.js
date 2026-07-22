(function (global) {
  'use strict';

  const DEFAULT_VISIBLE = new Set([
    'ID','Fecha_ Entrega _tte','Cliente','Destino','Region ','Empresa_transp ','N° Pedido','Guía de despacho',
    'Pallets Entregados','Peso','Costo total','Venta Total','Margen $','MG','Entregado/Rechazado'
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function rawValue(record, header) {
    return record.__raw?.[header] ?? '';
  }

  function formatRaw(record, header, type) {
    const value = rawValue(record, header);
    if (type === 'Fecha') {
      const dateFieldMap = {
        'Fecha de Solicitud': record.__requestDate,
        'Fecha de necesidad': record.__needDate,
        'Fecha_ Entrega _tte': record.__deliveryDate,
        'Fecha_Factura': record.__invoiceDate
      };
      return global.Calculations.formatDate(dateFieldMap[header]);
    }
    if (type === 'Moneda CLP') return global.Calculations.formatCurrency(value);
    if (type === 'Porcentaje') {
      const parsed = global.ExcelReader.parseNumber(value, true);
      return global.Calculations.formatPercent(parsed.value, 1);
    }
    if (type === 'Número') {
      const parsed = global.ExcelReader.parseNumber(value);
      return parsed.value === null ? '' : global.Calculations.formatNumber(parsed.value, 1);
    }
    if (header === 'Hora_Cita') return record.__appointmentTime;
    return String(value ?? '');
  }

  class TransportTable {
    constructor(options) {
      this.container = document.getElementById(options.containerId);
      this.pagination = document.getElementById(options.paginationId);
      this.searchInput = document.getElementById(options.searchInputId);
      this.pageSizeSelect = document.getElementById(options.pageSizeId);
      this.columnChooser = document.getElementById(options.columnChooserId);
      this.columnChooserButton = document.getElementById(options.columnChooserButtonId);
      this.exportButton = document.getElementById(options.exportButtonId);
      this.onRowClick = options.onRowClick;
      this.records = [];
      this.filtered = [];
      this.headers = [];
      this.dictionary = new Map();
      this.visible = new Set();
      this.sort = { header: 'Fecha_ Entrega _tte', direction: 'desc' };
      this.page = 1;
      this.pageSize = 25;
      this.bindControls();
    }

    bindControls() {
      this.searchInput?.addEventListener('input', () => { this.page = 1; this.applySearch(); });
      this.pageSizeSelect?.addEventListener('change', () => { this.pageSize = Number(this.pageSizeSelect.value) || 25; this.page = 1; this.render(); });
      this.columnChooserButton?.addEventListener('click', () => {
        if (this.columnChooser) this.columnChooser.hidden = !this.columnChooser.hidden;
      });
      this.exportButton?.addEventListener('click', () => this.exportCsv());
    }

    configure(headers, dictionary) {
      this.headers = headers;
      this.dictionary = new Map((dictionary || []).map(item => [item.column, item]));
      this.visible = new Set(headers.filter(header => DEFAULT_VISIBLE.has(header)));
      if (!this.visible.size) headers.slice(0, 12).forEach(header => this.visible.add(header));
      this.renderColumnChooser();
    }

    setData(records) {
      this.records = records || [];
      this.page = 1;
      this.applySearch();
    }

    applySearch() {
      const term = normalize(this.searchInput?.value || '').trim();
      if (!term) this.filtered = [...this.records];
      else {
        this.filtered = this.records.filter(record => {
          if (record.__issues?.some(issue => normalize(issue).includes(term))) return true;
          return this.headers.some(header => normalize(rawValue(record, header)).includes(term));
        });
      }
      this.sortRows();
      this.render();
    }

    sortRows() {
      const { header, direction } = this.sort;
      const factor = direction === 'asc' ? 1 : -1;
      const type = this.dictionary.get(header)?.type || 'Texto';
      this.filtered.sort((a, b) => {
        let av = rawValue(a, header), bv = rawValue(b, header);
        if (type === 'Fecha') {
          const map = { 'Fecha de Solicitud': '__requestDate', 'Fecha de necesidad': '__needDate', 'Fecha_ Entrega _tte': '__deliveryDate', 'Fecha_Factura': '__invoiceDate' };
          av = a[map[header]]?.getTime?.() || 0; bv = b[map[header]]?.getTime?.() || 0;
        } else if (['Moneda CLP','Número','Porcentaje'].includes(type)) {
          av = global.ExcelReader.parseNumber(av, type === 'Porcentaje').value ?? -Infinity;
          bv = global.ExcelReader.parseNumber(bv, type === 'Porcentaje').value ?? -Infinity;
        } else {
          return String(av ?? '').localeCompare(String(bv ?? ''), 'es', { numeric: true, sensitivity: 'base' }) * factor;
        }
        return ((av || 0) - (bv || 0)) * factor;
      });
    }

    toggleSort(header) {
      if (this.sort.header === header) this.sort.direction = this.sort.direction === 'asc' ? 'desc' : 'asc';
      else this.sort = { header, direction: 'asc' };
      this.sortRows();
      this.render();
    }

    renderColumnChooser() {
      if (!this.columnChooser) return;
      this.columnChooser.innerHTML = '';
      this.headers.forEach(header => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.checked = this.visible.has(header);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) this.visible.add(header); else this.visible.delete(header);
          if (!this.visible.size) { this.visible.add(header); checkbox.checked = true; }
          this.render();
        });
        label.append(checkbox, document.createTextNode(header));
        this.columnChooser.appendChild(label);
      });
    }

    render() {
      if (!this.container) return;
      const visibleHeaders = this.headers.filter(header => this.visible.has(header));
      const totalPages = Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
      if (this.page > totalPages) this.page = totalPages;
      const start = (this.page - 1) * this.pageSize;
      const rows = this.filtered.slice(start, start + this.pageSize);

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      visibleHeaders.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        if (this.sort.header === header) {
          const indicator = document.createElement('span');
          indicator.className = 'sort-indicator'; indicator.textContent = this.sort.direction === 'asc' ? '▲' : '▼';
          th.appendChild(indicator);
        }
        th.addEventListener('click', () => this.toggleSort(header));
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow); table.appendChild(thead);

      const tbody = document.createElement('tbody');
      rows.forEach(record => {
        const tr = document.createElement('tr');
        if (record.__issues?.length) tr.classList.add('flagged');
        tr.title = record.__issues?.length ? record.__issues.join(' | ') : 'Haz clic para ver el detalle';
        tr.addEventListener('click', () => this.onRowClick?.(record));
        visibleHeaders.forEach(header => {
          const td = document.createElement('td');
          const type = this.dictionary.get(header)?.type || 'Texto';
          td.textContent = formatRaw(record, header, type);
          td.title = td.textContent;
          if (header === 'Margen $' || header === 'MG') {
            const numeric = header === 'Margen $' ? record.__profit : record.__margin;
            td.classList.add(numeric < 0 ? 'cell-negative' : numeric > 0 ? 'cell-positive' : '');
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      if (!rows.length) {
        const tr = document.createElement('tr'); const td = document.createElement('td');
        td.colSpan = Math.max(1, visibleHeaders.length); td.textContent = 'No hay registros que coincidan con la búsqueda.'; td.style.padding = '25px'; td.style.textAlign = 'center';
        tr.appendChild(td); tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      this.container.replaceChildren(table);
      this.renderPagination(totalPages, start, rows.length);
    }

    renderPagination(totalPages, start, visibleCount) {
      if (!this.pagination) return;
      const info = document.createElement('span');
      const from = this.filtered.length ? start + 1 : 0;
      const to = start + visibleCount;
      info.textContent = `Mostrando ${from.toLocaleString('es-CL')}–${to.toLocaleString('es-CL')} de ${this.filtered.length.toLocaleString('es-CL')} registros`;
      const actions = document.createElement('div'); actions.className = 'pagination-actions';
      const makeButton = (label, page, disabled = false, active = false) => {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.disabled = disabled;
        if (active) button.classList.add('active');
        button.addEventListener('click', () => { this.page = page; this.render(); });
        return button;
      };
      actions.appendChild(makeButton('‹', Math.max(1, this.page - 1), this.page === 1));
      const candidates = new Set([1, totalPages, this.page - 1, this.page, this.page + 1]);
      Array.from(candidates).filter(p => p >= 1 && p <= totalPages).sort((a,b) => a-b).forEach((page, index, pages) => {
        if (index && page - pages[index - 1] > 1) {
          const gap = document.createElement('span'); gap.textContent = '…'; gap.style.padding = '7px 3px'; actions.appendChild(gap);
        }
        actions.appendChild(makeButton(String(page), page, false, page === this.page));
      });
      actions.appendChild(makeButton('›', Math.min(totalPages, this.page + 1), this.page === totalPages));
      this.pagination.replaceChildren(info, actions);
    }

    exportCsv() {
      const headers = this.headers.filter(header => this.visible.has(header));
      const rows = this.filtered.map(record => headers.map(header => formatRaw(record, header, this.dictionary.get(header)?.type || 'Texto')));
      global.Calculations.downloadCsv(`registros_transporte_filtrados_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
    }
  }

  function exportRecords(records, headers, dictionary, fileName = 'transporte_filtrado.csv') {
    const typeMap = new Map((dictionary || []).map(item => [item.column, item.type]));
    const rows = records.map(record => headers.map(header => formatRaw(record, header, typeMap.get(header) || 'Texto')));
    global.Calculations.downloadCsv(fileName, headers, rows);
  }

  global.TableModule = { TransportTable, exportRecords, formatRaw };
})(window);
