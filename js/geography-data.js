(function (global) {
  'use strict';

  /*
   * Coordenadas de referencia para comunas/ciudades chilenas.
   * Fuente base: dataset público "Latitud - Longitud Chile.csv"
   * https://github.com/altazor-1967/Comunas-de-Chile
   *
   * Las coordenadas representan el centro de la comuna/ciudad, NO la dirección
   * exacta del punto de entrega. Esto permite visualizar concentración geográfica
   * sin enviar las direcciones del Excel a un servicio de geocodificación.
   */

  function normalize(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[._,/\\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const PLACES = {
    'ANTOFAGASTA': { lat: -23.6508, lng: -70.3950 },
    'BUIN': { lat: -33.7278, lng: -70.7389 },
    'CALAMA': { lat: -22.4739, lng: -68.9239 },
    'CASTRO': { lat: -42.4778, lng: -73.7789 },
    'CERRILLOS': { lat: -33.5000, lng: -70.7167 },
    'CHILLAN': { lat: -36.6008, lng: -72.1089 },
    'CHILLAN VIEJO': { lat: -36.6328, lng: -72.1400 },
    'COLINA': { lat: -33.1939, lng: -70.6678 },
    'CONCEPCION': { lat: -36.8150, lng: -73.0289 },
    'CONCHALI': { lat: -33.3800, lng: -70.6750 },
    'COPIAPO': { lat: -27.3750, lng: -70.3289 },
    'COYHAIQUE': { lat: -45.5639, lng: -72.0650 },
    'CURICO': { lat: -34.9758, lng: -71.2239 },
    'ESTACION CENTRAL': { lat: -33.4589, lng: -70.6989 },
    'HUECHURABA': { lat: -33.3678, lng: -70.6339 },
    'LA CISTERNA': { lat: -33.5289, lng: -70.6628 },
    'LA PINTANA': { lat: -33.5828, lng: -70.6339 },
    'LA REINA': { lat: -33.4428, lng: -70.5319 },
    'LA SERENA': { lat: -29.9069, lng: -71.2469 },
    'LAMPA': { lat: -33.2858, lng: -70.8778 },
    'LAS CONDES': { lat: -33.4167, lng: -70.5833 },
    'LO BARNECHEA': { lat: -33.3500, lng: -70.5167 },
    'LO ESPEJO': { lat: -33.5219, lng: -70.6869 },
    'LOS ANGELES': { lat: -36.9439, lng: -72.3508 },
    'MACUL': { lat: -33.4869, lng: -70.6039 },
    'MAIPU': { lat: -33.5167, lng: -70.7667 },
    'NUNOA': { lat: -33.4539, lng: -70.6039 },
    'OSORNO': { lat: -40.5739, lng: -73.1258 },
    'OVALLE': { lat: -30.5989, lng: -71.1889 },
    'PEDRO AGUIRRE CERDA': { lat: -33.4661, lng: -70.6336 },
    'PENALOLEN': { lat: -33.4861, lng: -70.5333 },
    'PROVIDENCIA': { lat: -33.4350, lng: -70.6158 },
    'PUDAHUEL': { lat: -33.4333, lng: -70.7167 },
    'PUENTE ALTO': { lat: -33.6158, lng: -70.5700 },
    'PUERTO MONTT': { lat: -41.4539, lng: -72.9928 },
    'PUNTA ARENAS': { lat: -53.1478, lng: -70.9069 },
    'QUILICURA': { lat: -33.3608, lng: -70.7289 },
    'QUINTA NORMAL': { lat: -33.4269, lng: -70.6989 },
    'RANCAGUA': { lat: -34.1619, lng: -70.7408 },
    'RECOLETA': { lat: -33.4058, lng: -70.6400 },
    'RENCA': { lat: -33.3978, lng: -70.7228 },
    'RIO NEGRO': { lat: -40.7833, lng: -73.2333, approximate: true },
    'SAN BERNARDO': { lat: -33.5819, lng: -70.6869 },
    'SAN FELIPE': { lat: -32.7500, lng: -70.7128 },
    'SAN FERNANDO': { lat: -34.5839, lng: -70.9869 },
    'SAN JOAQUIN': { lat: -33.4908, lng: -70.6278 },
    'SAN MIGUEL': { lat: -33.4858, lng: -70.6494 },
    'SAN PEDRO DE LA PAZ': { lat: -36.8639, lng: -73.1078 },
    'SANTIAGO': { lat: -33.4372, lng: -70.6572 },
    'TALCA': { lat: -35.4228, lng: -71.6569 },
    'TEMUCO': { lat: -38.7269, lng: -72.5989 },
    'VALDIVIA': { lat: -39.8142, lng: -73.2458 },
    'VALPARAISO': { lat: -33.0333, lng: -71.6667 },
    'VINA DEL MAR': { lat: -33.0250, lng: -71.5150 },
    'VITACURA': { lat: -33.4000, lng: -70.6000 }
  };

  const ALIASES = {
    'STGO CENTRO': 'SANTIAGO',
    'SANTIAGO CENTRO': 'SANTIAGO',
    'STGO': 'SANTIAGO',
    'LINDEROS': 'BUIN'
  };

  function resolve(name) {
    const original = String(name || '').trim();
    const normalized = normalize(original);
    const key = ALIASES[normalized] || normalized;
    const place = PLACES[key];
    if (!place) return null;
    return {
      ...place,
      key,
      sourceName: original,
      approximate: Boolean(place.approximate || ALIASES[normalized])
    };
  }

  global.GeographyData = { normalize, resolve, PLACES, ALIASES };
})(window);
