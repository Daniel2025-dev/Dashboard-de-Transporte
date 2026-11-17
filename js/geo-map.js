(function (global) {
  'use strict';

  let map = null;
  let markersLayer = null;
  let lastContainerId = null;

  const COLORS = {
    blue: '#28468f',
    blueDark: '#13275a',
    orange: '#e95c24',
    green: '#1d8b58'
  };

  function byId(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function markerColor(value, max) {
    const ratio = max > 0 ? value / max : 0;
    if (ratio >= 0.70) return COLORS.orange;
    if (ratio >= 0.35) return COLORS.blue;
    return COLORS.green;
  }

  function markerRadius(value, max) {
    if (!max) return 7;
    const ratio = Math.sqrt(Math.max(0, value) / max);
    return Math.max(6, Math.min(22, 6 + ratio * 16));
  }

  function fallback(container, message) {
    container.innerHTML = `<div class="map-fallback"><strong>Mapa no disponible</strong><span>${escapeHtml(message)}</span></div>`;
  }

  function ensureMap(containerId) {
    const container = byId(containerId);
    if (!container) return null;
    if (!global.L) {
      fallback(container, 'No fue posible cargar Leaflet. Revisa la conexión a internet o las políticas de red corporativa.');
      return null;
    }

    if (map && lastContainerId === containerId) return map;
    if (map) {
      map.remove();
      map = null;
      markersLayer = null;
    }

    lastContainerId = containerId;
    container.innerHTML = '';
    map = global.L.map(containerId, {
      zoomControl: true,
      scrollWheelZoom: false,
      preferCanvas: true
    }).setView([-36.5, -71.2], 5);

    global.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    markersLayer = global.L.layerGroup().addTo(map);
    return map;
  }

  function render(containerId, points, options = {}) {
    const container = byId(containerId);
    if (!container) return;
    const instance = ensureMap(containerId);
    if (!instance || !markersLayer) return;

    markersLayer.clearLayers();
    const valid = (points || []).filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng));
    if (!valid.length) {
      instance.setView([-36.5, -71.2], 5);
      return;
    }

    const max = Math.max(...valid.map(point => Number(point.services) || 0), 1);
    const bounds = [];

    valid.forEach((point, index) => {
      const services = Number(point.services) || 0;
      const color = markerColor(services, max);
      const marker = global.L.circleMarker([point.lat, point.lng], {
        radius: markerRadius(services, max),
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.86,
        opacity: 1
      });

      const popup = [
        `<div class="map-popup">`,
        `<strong>${escapeHtml(point.label)}</strong>`,
        `<span><b>${services.toLocaleString('es-CL')}</b> servicios</span>`,
        `<span>${escapeHtml(point.palletsLabel || '')} pallets</span>`,
        `<span>${escapeHtml(point.saleLabel || '')} venta</span>`,
        point.approximate ? `<small>Ubicación comunal aproximada.</small>` : '',
        `</div>`
      ].join('');
      marker.bindPopup(popup, { maxWidth: 260 });

      const tooltipText = `${point.label} · ${services.toLocaleString('es-CL')}`;
      marker.bindTooltip(tooltipText, {
        permanent: index < 6,
        direction: index % 2 ? 'right' : 'left',
        offset: index % 2 ? [7, 0] : [-7, 0],
        className: 'map-point-label'
      });

      marker.on('click', () => {
        if (typeof options.onPointClick === 'function') options.onPointClick(point);
      });

      marker.addTo(markersLayer);
      bounds.push([point.lat, point.lng]);
    });

    if (bounds.length === 1) instance.setView(bounds[0], 9);
    else instance.fitBounds(bounds, { padding: [28, 28], maxZoom: 10 });

    setTimeout(() => instance.invalidateSize(), 80);
  }

  function invalidate() {
    if (map) setTimeout(() => map.invalidateSize(), 60);
  }

  global.GeoMap = { render, invalidate };
})(window);
