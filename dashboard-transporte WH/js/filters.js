(function (global) {
  'use strict';

  const elements = {};
  const FILTER_IDS = {
    year: 'filterYear', month: 'filterMonth', dateFrom: 'filterDateFrom', dateTo: 'filterDateTo',
    client: 'filterClient', carrier: 'filterCarrier', status: 'filterStatus', destination: 'filterDestination', region: 'filterRegion'
  };
  let changeHandler = null;
  let initialized = false;

  function byId(id) { return document.getElementById(id); }
  function uniqueSorted(records, field) {
    return Array.from(new Set(records.map(record => String(record[field] || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }
  function populate(select, values, allLabel) {
    const previous = select.value;
    select.innerHTML = '';
    const all = document.createElement('option');
    all.value = '';
    all.textContent = allLabel;
    select.appendChild(all);
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    if (values.includes(previous)) select.value = previous;
  }
  function dateToInput(date) {
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '';
  }

  function initialize(records, onChange) {
    changeHandler = onChange;
    Object.entries(FILTER_IDS).forEach(([key, id]) => { elements[key] = byId(id); });
    const years = Array.from(new Set(records.map(r => r.__year).filter(Boolean))).sort((a, b) => b - a).map(String);
    populate(elements.year, years, 'Todos');
    populate(elements.client, uniqueSorted(records, '__client'), 'Todos');
    populate(elements.carrier, uniqueSorted(records, '__carrier'), 'Todas');
    populate(elements.status, uniqueSorted(records, '__status'), 'Todos');
    populate(elements.destination, uniqueSorted(records, '__destination'), 'Todos');
    populate(elements.region, uniqueSorted(records, '__region'), 'Todas');

    Object.values(elements).forEach(element => {
      element.disabled = false;
      if (!element.dataset.bound) {
        element.addEventListener('change', () => changeHandler?.(getValues()));
        element.dataset.bound = '1';
      }
    });

    const reasonableDates = records.map(r => r.__date).filter(date => date instanceof Date && !Number.isNaN(date.getTime()));
    if (reasonableDates.length) {
      const min = new Date(Math.min(...reasonableDates));
      const max = new Date(Math.max(...reasonableDates));
      elements.dateFrom.min = dateToInput(min); elements.dateFrom.max = dateToInput(max);
      elements.dateTo.min = dateToInput(min); elements.dateTo.max = dateToInput(max);
    }
    if (!initialized && years.length) elements.year.value = years[0];
    initialized = true;
    return getValues();
  }

  function getValues() {
    return {
      year: elements.year?.value ? Number(elements.year.value) : null,
      month: elements.month?.value ? Number(elements.month.value) : null,
      dateFrom: elements.dateFrom?.value || '',
      dateTo: elements.dateTo?.value || '',
      client: elements.client?.value || '',
      carrier: elements.carrier?.value || '',
      status: elements.status?.value || '',
      destination: elements.destination?.value || '',
      region: elements.region?.value || ''
    };
  }

  function apply(records, filters = getValues()) {
    const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00Z`) : null;
    const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59Z`) : null;
    return records.filter(record => {
      if (filters.year && record.__year !== Number(filters.year)) return false;
      if (filters.month && record.__month !== Number(filters.month)) return false;
      if (from && (!record.__date || record.__date < from)) return false;
      if (to && (!record.__date || record.__date > to)) return false;
      if (filters.client && record.__client !== filters.client) return false;
      if (filters.carrier && record.__carrier !== filters.carrier) return false;
      if (filters.status && record.__status !== filters.status) return false;
      if (filters.destination && record.__destination !== filters.destination) return false;
      if (filters.region && record.__region !== filters.region) return false;
      return true;
    });
  }

  function shiftDateString(value, years) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return '';
    date.setUTCFullYear(date.getUTCFullYear() + years);
    return date.toISOString().slice(0, 10);
  }

  function previousPeriodFilters(filters = getValues()) {
    if (!filters.year) return null;
    return {
      ...filters,
      year: filters.year - 1,
      dateFrom: shiftDateString(filters.dateFrom, -1),
      dateTo: shiftDateString(filters.dateTo, -1)
    };
  }

  function setFilter(key, value, trigger = true) {
    const element = elements[key];
    if (!element) return;
    const stringValue = value === null || value === undefined ? '' : String(value);
    if (Array.from(element.options || []).some(option => option.value === stringValue)) element.value = stringValue;
    else element.value = '';
    if (trigger) changeHandler?.(getValues());
  }

  function reset(trigger = true) {
    Object.keys(elements).forEach(key => {
      if (!elements[key]) return;
      elements[key].value = '';
    });
    if (trigger) changeHandler?.(getValues());
  }

  function periodLabel(filters = getValues()) {
    const pieces = [];
    if (filters.year) pieces.push(String(filters.year));
    if (filters.month) pieces.unshift(global.ExcelReader.MONTHS[filters.month - 1]);
    if (filters.dateFrom || filters.dateTo) pieces.push(`${filters.dateFrom || 'inicio'} a ${filters.dateTo || 'fin'}`);
    return pieces.length ? pieces.join(' · ') : 'Todos los períodos';
  }

  global.Filters = { initialize, getValues, apply, previousPeriodFilters, setFilter, reset, periodLabel };
})(window);
