(function (global) {
  'use strict';

  const MONTHS = global.ExcelReader.MONTHS;
  const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  const NUMBER = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });
  const INTEGER = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
  const PERCENT = new Intl.NumberFormat('es-CL', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function uniqueServices(records) {
    const map = new Map();
    records.forEach(record => {
      const key = record.__serviceKey || `ROW:${record.__rowNumber}`;
      if (!map.has(key)) map.set(key, record);
    });
    return Array.from(map.values());
  }

  function sum(records, field) {
    return records.reduce((total, record) => total + (Number(record[field]) || 0), 0);
  }

  function metrics(records) {
    const services = uniqueServices(records);
    const serviceCount = services.length;
    const pallets = sum(services, '__pallets');
    const weight = sum(services, '__weight');
    const sale = sum(services, '__sale');
    const cost = sum(services, '__cost');
    const profit = sale - cost;
    const margin = sale > 0 ? profit / sale : 0;
    const delivered = services.filter(record => record.__statusNormalized === 'ENTREGADO').length;
    const rejected = services.filter(record => record.__statusNormalized === 'RECHAZADO').length;
    const cancelled = services.filter(record => record.__statusNormalized === 'CANCELADO').length;
    const helperServices = services.filter(record => record.__requiresHelper === 'SI' || record.__requiresHelper === 'SÍ').length;
    return {
      records: services,
      services: serviceCount,
      pallets,
      weight,
      sale,
      cost,
      profit,
      margin,
      delivered,
      rejected,
      cancelled,
      helperServices,
      avgSale: serviceCount ? sale / serviceCount : 0,
      avgCost: serviceCount ? cost / serviceCount : 0,
      avgProfit: serviceCount ? profit / serviceCount : 0,
      avgPallets: serviceCount ? pallets / serviceCount : 0,
      avgWeight: serviceCount ? weight / serviceCount : 0
    };
  }

  function variation(current, previous) {
    if (previous === null || previous === undefined || previous === 0) return null;
    return (current - previous) / previous;
  }

  function compareMetrics(current, previous) {
    return {
      services: variation(current.services, previous?.services),
      pallets: variation(current.pallets, previous?.pallets),
      sale: variation(current.sale, previous?.sale),
      cost: variation(current.cost, previous?.cost),
      profit: variation(current.profit, previous?.profit),
      margin: variation(current.margin, previous?.margin),
      marginPoints: previous ? current.margin - previous.margin : null
    };
  }

  function monthly(records, year) {
    const result = MONTHS.map((monthName, index) => ({
      month: index + 1,
      monthName,
      monthShort: monthName.slice(0, 3),
      ...metrics(records.filter(record => record.__year === year && record.__month === index + 1))
    }));
    return result;
  }

  function monthlyForFiltered(records) {
    return MONTHS.map((monthName, index) => ({
      month: index + 1,
      monthName,
      monthShort: monthName.slice(0, 3),
      ...metrics(records.filter(record => record.__month === index + 1))
    }));
  }

  function group(records, field, options = {}) {
    const groups = new Map();
    uniqueServices(records).forEach(record => {
      const raw = record[field];
      const label = String(raw || options.emptyLabel || 'Sin información').trim() || options.emptyLabel || 'Sin información';
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(record);
    });
    const total = uniqueServices(records).length || 1;
    return Array.from(groups.entries()).map(([label, rows]) => ({
      label,
      ...metrics(rows),
      participation: uniqueServices(rows).length / total
    }));
  }

  function sortGroups(groups, field = 'services', direction = 'desc') {
    const multiplier = direction === 'asc' ? 1 : -1;
    return [...groups].sort((a, b) => ((a[field] || 0) - (b[field] || 0)) * multiplier || a.label.localeCompare(b.label, 'es'));
  }

  function statusGroups(records) {
    return sortGroups(group(records, '__status', { emptyLabel: 'Sin estado' }), 'services');
  }

  function recent(records, limit = 10) {
    return uniqueServices(records)
      .filter(record => record.__date)
      .sort((a, b) => b.__date - a.__date || b.__rowNumber - a.__rowNumber)
      .slice(0, limit);
  }

  function financialAlerts(records) {
    const services = uniqueServices(records);
    const categories = {
      noCost: services.filter(record => record.__cost === 0),
      noSale: services.filter(record => record.__sale === 0),
      costOverSale: services.filter(record => record.__sale > 0 && record.__cost > record.__sale),
      negativeMargin: services.filter(record => record.__profit < 0),
      incomplete: records.filter(record => !record.__valid),
      potentialDuplicate: records.filter(record => record.__potentialDuplicate)
    };
    return categories;
  }

  function negativeMarginRows(records, limit = 20) {
    return uniqueServices(records)
      .filter(record => record.__profit < 0)
      .sort((a, b) => a.__profit - b.__profit)
      .slice(0, limit);
  }

  function destinationAddressGroups(records, limit = 20) {
    const map = new Map();
    uniqueServices(records).forEach(record => {
      const key = `${record.__destination || 'Sin destino'}|${record.__address || 'Sin dirección'}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(record);
    });
    return Array.from(map.entries()).map(([key, rows]) => {
      const [destination, address] = key.split('|');
      return { destination, address, ...metrics(rows) };
    }).sort((a, b) => b.services - a.services).slice(0, limit);
  }

  function formatCurrency(value) {
    return CLP.format(Number(value) || 0).replace(/\s/g, '');
  }

  function formatNumber(value, decimals = 1) {
    if (decimals === 0) return INTEGER.format(Number(value) || 0);
    return NUMBER.format(Number(value) || 0);
  }

  function formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('es-CL', { style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  }

  function formatVariation(value) {
    if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${formatPercent(value, 1)}`;
  }

  function formatDate(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(value);
  }

  function compact(value, type = 'number') {
    const number = Number(value) || 0;
    if (type === 'currency') {
      if (Math.abs(number) >= 1_000_000_000) return `$${(number / 1_000_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} mil MM`;
      if (Math.abs(number) >= 1_000_000) return `$${(number / 1_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MM`;
      if (Math.abs(number) >= 1_000) return `$${(number / 1_000).toLocaleString('es-CL', { maximumFractionDigits: 0 })} mil`;
      return formatCurrency(number);
    }
    if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} M`;
    if (Math.abs(number) >= 1_000) return `${(number / 1_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} mil`;
    return formatNumber(number, 0);
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function downloadCsv(fileName, headers, rows) {
    const content = '\uFEFF' + [headers, ...rows].map(row => row.map(csvEscape).join(';')).join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  global.Calculations = {
    uniqueServices,
    metrics,
    variation,
    compareMetrics,
    monthly,
    monthlyForFiltered,
    group,
    sortGroups,
    statusGroups,
    recent,
    financialAlerts,
    negativeMarginRows,
    destinationAddressGroups,
    formatCurrency,
    formatNumber,
    formatPercent,
    formatVariation,
    formatDate,
    compact,
    downloadCsv
  };
})(window);
