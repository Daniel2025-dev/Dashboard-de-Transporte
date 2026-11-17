(function (global) {
  'use strict';

  const COLORS = {
    blue: '#21458f', blueLight: '#7892d3', blueDark: '#102653', orange: '#e95420', orangeLight: '#f28d62',
    green: '#147a4a', red: '#c62f3d', yellow: '#b97800', gray: '#657084', grid: '#dfe5ee', text: '#263248', white: '#ffffff'
  };
  const registry = new Map();
  const tooltip = () => document.getElementById('chartTooltip');

  function getCanvas(canvasOrId) {
    return typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
  }

  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const containerWidth = canvas.parentElement?.clientWidth || 600;
    const cssWidth = Math.max(300, Math.round(rect.width || containerWidth));
    const requestedHeight = Math.max(240, Number(canvas.getAttribute('height')) || 330);
    const expanded = Boolean(canvas.closest('.card')?.classList.contains('is-expanded'));
    const cssHeight = expanded ? Math.min(460, Math.max(380, requestedHeight + 80)) : requestedHeight;

    // Regla v8: el canvas nunca modifica por sí solo el ancho de la tarjeta.
    canvas.style.width = '100%';
    canvas.style.minWidth = '0px';
    canvas.style.maxWidth = '100%';
    canvas.style.height = `${cssHeight}px`;
    canvas.style.minHeight = `${cssHeight}px`;
    canvas.style.maxHeight = `${cssHeight}px`;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);

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


  // Etiquetas v6: siempre muestran el valor completo. La ubicación se ajusta
  // para reducir superposiciones sin abreviar cifras.
  function drawDataLabel(ctx, text, x, y, options = {}) {
    if (text === null || text === undefined || text === '') return null;
    const fontSize = options.fontSize || 9.5;
    const borderColor = options.borderColor || options.color || COLORS.blue;
    const textColor = options.textColor || '#17243a';
    const background = options.background || 'rgba(255,255,255,.985)';
    ctx.save();
    ctx.font = `850 ${fontSize}px Inter, Segoe UI, Arial, sans-serif`;
    ctx.textAlign = options.align || 'center';
    ctx.textBaseline = 'middle';
    const paddingX = 5;
    const paddingY = 3;
    const metrics = ctx.measureText(String(text));
    const textWidth = metrics.width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize + paddingY * 2 + 1;

    let left = x - boxWidth / 2;
    if (ctx.textAlign === 'left') left = x - paddingX;
    if (ctx.textAlign === 'right') left = x - boxWidth + paddingX;
    const top = y - boxHeight / 2;

    ctx.shadowColor = options.shadowColor || 'rgba(16,38,83,.14)';
    ctx.shadowBlur = options.shadowBlur ?? 5;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = background;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = options.lineWidth || 1;

    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(left, top, boxWidth, boxHeight, 4);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.stroke();
    } else {
      ctx.fillRect(left, top, boxWidth, boxHeight);
      ctx.shadowColor = 'transparent';
      ctx.strokeRect(left, top, boxWidth, boxHeight);
    }

    ctx.fillStyle = textColor;
    ctx.fillText(String(text), x, y + .2);
    ctx.restore();
    return { left, top, right: left + boxWidth, bottom: top + boxHeight, width: boxWidth, height: boxHeight };
  }

  function dataLabelText(value, format) {
    return formatValue(value, format);
  }

  function boxesOverlap(a, b, padding = 3) {
    return !(a.right + padding <= b.left || a.left >= b.right + padding ||
      a.bottom + padding <= b.top || a.top >= b.bottom + padding);
  }

  function labelBox(ctx, text, x, y, fontSize = 9.5) {
    ctx.save();
    ctx.font = `850 ${fontSize}px Inter, Segoe UI, Arial, sans-serif`;
    const width = ctx.measureText(String(text)).width + 10;
    ctx.restore();
    const height = fontSize + 7;
    return { left: x - width / 2, top: y - height / 2, right: x + width / 2, bottom: y + height / 2, width, height };
  }

  function placeDataLabel(ctx, text, desiredX, desiredY, options, occupied, bounds) {
    const fontSize = options.fontSize || 9.5;
    const candidates = options.candidates || [
      [0, 0], [0, -19], [0, 19], [-34, 0], [34, 0],
      [-34, -19], [34, -19], [-34, 19], [34, 19],
      [0, -38], [0, 38], [-68, 0], [68, 0]
    ];
    let chosen = null;

    for (const [dx, dy] of candidates) {
      let x = desiredX + dx;
      let y = desiredY + dy;
      const initial = labelBox(ctx, text, x, y, fontSize);
      if (bounds) {
        const halfW = initial.width / 2;
        const halfH = initial.height / 2;
        x = Math.max(bounds.left + halfW, Math.min(bounds.right - halfW, x));
        y = Math.max(bounds.top + halfH, Math.min(bounds.bottom - halfH, y));
      }
      const box = labelBox(ctx, text, x, y, fontSize);
      if (!occupied.some(other => boxesOverlap(box, other, 3))) {
        chosen = { x, y, box };
        break;
      }
    }

    if (!chosen) {
      let x = desiredX;
      let y = desiredY;
      const initial = labelBox(ctx, text, x, y, fontSize);
      if (bounds) {
        x = Math.max(bounds.left + initial.width / 2, Math.min(bounds.right - initial.width / 2, x));
        y = Math.max(bounds.top + initial.height / 2, Math.min(bounds.bottom - initial.height / 2, y));
      }
      chosen = { x, y, box: labelBox(ctx, text, x, y, fontSize) };
    }

    const moved = Math.abs(chosen.x - desiredX) > 4 || Math.abs(chosen.y - desiredY) > 4;
    if (moved && options.anchorX !== undefined && options.anchorY !== undefined) {
      ctx.save();
      ctx.strokeStyle = options.connectorColor || 'rgba(38,50,72,.32)';
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(options.anchorX, options.anchorY);
      ctx.lineTo(chosen.x, chosen.y);
      ctx.stroke();
      ctx.restore();
    }

    const box = drawDataLabel(ctx, text, chosen.x, chosen.y, options) || chosen.box;
    occupied.push(box);
    return box;
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

  function findHit(state, x, y) {
    return state?.hits?.find(item => {
      if (item.type === 'point') return Math.hypot(x - item.x, y - item.y) <= (item.radius || 8);
      return x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h;
    }) || null;
  }

  function scheduleHoverRender(canvas, key) {
    const next = key || '';
    if (canvas.__hoverKey === next) return;
    canvas.__hoverKey = next;
    if (canvas.__hoverFrame) cancelAnimationFrame(canvas.__hoverFrame);
    canvas.__hoverFrame = requestAnimationFrame(() => {
      canvas.__hoverFrame = null;
      if (registry.has(canvas.id)) renderCanvas(canvas.id);
    });
  }

  function showTooltipForHit(canvas, hit, clientX, clientY) {
    const tip = tooltip();
    if (!tip) return;
    if (!hit) {
      tip.hidden = true;
      return;
    }
    tip.innerHTML = hit.tooltip;
    tip.hidden = false;
    tip.style.left = `${Math.max(8, Math.min(window.innerWidth - 310, clientX + 14))}px`;
    tip.style.top = `${Math.max(8, Math.min(window.innerHeight - 130, clientY + 14))}px`;
  }

  function attachInteractions(canvas, chartState) {
    if (canvas.__chartBound) return;

    const handlePointer = event => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.type === 'pointermove') return;
      const state = canvas.__chartState;
      if (!state) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = findHit(state, x, y);
      scheduleHoverRender(canvas, hit?.key);
      showTooltipForHit(canvas, hit, event.clientX, event.clientY);
      canvas.classList.toggle('is-interacting', Boolean(hit));
      canvas.style.cursor = hit?.clickable ? 'pointer' : hit ? 'crosshair' : 'default';
    };

    canvas.addEventListener('pointermove', handlePointer);
    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') handlePointer(event);
    });

    canvas.addEventListener('pointerleave', () => {
      const tip = tooltip();
      if (tip) tip.hidden = true;
      canvas.classList.remove('is-interacting');
      canvas.style.cursor = 'default';
      scheduleHoverRender(canvas, '');
    });

    canvas.addEventListener('click', event => {
      const state = canvas.__chartState;
      if (!state) return;
      const rect = canvas.getBoundingClientRect();
      const hit = findHit(state, event.clientX - rect.left, event.clientY - rect.top);
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
      const legendKey = `legend:${index}`;
      const legendHovered = ctx.canvas.__hoverKey === legendKey;
      if (legendHovered) {
        ctx.save();
        ctx.fillStyle = 'rgba(33,69,143,.08)';
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x - 6, y - 5, itemWidth + 4, 22, 6);
          ctx.fill();
        } else {
          ctx.fillRect(x - 6, y - 5, itemWidth + 4, 22);
        }
        ctx.restore();
      }
      ctx.globalAlpha = hidden.has(index) ? .35 : 1;
      ctx.fillStyle = dataset.color || COLORS.blue;
      if (dataset.type === 'line') {
        ctx.fillRect(x, y + 5, 17, 3);
        ctx.beginPath(); ctx.arc(x + 8.5, y + 6.5, 3, 0, Math.PI * 2); ctx.fill();
      } else ctx.fillRect(x, y + 1, 14, 11);
      ctx.fillStyle = COLORS.text;
      ctx.fillText(dataset.label, x + 20, y + 11);
      hits.push({
        key: legendKey, type: 'rect', x, y: y - 2, w: itemWidth, h: 18, clickable: true,
        tooltip: `<strong>${dataset.label}</strong>Haz clic para ${hidden.has(index) ? 'mostrar' : 'ocultar'} la serie.`,
        action: () => {
          hidden.has(index) ? hidden.delete(index) : hidden.add(index);
          ctx.canvas.__hoverKey = '';
          renderCanvas(ctx.canvas.id);
        }
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
    const labels = config.labels || [];
    const datasets = (config.datasets || []).filter(ds => Array.isArray(ds.data));
    const visibleSeriesCount = Math.max(1, datasets.length);
    canvas.style.minWidth = '0px';
    canvas.style.maxWidth = '100%';
    canvas.__preferredHeight = 0;
    const { ctx, width, height } = setupCanvas(canvas);
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
    const leftValues = [], rightValues = [];
    datasets.forEach((ds, index) => {
      if (hidden.has(index)) return;
      (ds.axis === 'right' ? rightValues : leftValues).push(...ds.data.map(Number).filter(Number.isFinite));
    });
    const leftRange = niceRange(leftValues.length ? leftValues : [0, 1], true);
    const rightRange = niceRange(rightValues.length ? rightValues : [0, 1], true);
    const leftFormat = config.leftFormat || datasets.find(ds => ds.axis !== 'right')?.format;
    const rightFormat = config.rightFormat || 'percent';
    ctx.font = '10px Inter, Segoe UI, Arial, sans-serif';
    const leftTickWidths = Array.from({ length: 6 }, (_, i) => {
      const value = leftRange.min + (i / 5) * (leftRange.max - leftRange.min);
      return ctx.measureText(formatValue(value, leftFormat)).width;
    });
    const rightTickWidths = rightValues.length ? Array.from({ length: 6 }, (_, i) => {
      const value = rightRange.min + (i / 5) * (rightRange.max - rightRange.min);
      return ctx.measureText(formatValue(value, rightFormat)).width;
    }) : [0];
    const margin = {
      left: Math.max(66, Math.min(112, Math.ceil(Math.max(...leftTickWidths)) + 12)),
      right: rightValues.length ? Math.max(58, Math.min(88, Math.ceil(Math.max(...rightTickWidths)) + 12)) : 24,
      top: Math.max(88, legendBottom + 28),
      bottom: 58
    };
    const plot = { x: margin.left, y: margin.top, w: width - margin.left - margin.right, h: height - margin.top - margin.bottom };
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
      ctx.fillText(formatValue(leftValue, leftFormat), plot.x - 8, y);
      if (rightValues.length) {
        const rightValue = rightRange.min + ratio * (rightRange.max - rightRange.min);
        ctx.textAlign = 'left';
        ctx.fillText(formatValue(rightValue, rightFormat), plot.x + plot.w + 8, y);
      }
    }
    const zeroY = yFor(0, 'left');
    ctx.strokeStyle = '#bfc7d5'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(plot.x, zeroY); ctx.lineTo(plot.x + plot.w, zeroY); ctx.stroke();

    const slot = plot.w / Math.max(1, labels.length);
    const occupiedLabels = [];
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
        const barKey = `bar:${index}:${labelIndex}`;
        const isHovered = canvas.__hoverKey === barKey;
        const anotherBarHovered = String(canvas.__hoverKey || '').startsWith('bar:') && !isHovered;
        ctx.save();
        ctx.fillStyle = ds.color || COLORS.blue;
        ctx.globalAlpha = anotherBarHovered ? .52 : (isHovered ? 1 : (ds.opacity || .94));
        if (isHovered) {
          ctx.shadowColor = 'rgba(16,38,83,.30)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 3;
        }
        ctx.fillRect(x, top, barWidth - 2, h);
        if (isHovered) {
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, top + 1, Math.max(1, barWidth - 4), Math.max(1, h - 2));
        }
        ctx.restore();

        if (value !== 0 && ds.showDataLabels !== false) {
          const labelText = dataLabelText(value, ds.format);
          const level = barIndex % 3;
          const labelY = value >= 0
            ? Math.max(plot.y + 12 + level * 18, top - 13 - level * 17)
            : Math.min(plot.y + plot.h - 12 - level * 18, top + h + 13 + level * 17);
          placeDataLabel(ctx, labelText, x + (barWidth - 2) / 2, labelY, {
            color: ds.color || COLORS.blue,
            borderColor: ds.color || COLORS.blue,
            fontSize: isHovered ? 10.2 : 9.2,
            anchorX: x + (barWidth - 2) / 2,
            anchorY: value >= 0 ? top : top + h
          }, occupiedLabels, {
            left: plot.x + 2, right: plot.x + plot.w - 2,
            top: legendBottom + 4, bottom: plot.y + plot.h - 2
          });
        }
        hits.push({ key: barKey, type: 'rect', x, y: top, w: barWidth - 2, h, clickable: !!config.onClickLabel,
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
      const lineHovered = String(canvas.__hoverKey || '').startsWith(`point:${dsIndex}:`);
      ctx.save();
      ctx.strokeStyle = ds.color || COLORS.orange;
      ctx.lineWidth = lineHovered ? Math.max(3.4, ds.lineWidth || 2.4) : (ds.lineWidth || 2.4);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (lineHovered) {
        ctx.shadowColor = 'rgba(16,38,83,.18)';
        ctx.shadowBlur = 7;
      }
      ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke();
      ctx.restore();

      points.forEach((point, index) => {
        const pointKey = `point:${dsIndex}:${index}`;
        const isHovered = canvas.__hoverKey === pointKey;
        ctx.save();
        ctx.fillStyle = ds.color || COLORS.orange;
        if (isHovered) {
          ctx.shadowColor = 'rgba(16,38,83,.34)';
          ctx.shadowBlur = 12;
        }
        ctx.beginPath(); ctx.arc(point.x, point.y, isHovered ? 6.2 : 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = COLORS.white; ctx.lineWidth = isHovered ? 2.2 : 1.6; ctx.stroke();
        ctx.restore();

        if (point.value !== 0 && ds.showDataLabels !== false) {
          const offset = 17 + (dsIndex % 3) * 19;
          const labelY = Math.max(plot.y + 12, point.y - offset);
          const horizontalOffset = (index % 2 === 0 ? -1 : 1) * (dsIndex % 2 ? 20 : 0);
          placeDataLabel(ctx, dataLabelText(point.value, ds.format), point.x + horizontalOffset, labelY, {
            color: ds.color || COLORS.orange,
            borderColor: ds.color || COLORS.orange,
            fontSize: isHovered ? 10.2 : 9.2,
            anchorX: point.x,
            anchorY: point.y
          }, occupiedLabels, {
            left: plot.x + 2, right: plot.x + plot.w - 2,
            top: legendBottom + 4, bottom: plot.y + plot.h - 2
          });
        }
        hits.push({ key: pointKey, type: 'point', x: point.x, y: point.y, radius: 10, clickable: !!config.onClickLabel,
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
    const items = (config.items || []).filter(item => item && Number.isFinite(Number(item.value)));
    canvas.style.minWidth = '0px';
    canvas.style.maxWidth = '100%';
    canvas.__preferredHeight = 0;
    const { ctx, width, height } = setupCanvas(canvas);
    if (!items.length) {
      drawEmpty(ctx, width, height, config.emptyMessage);
      canvas.__chartState = { hits: [] }; attachInteractions(canvas, canvas.__chartState); return;
    }
    const hits = [];
    const maxLabelWidth = Math.min(width * .48, Math.max(105, ...items.map(item => {
      ctx.font = '11px Inter, Segoe UI, Arial, sans-serif'; return ctx.measureText(item.label).width + 20;
    })));
    ctx.font = '800 9px Inter, Segoe UI, Arial, sans-serif';
    const maxValueLabelWidth = Math.max(...items.map(item => ctx.measureText(formatValue(Number(item.value) || 0, config.format)).width));
    const margin = { left: maxLabelWidth, right: Math.max(78, Math.min(width * .32, maxValueLabelWidth + 18)), top: 16, bottom: 32 };
    const plot = { x: margin.left, y: margin.top, w: Math.max(80, width - margin.left - margin.right), h: height - margin.top - margin.bottom };
    const values = items.map(item => Number(item.value));
    const range = niceRange(values, true);
    const rowHeight = plot.h / items.length;
    const zeroX = plot.x + ((0 - range.min) / (range.max - range.min)) * plot.w;

    ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1;
    const tickCount = width < 980 ? 3 : 4;
    for (let i = 0; i <= tickCount; i++) {
      const ratio = i / tickCount; const x = plot.x + ratio * plot.w;
      ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke();
      const value = range.min + ratio * (range.max - range.min);
      ctx.fillStyle = COLORS.text; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '700 9.5px Inter, Segoe UI, Arial, sans-serif';
      ctx.fillText(formatValue(value, config.format), x, plot.y + plot.h + 8);
    }

    items.forEach((item, index) => {
      const value = Number(item.value) || 0;
      const centerY = plot.y + rowHeight * index + rowHeight / 2;
      const xValue = plot.x + ((value - range.min) / (range.max - range.min)) * plot.w;
      const x = Math.min(zeroX, xValue); const w = Math.max(1, Math.abs(xValue - zeroX));
      const h = Math.max(7, Math.min(24, rowHeight * .62)); const y = centerY - h / 2;
      const barKey = `hbar:${index}`;
      const isHovered = canvas.__hoverKey === barKey;
      const anotherHovered = String(canvas.__hoverKey || '').startsWith('hbar:') && !isHovered;
      const barColor = item.color || config.color || (value < 0 ? COLORS.red : COLORS.blue);
      ctx.save();
      ctx.fillStyle = barColor;
      ctx.globalAlpha = anotherHovered ? .52 : 1;
      if (isHovered) {
        ctx.shadowColor = 'rgba(16,38,83,.30)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 2;
      }
      ctx.fillRect(x, y, w, h);
      if (isHovered) {
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
      }
      ctx.restore();

      ctx.fillStyle = COLORS.text; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.font = `${isHovered ? '800' : '650'} 10.5px Inter, Segoe UI, Arial, sans-serif`;
      const label = item.label.length > 42 ? `${item.label.slice(0, 40)}…` : item.label;
      ctx.fillText(label, plot.x - 8, centerY);

      ctx.textAlign = value >= 0 ? 'left' : 'right';
      ctx.fillStyle = barColor;
      ctx.font = `850 ${isHovered ? 11.5 : 10.7}px Inter, Segoe UI, Arial, sans-serif`;
      ctx.fillText(formatValue(value, config.format), value >= 0 ? xValue + 7 : xValue - 7, centerY);
      hits.push({ key: barKey, type: 'rect', x, y, w: Math.max(w, 4), h, clickable: !!config.onClick,
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
