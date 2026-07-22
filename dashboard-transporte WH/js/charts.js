(function (global) {
  'use strict';

  const COLORS = {
    blue: '#28468f', blueLight: '#6f8ed0', blueDark: '#13275a', orange: '#e95c24', orangeLight: '#f59a72',
    green: '#1d8b58', red: '#d43f4b', yellow: '#d89a18', gray: '#8b95a5', grid: '#e5e9f0', text: '#4c5565', white: '#ffffff'
  };
  const registry = new Map();
  const tooltip = () => document.getElementById('chartTooltip');

  function getCanvas(canvasOrId) {
    return typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
  }

  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(300, Math.round(rect.width || canvas.parentElement?.clientWidth || 600));
    const cssHeight = Math.max(240, Number(canvas.getAttribute('height')) || 330);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    canvas.style.height = `${cssHeight}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.font = '12px Inter, Segoe UI, Arial, sans-serif';
    return { ctx, width: cssWidth, height: cssHeight, ratio };
  }

  function formatValue(value, format) {
    if (format === 'currency') return global.Calculations.formatCurrency(value);
    if (format === 'percent') return global.Calculations.formatPercent(value, 1);
    if (format === 'decimal') return global.Calculations.formatNumber(value, 1);
    return global.Calculations.formatNumber(value, 0);
  }

  function compactValue(value, format) {
    if (format === 'currency') return global.Calculations.compact(value, 'currency');
    if (format === 'percent') return `${(Number(value || 0) * 100).toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`;
    return global.Calculations.compact(value, 'number');
  }

  function niceRange(values, includeZero = true) {
    const finite = values.filter(Number.isFinite);
    if (!finite.length) return { min: 0, max: 1 };
    let min = Math.min(...finite), max = Math.max(...finite);
    if (includeZero) { min = Math.min(0, min); max = Math.max(0, max); }
    if (min === max) { max += Math.abs(max || 1); min -= Math.abs(min || 1) * .2; }
    const span = max - min;
    const rawStep = span / 5;
    const power = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1e-9))));
    const normalized = rawStep / power;
    const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * power;
    return { min: Math.floor(min / step) * step, max: Math.ceil(max / step) * step, step };
  }

  function drawEmpty(ctx, width, height, message = 'Sin datos para mostrar') {
    ctx.fillStyle = '#f8f9fb';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = COLORS.gray;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 13px Inter, Segoe UI, Arial, sans-serif';
    ctx.fillText(message, width / 2, height / 2);
  }

  function wrapLabel(ctx, text, maxWidth, maxLines = 2) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let current = '';
    words.forEach(word => {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth || !current) current = test;
      else { lines.push(current); current = word; }
    });
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      let last = kept[maxLines - 1];
      while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 2) last = last.slice(0, -1);
      kept[maxLines - 1] = `${last}…`;
      return kept;
    }
    return lines;
  }

  function attachInteractions(canvas, chartState) {
    if (canvas.__chartBound) return;
    canvas.addEventListener('mousemove', event => {
      const state = canvas.__chartState;
      if (!state) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = state.hits?.find(item => {
        if (item.type === 'point') return Math.hypot(x - item.x, y - item.y) <= (item.radius || 7);
        return x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h;
      });
      const tip = tooltip();
      if (hit && tip) {
        tip.innerHTML = hit.tooltip;
        tip.hidden = false;
        tip.style.left = `${Math.min(window.innerWidth - 290, event.clientX + 13)}px`;
        tip.style.top = `${Math.min(window.innerHeight - 100, event.clientY + 13)}px`;
        canvas.style.cursor = hit.clickable ? 'pointer' : 'default';
      } else {
        if (tip) tip.hidden = true;
        canvas.style.cursor = 'default';
      }
    });
    canvas.addEventListener('mouseleave', () => { const tip = tooltip(); if (tip) tip.hidden = true; canvas.style.cursor = 'default'; });
    canvas.addEventListener('click', event => {
      const state = canvas.__chartState;
      if (!state) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = state.hits?.find(item => {
        if (item.type === 'point') return Math.hypot(x - item.x, y - item.y) <= (item.radius || 8);
        return x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h;
      });
      if (hit?.action) hit.action();
    });
    canvas.__chartBound = true;
    canvas.__chartState = chartState;
  }

  function drawLegend(ctx, datasets, hidden, width, hits) {
    let x = 14, y = 15;
    ctx.font = '700 11px Inter, Segoe UI, Arial, sans-serif';
    datasets.forEach((dataset, index) => {
      const labelWidth = ctx.measureText(dataset.label).width;
      const itemWidth = 23 + labelWidth + 14;
      if (x + itemWidth > width - 10) { x = 14; y += 22; }
      ctx.globalAlpha = hidden.has(index) ? .35 : 1;
      ctx.fillStyle = dataset.color || COLORS.blue;
      if (dataset.type === 'line') {
        ctx.fillRect(x, y + 5, 17, 3);
        ctx.beginPath(); ctx.arc(x + 8.5, y + 6.5, 3, 0, Math.PI * 2); ctx.fill();
      } else ctx.fillRect(x, y + 1, 14, 11);
      ctx.fillStyle = COLORS.text;
      ctx.fillText(dataset.label, x + 20, y + 11);
      hits.push({
        type: 'rect', x, y: y - 2, w: itemWidth, h: 18, clickable: true,
        tooltip: `<strong>${dataset.label}</strong>Haz clic para ${hidden.has(index) ? 'mostrar' : 'ocultar'} la serie.`,
        action: () => { hidden.has(index) ? hidden.delete(index) : hidden.add(index); renderCanvas(ctx.canvas.id); }
      });
      x += itemWidth;
      ctx.globalAlpha = 1;
    });
    return y + 22;
  }

  function renderMixed(canvasOrId, config) {
    const canvas = getCanvas(canvasOrId);
    if (!canvas) return;
    registry.set(canvas.id, { type: 'mixed', config });
    const { ctx, width, height } = setupCanvas(canvas);
    const labels = config.labels || [];
    const datasets = (config.datasets || []).filter(ds => Array.isArray(ds.data));
    if (!labels.length || !datasets.length || !datasets.some(ds => ds.data.some(v => Number.isFinite(Number(v))))) {
      drawEmpty(ctx, width, height, config.emptyMessage);
      canvas.__chartState = { hits: [] };
      attachInteractions(canvas, canvas.__chartState);
      return;
    }

    const hidden = canvas.__hiddenDatasets || new Set();
    canvas.__hiddenDatasets = hidden;
    const hits = [];
    const legendBottom = drawLegend(ctx, datasets, hidden, width, hits);
    const margin = { left: 66, right: datasets.some(ds => ds.axis === 'right') ? 58 : 24, top: Math.max(42, legendBottom + 4), bottom: 58 };
    const plot = { x: margin.left, y: margin.top, w: width - margin.left - margin.right, h: height - margin.top - margin.bottom };
    const leftValues = [], rightValues = [];
    datasets.forEach((ds, index) => {
      if (hidden.has(index)) return;
      (ds.axis === 'right' ? rightValues : leftValues).push(...ds.data.map(Number).filter(Number.isFinite));
    });
    const leftRange = niceRange(leftValues.length ? leftValues : [0, 1], true);
    const rightRange = niceRange(rightValues.length ? rightValues : [0, 1], true);
    const yFor = (value, axis) => {
      const range = axis === 'right' ? rightRange : leftRange;
      return plot.y + plot.h - ((Number(value) - range.min) / (range.max - range.min)) * plot.h;
    };

    ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
    ctx.font = '10px Inter, Segoe UI, Arial, sans-serif'; ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const ratio = i / 5;
      const y = plot.y + plot.h - ratio * plot.h;
      ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
      const leftValue = leftRange.min + ratio * (leftRange.max - leftRange.min);
      ctx.fillStyle = COLORS.text; ctx.textAlign = 'right';
      ctx.fillText(compactValue(leftValue, config.leftFormat || datasets.find(ds => ds.axis !== 'right')?.format), plot.x - 8, y);
      if (rightValues.length) {
        const rightValue = rightRange.min + ratio * (rightRange.max - rightRange.min);
        ctx.textAlign = 'left';
        ctx.fillText(compactValue(rightValue, config.rightFormat || 'percent'), plot.x + plot.w + 8, y);
      }
    }
    const zeroY = yFor(0, 'left');
    ctx.strokeStyle = '#bfc7d5'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(plot.x, zeroY); ctx.lineTo(plot.x + plot.w, zeroY); ctx.stroke();

    const slot = plot.w / Math.max(1, labels.length);
    const barDatasets = datasets.map((ds, index) => ({ ds, index })).filter(({ ds, index }) => ds.type !== 'line' && !hidden.has(index));
    const barWidth = Math.max(4, Math.min(32, slot * .72 / Math.max(1, barDatasets.length)));

    labels.forEach((label, labelIndex) => {
      const center = plot.x + slot * labelIndex + slot / 2;
      ctx.fillStyle = COLORS.text; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '10px Inter, Segoe UI, Arial, sans-serif';
      const lines = wrapLabel(ctx, label, Math.max(35, slot - 5), 2);
      lines.forEach((line, lineIndex) => ctx.fillText(line, center, plot.y + plot.h + 10 + lineIndex * 12));

      barDatasets.forEach(({ ds, index }, barIndex) => {
        const value = Number(ds.data[labelIndex]) || 0;
        const y = yFor(value, ds.axis);
        const baseline = yFor(0, ds.axis);
        const x = center - (barDatasets.length * barWidth) / 2 + barIndex * barWidth + 1;
        const top = Math.min(y, baseline), h = Math.max(1, Math.abs(baseline - y));
        ctx.fillStyle = ds.color || COLORS.blue;
        ctx.globalAlpha = ds.opacity || .92;
        ctx.fillRect(x, top, barWidth - 2, h);
        ctx.globalAlpha = 1;
        hits.push({ type: 'rect', x, y: top, w: barWidth - 2, h, clickable: !!config.onClickLabel,
          tooltip: `<strong>${label}</strong>${ds.label}: ${formatValue(value, ds.format)}`,
          action: config.onClickLabel ? () => config.onClickLabel(label, labelIndex, ds) : null });
      });
    });

    datasets.forEach((ds, dsIndex) => {
      if (ds.type !== 'line' || hidden.has(dsIndex)) return;
      const points = ds.data.map((value, index) => ({
        value: Number(value) || 0,
        x: plot.x + slot * index + slot / 2,
        y: yFor(Number(value) || 0, ds.axis)
      }));
      ctx.strokeStyle = ds.color || COLORS.orange; ctx.lineWidth = ds.lineWidth || 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke();
      points.forEach((point, index) => {
        ctx.fillStyle = ds.color || COLORS.orange; ctx.beginPath(); ctx.arc(point.x, point.y, 3.8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = COLORS.white; ctx.lineWidth = 1.5; ctx.stroke();
        hits.push({ type: 'point', x: point.x, y: point.y, radius: 8, clickable: !!config.onClickLabel,
          tooltip: `<strong>${labels[index]}</strong>${ds.label}: ${formatValue(point.value, ds.format)}`,
          action: config.onClickLabel ? () => config.onClickLabel(labels[index], index, ds) : null });
      });
    });

    canvas.__chartState = { hits };
    attachInteractions(canvas, canvas.__chartState);
  }

  function renderHorizontalBars(canvasOrId, config) {
    const canvas = getCanvas(canvasOrId);
    if (!canvas) return;
    registry.set(canvas.id, { type: 'horizontal', config });
    const { ctx, width, height } = setupCanvas(canvas);
    const items = (config.items || []).filter(item => item && Number.isFinite(Number(item.value)));
    if (!items.length) {
      drawEmpty(ctx, width, height, config.emptyMessage);
      canvas.__chartState = { hits: [] }; attachInteractions(canvas, canvas.__chartState); return;
    }
    const hits = [];
    const maxLabelWidth = Math.min(width * .48, Math.max(105, ...items.map(item => {
      ctx.font = '11px Inter, Segoe UI, Arial, sans-serif'; return ctx.measureText(item.label).width + 20;
    })));
    const margin = { left: maxLabelWidth, right: 65, top: 16, bottom: 32 };
    const plot = { x: margin.left, y: margin.top, w: width - margin.left - margin.right, h: height - margin.top - margin.bottom };
    const values = items.map(item => Number(item.value));
    const range = niceRange(values, true);
    const rowHeight = plot.h / items.length;
    const zeroX = plot.x + ((0 - range.min) / (range.max - range.min)) * plot.w;

    ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const ratio = i / 4; const x = plot.x + ratio * plot.w;
      ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke();
      const value = range.min + ratio * (range.max - range.min);
      ctx.fillStyle = COLORS.text; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '10px Inter, Segoe UI, Arial, sans-serif';
      ctx.fillText(compactValue(value, config.format), x, plot.y + plot.h + 8);
    }

    items.forEach((item, index) => {
      const value = Number(item.value) || 0;
      const centerY = plot.y + rowHeight * index + rowHeight / 2;
      const xValue = plot.x + ((value - range.min) / (range.max - range.min)) * plot.w;
      const x = Math.min(zeroX, xValue); const w = Math.max(1, Math.abs(xValue - zeroX));
      const h = Math.max(7, Math.min(24, rowHeight * .62)); const y = centerY - h / 2;
      ctx.fillStyle = item.color || config.color || (value < 0 ? COLORS.red : COLORS.blue);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = COLORS.text; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.font = '600 10.5px Inter, Segoe UI, Arial, sans-serif';
      const label = item.label.length > 36 ? `${item.label.slice(0, 34)}…` : item.label;
      ctx.fillText(label, plot.x - 8, centerY);
      ctx.textAlign = value >= 0 ? 'left' : 'right';
      ctx.fillStyle = item.color || config.color || (value < 0 ? COLORS.red : COLORS.blue);
      ctx.font = '800 10.5px Inter, Segoe UI, Arial, sans-serif';
      ctx.fillText(compactValue(value, config.format), value >= 0 ? xValue + 6 : xValue - 6, centerY);
      hits.push({ type: 'rect', x, y, w: Math.max(w, 4), h, clickable: !!config.onClick,
        tooltip: `<strong>${item.label}</strong>${config.valueLabel || 'Valor'}: ${formatValue(value, config.format)}${item.extraTooltip ? `<br>${item.extraTooltip}` : ''}`,
        action: config.onClick ? () => config.onClick(item, index) : null });
    });
    canvas.__chartState = { hits }; attachInteractions(canvas, canvas.__chartState);
  }

  function renderCanvas(id) {
    const entry = registry.get(id);
    if (!entry) return;
    if (entry.type === 'mixed') renderMixed(id, entry.config);
    else renderHorizontalBars(id, entry.config);
  }

  function download(canvasOrId, fileName = 'grafico.png') {
    const canvas = getCanvas(canvasOrId);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link); link.click(); link.remove();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => registry.forEach((_, id) => {
      const canvas = document.getElementById(id);
      if (canvas && canvas.offsetParent !== null) renderCanvas(id);
    }), 160);
  });

  global.Charts = { COLORS, mixed: renderMixed, horizontalBars: renderHorizontalBars, renderCanvas, download };
})(window);
