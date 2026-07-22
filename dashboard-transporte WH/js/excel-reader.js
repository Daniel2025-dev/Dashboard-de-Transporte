/*
 * Lector XLSX local y sin dependencias externas.
 * Lee la estructura ZIP/XML de archivos .xlsx usando APIs nativas del navegador.
 * Requiere un navegador moderno con DecompressionStream (Edge/Chrome actuales).
 */
(function (global) {
  'use strict';

  const EXPECTED_SHEET = 'Plan_Transporte';
  const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const ALIASES = {
    id: ['id'],
    requestDate: ['fecha de solicitud'],
    needDate: ['fecha de necesidad'],
    deliveryDate: ['fecha entrega tte', 'fecha de entrega tte', 'fecha entrega transporte'],
    client: ['cliente'],
    address: ['direccion', 'dirección'],
    destination: ['destino', 'comuna destino', 'comuna de destino'],
    region: ['region', 'región'],
    deliveryPoint: ['puntos de entrega', 'punto de entrega'],
    carrier: ['empresa transp', 'empresa transportista', 'empresa transporte', 'transportista'],
    orderNumber: ['n pedido', 'numero pedido', 'n° pedido'],
    dispatchGuide: ['guia de despacho', 'guía de despacho'],
    appointment: ['cita'],
    appointmentTime: ['hora cita'],
    palletsRequested: ['pallets solicitados'],
    palletsDelivered: ['pallets entregados'],
    palletsReturned: ['devolucion pallets', 'devolución pallets'],
    weight: ['peso'],
    baseSale: ['venta'],
    requiresHelper: ['exigencia peoneta'],
    helperCount: ['n peoneta', 'numero peoneta', 'n° peoneta'],
    helperSale: ['peoneta'],
    transportCost: ['costo tte', 'costo transporte'],
    helperCost: ['costo peoneta'],
    otherCosts: ['otros costos'],
    totalCost: ['costo total'],
    totalSale: ['venta total'],
    profitStored: ['margen $', 'margen pesos'],
    marginStored: ['mg', 'margen'],
    carrierInvoice: ['factura tte', 'factura transporte'],
    invoiceDate: ['fecha factura'],
    status: ['entregado rechazado', 'estado servicio', 'estado'],
    observation2: ['obs 2'],
    observation3: ['obs 3'],
    reason: ['motivo'],
    responsible: ['responsable'],
    serviceType: ['tipo de servicio', 'servicio'],
    origin: ['comuna de origen', 'origen'],
    center: ['centro', 'bodega', 'centro bodega']
  };

  const FIELD_META = {
    id: { label: 'ID', type: 'Texto', use: 'Identificador único del servicio.', calculation: 'Base para contar servicios sin duplicarlos.' },
    requestDate: { label: 'Fecha de Solicitud', type: 'Fecha', use: 'Fecha en que se solicita el transporte.', calculation: 'Respaldo cuando no existe fecha de entrega.' },
    needDate: { label: 'Fecha de necesidad', type: 'Fecha', use: 'Fecha requerida por la operación.', calculation: 'Respaldo para asignar período.' },
    deliveryDate: { label: 'Fecha_ Entrega _tte', type: 'Fecha', use: 'Fecha principal del servicio.', calculation: 'Año, mes, evolución y comparación interanual.' },
    client: { label: 'Cliente', type: 'Texto', use: 'Cliente asociado al servicio.', calculation: 'Filtros, rankings y rentabilidad por cliente.' },
    address: { label: 'Direccion', type: 'Texto', use: 'Dirección informada para el servicio.', calculation: 'Detalle y frecuencia de direcciones.' },
    destination: { label: 'Destino', type: 'Texto', use: 'Comuna o ciudad de destino.', calculation: 'Filtro y distribución geográfica.' },
    region: { label: 'Region', type: 'Categoría', use: 'Clasificación geográfica del archivo (RM/RG).', calculation: 'Filtro y participación geográfica.' },
    deliveryPoint: { label: 'Puntos de Entrega', type: 'Texto', use: 'Dirección o punto específico de entrega.', calculation: 'Detalle de destinos frecuentes.' },
    carrier: { label: 'Empresa_transp', type: 'Texto', use: 'Proveedor que ejecuta el servicio.', calculation: 'Ranking, costo y margen por transportista.' },
    orderNumber: { label: 'N° Pedido', type: 'Texto', use: 'Número de pedido del cliente.', calculation: 'Trazabilidad y detección de duplicados potenciales.' },
    dispatchGuide: { label: 'Guía de despacho', type: 'Texto', use: 'Documento de despacho.', calculation: 'Trazabilidad y duplicados potenciales.' },
    appointment: { label: 'Cita', type: 'Texto / número', use: 'Referencia de cita.', calculation: 'Detalle operativo.' },
    appointmentTime: { label: 'Hora_Cita', type: 'Hora', use: 'Hora comprometida.', calculation: 'Detalle del servicio.' },
    palletsRequested: { label: 'Pallets solicitados', type: 'Número', use: 'Pallets originalmente solicitados.', calculation: 'Respaldo si no existe cantidad entregada.' },
    palletsDelivered: { label: 'Pallets Entregados', type: 'Número', use: 'Pallets efectivamente entregados.', calculation: 'KPI Total Pallets y promedios.' },
    palletsReturned: { label: 'Devolución Pallets', type: 'Número', use: 'Diferencia entre solicitados y entregados.', calculation: 'Control de devolución.' },
    weight: { label: 'Peso', type: 'Número', use: 'Peso del servicio.', calculation: 'Peso total y promedio.' },
    baseSale: { label: 'Venta', type: 'Moneda CLP', use: 'Venta base del transporte.', calculation: 'Componente de Venta Total.' },
    requiresHelper: { label: 'Exigencia Peoneta', type: 'Categoría', use: 'Indica si se requiere peoneta.', calculation: 'Control operacional.' },
    helperCount: { label: 'N° Peoneta', type: 'Número', use: 'Cantidad de peonetas.', calculation: 'Cálculo y control del servicio adicional.' },
    helperSale: { label: 'Peoneta', type: 'Moneda CLP', use: 'Venta asociada a peoneta.', calculation: 'Componente de Venta Total.' },
    transportCost: { label: 'Costo TTE', type: 'Moneda CLP', use: 'Costo principal de transporte.', calculation: 'Componente de Costo Total.' },
    helperCost: { label: 'Costo Peoneta', type: 'Moneda CLP', use: 'Costo de peoneta.', calculation: 'Componente de Costo Total.' },
    otherCosts: { label: 'Otros Costos', type: 'Moneda CLP', use: 'Costos adicionales.', calculation: 'Componente de Costo Total.' },
    totalCost: { label: 'Costo total', type: 'Moneda CLP', use: 'Costo consolidado del servicio.', calculation: 'Costo TTE + Costo Peoneta + Otros Costos.' },
    totalSale: { label: 'Venta Total', type: 'Moneda CLP', use: 'Venta consolidada.', calculation: 'Venta + Peoneta.' },
    profitStored: { label: 'Margen $', type: 'Moneda CLP', use: 'Utilidad guardada en la planilla.', calculation: 'Se valida contra Venta Total - Costo Total.' },
    marginStored: { label: 'MG', type: 'Porcentaje', use: 'Margen guardado en la planilla.', calculation: 'Se recalcula como Utilidad / Venta Total.' },
    carrierInvoice: { label: 'Factura_tte', type: 'Texto / número', use: 'Factura del proveedor de transporte.', calculation: 'Control documental.' },
    invoiceDate: { label: 'Fecha_Factura', type: 'Fecha', use: 'Fecha de factura.', calculation: 'Control documental y calidad.' },
    status: { label: 'Entregado/Rechazado', type: 'Categoría', use: 'Resultado del servicio.', calculation: 'Filtro y distribución por estado.' },
    observation2: { label: 'OBS 2', type: 'Texto', use: 'Observación operativa.', calculation: 'Detalle.' },
    observation3: { label: 'OBS 3', type: 'Texto', use: 'Observación adicional.', calculation: 'Detalle.' },
    reason: { label: 'Motivo', type: 'Texto', use: 'Motivo asociado a rechazo o excepción.', calculation: 'Análisis de alertas.' },
    responsible: { label: 'Responsable', type: 'Texto', use: 'Responsable del registro.', calculation: 'Seguimiento operativo.' }
  };

  function normalizeHeader(value) {
    return String(value ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[°º#._-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim().toLowerCase();
  }

  function normalizeText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function upperText(value) {
    return normalizeText(value).toUpperCase();
  }

  function parseXml(text, fileName) {
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error(`No fue posible leer ${fileName}.`);
    return xml;
  }

  function getColumnLetters(reference) {
    const match = String(reference || '').match(/^([A-Z]+)/i);
    return match ? match[1].toUpperCase() : '';
  }

  function joinPath(base, target) {
    const parts = `${base}/${target}`.replace(/\\/g, '/').split('/');
    const result = [];
    parts.forEach(part => {
      if (!part || part === '.') return;
      if (part === '..') result.pop(); else result.push(part);
    });
    return result.join('/');
  }

  async function inflateRaw(data) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('El navegador no admite descompresión XLSX local. Utiliza una versión actual de Microsoft Edge o Google Chrome.');
    }
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzip(arrayBuffer, onProgress) {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    const minEOCD = Math.max(0, bytes.length - 65557);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= minEOCD; i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('El archivo no tiene una estructura XLSX/ZIP válida.');

    const totalEntries = view.getUint16(eocd + 10, true);
    const centralOffset = view.getUint32(eocd + 16, true);
    const decoder = new TextDecoder('utf-8');
    const entries = new Map();
    let pointer = centralOffset;

    for (let index = 0; index < totalEntries; index++) {
      if (view.getUint32(pointer, true) !== 0x02014b50) throw new Error('Directorio interno XLSX dañado.');
      const method = view.getUint16(pointer + 10, true);
      const compressedSize = view.getUint32(pointer + 20, true);
      const fileNameLength = view.getUint16(pointer + 28, true);
      const extraLength = view.getUint16(pointer + 30, true);
      const commentLength = view.getUint16(pointer + 32, true);
      const localOffset = view.getUint32(pointer + 42, true);
      const name = decoder.decode(bytes.slice(pointer + 46, pointer + 46 + fileNameLength));

      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error(`Entrada XLSX inválida: ${name}`);
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(start, start + compressedSize);
      let content;
      if (method === 0) content = compressed;
      else if (method === 8) content = await inflateRaw(compressed);
      else throw new Error(`Método de compresión XLSX no compatible (${method}).`);
      entries.set(name, content);

      pointer += 46 + fileNameLength + extraLength + commentLength;
      if (onProgress && index % Math.max(1, Math.floor(totalEntries / 12)) === 0) {
        onProgress(8 + Math.round((index / totalEntries) * 22), `Descomprimiendo componentes del libro (${index + 1}/${totalEntries})…`);
      }
    }
    return entries;
  }

  function textEntry(entries, name, required = true) {
    const content = entries.get(name);
    if (!content) {
      if (required) throw new Error(`No se encontró el componente interno ${name}.`);
      return '';
    }
    return new TextDecoder('utf-8').decode(content);
  }

  function readSharedStrings(entries) {
    const text = textEntry(entries, 'xl/sharedStrings.xml', false);
    if (!text) return [];
    const xml = parseXml(text, 'sharedStrings.xml');
    return Array.from(xml.getElementsByTagNameNS('*', 'si')).map(si =>
      Array.from(si.getElementsByTagNameNS('*', 't')).map(t => t.textContent || '').join('')
    );
  }

  function readCell(cell, sharedStrings) {
    const type = cell.getAttribute('t') || '';
    const valueNode = cell.getElementsByTagNameNS('*', 'v')[0];
    let value = valueNode ? valueNode.textContent : null;

    if (type === 's' && value !== null) return sharedStrings[Number(value)] ?? '';
    if (type === 'inlineStr') {
      return Array.from(cell.getElementsByTagNameNS('*', 't')).map(t => t.textContent || '').join('');
    }
    if (type === 'b') return value === '1';
    if (type === 'str' || type === 'e') return value ?? '';
    if (value === null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }

  function rowValues(row, sharedStrings) {
    const values = {};
    Array.from(row.getElementsByTagNameNS('*', 'c')).forEach(cell => {
      const col = getColumnLetters(cell.getAttribute('r'));
      if (col) values[col] = readCell(cell, sharedStrings);
    });
    return values;
  }

  function detectHeaderRow(rows, sharedStrings) {
    let best = null;
    const required = ['id', 'cliente', 'venta total', 'costo total'];
    rows.slice(0, 40).forEach(row => {
      const values = Object.values(rowValues(row, sharedStrings)).filter(v => v !== null && v !== '');
      const normalized = values.map(normalizeHeader);
      const matches = required.filter(req => normalized.includes(req)).length;
      const score = matches * 100 + Math.min(values.length, 60);
      if (!best || score > best.score) best = { row, score, values, matches };
    });
    if (!best || best.matches < 3) {
      throw new Error('No se pudo identificar la fila de encabezados. Se esperaban columnas como ID, Cliente, Venta Total y Costo total.');
    }
    return best.row;
  }

  function resolveColumns(headers) {
    const normalizedHeaders = headers.map(h => ({ original: h, normalized: normalizeHeader(h) }));
    const mapping = {};
    Object.entries(ALIASES).forEach(([field, aliases]) => {
      const found = normalizedHeaders.find(h => aliases.some(alias => h.normalized === normalizeHeader(alias)));
      mapping[field] = found ? found.original : null;
    });
    return mapping;
  }

  function excelSerialToDate(serial) {
    const numeric = Number(serial);
    if (!Number.isFinite(numeric)) return null;
    const millis = Date.UTC(1899, 11, 30) + Math.round(numeric * 86400000);
    return new Date(millis);
  }

  function parseDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'number') return excelSerialToDate(value);
    const text = normalizeText(value);
    if (!text) return null;
    if (/^\d+(\.\d+)?$/.test(text) && Number(text) > 1000) return excelSerialToDate(Number(text));

    let match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (match) {
      const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
      const date = new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[1])));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    match = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
    if (match) {
      const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function isReasonableDate(date) {
    if (!date) return false;
    const year = date.getUTCFullYear();
    return year >= 2020 && year <= new Date().getFullYear() + 3;
  }

  function parseNumber(value, percentage = false) {
    if (value === null || value === undefined || value === '') return { value: null, valid: true };
    if (typeof value === 'number') return { value, valid: Number.isFinite(value) };
    let text = normalizeText(value);
    if (!text) return { value: null, valid: true };
    const hasPercent = text.includes('%');
    text = text.replace(/[$%\s]/g, '');
    const comma = text.lastIndexOf(',');
    const dot = text.lastIndexOf('.');
    if (comma >= 0 && dot >= 0) {
      if (comma > dot) text = text.replace(/\./g, '').replace(',', '.');
      else text = text.replace(/,/g, '');
    } else if (comma >= 0) {
      const decimals = text.length - comma - 1;
      text = decimals <= 3 ? text.replace(',', '.') : text.replace(/,/g, '');
    } else if (dot >= 0) {
      const decimals = text.length - dot - 1;
      if (decimals === 3 && !percentage) text = text.replace(/\./g, '');
    }
    const numeric = Number(text);
    if (!Number.isFinite(numeric)) return { value: null, valid: false };
    return { value: hasPercent ? numeric / 100 : numeric, valid: true };
  }

  function formatTime(value) {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'number') {
      const totalMinutes = Math.round((value % 1) * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return normalizeText(value);
  }

  function getRaw(raw, mapping, field) {
    const header = mapping[field];
    return header ? raw[header] : null;
  }

  function dateIso(date) {
    return date ? date.toISOString().slice(0, 10) : '';
  }

  function normalizeRecords(rawRecords, headers, mapping) {
    const currentYear = new Date().getFullYear();
    const records = rawRecords.map((raw, index) => {
      const requestDateRaw = getRaw(raw, mapping, 'requestDate');
      const needDateRaw = getRaw(raw, mapping, 'needDate');
      const deliveryDateRaw = getRaw(raw, mapping, 'deliveryDate');
      const invoiceDateRaw = getRaw(raw, mapping, 'invoiceDate');
      const requestDate = parseDate(requestDateRaw);
      const needDate = parseDate(needDateRaw);
      const deliveryDate = parseDate(deliveryDateRaw);
      const invoiceDate = parseDate(invoiceDateRaw);
      const primaryDate = [deliveryDate, needDate, requestDate].find(isReasonableDate) || null;

      const numericFields = {};
      ['palletsRequested','palletsDelivered','palletsReturned','weight','baseSale','helperCount','helperSale','transportCost','helperCost','otherCosts','totalCost','totalSale','profitStored'].forEach(field => {
        numericFields[field] = parseNumber(getRaw(raw, mapping, field));
      });
      numericFields.marginStored = parseNumber(getRaw(raw, mapping, 'marginStored'), true);

      const id = normalizeText(getRaw(raw, mapping, 'id'));
      const client = normalizeText(getRaw(raw, mapping, 'client'));
      const carrier = normalizeText(getRaw(raw, mapping, 'carrier'));
      const address = normalizeText(getRaw(raw, mapping, 'address'));
      const destination = normalizeText(getRaw(raw, mapping, 'destination'));
      const region = normalizeText(getRaw(raw, mapping, 'region'));
      const status = normalizeText(getRaw(raw, mapping, 'status'));
      const order = normalizeText(getRaw(raw, mapping, 'orderNumber'));
      const guide = normalizeText(getRaw(raw, mapping, 'dispatchGuide'));

      const totalSale = numericFields.totalSale.value ?? ((numericFields.baseSale.value || 0) + (numericFields.helperSale.value || 0));
      const totalCost = numericFields.totalCost.value ?? ((numericFields.transportCost.value || 0) + (numericFields.helperCost.value || 0) + (numericFields.otherCosts.value || 0));
      const profit = totalSale - totalCost;
      const margin = totalSale > 0 ? profit / totalSale : 0;
      const pallets = numericFields.palletsDelivered.value ?? numericFields.palletsRequested.value ?? 0;

      const issues = [];
      const missingCore = [];
      if (!id) missingCore.push('ID');
      if (!primaryDate) missingCore.push('Fecha válida');
      if (!client) missingCore.push('Cliente');
      if (numericFields.totalSale.value === null && numericFields.baseSale.value === null) missingCore.push('Venta');
      if (numericFields.totalCost.value === null && numericFields.transportCost.value === null) missingCore.push('Costo');
      if (missingCore.length) issues.push(`Campos incompletos: ${missingCore.join(', ')}`);

      const dateValues = [
        ['Fecha de Solicitud', requestDateRaw, requestDate],
        ['Fecha de necesidad', needDateRaw, needDate],
        ['Fecha de entrega', deliveryDateRaw, deliveryDate],
        ['Fecha de factura', invoiceDateRaw, invoiceDate]
      ];
      const invalidDates = dateValues.filter(([, original, parsed]) => original !== null && original !== '' && (!parsed || !isReasonableDate(parsed)));
      if (invalidDates.length) issues.push(`Fecha(s) observada(s): ${invalidDates.map(item => item[0]).join(', ')}`);

      const invalidNumeric = Object.entries(numericFields).filter(([, item]) => !item.valid).map(([field]) => field);
      if (invalidNumeric.length) issues.push(`Valor(es) numérico(s) inválido(s): ${invalidNumeric.join(', ')}`);

      const rowNumber = raw.__rowNumber || index + 1;
      const compositeKey = [dateIso(primaryDate), upperText(client), upperText(order), upperText(guide), upperText(address)].join('|');
      const serviceKey = id ? `ID:${upperText(id)}` : `FALLBACK:${compositeKey || rowNumber}`;

      return {
        __raw: raw,
        __rowNumber: rowNumber,
        __id: id,
        __client: client,
        __carrier: carrier,
        __address: address,
        __destination: destination,
        __region: region,
        __status: status,
        __order: order,
        __guide: guide,
        __date: primaryDate,
        __requestDate: requestDate,
        __needDate: needDate,
        __deliveryDate: deliveryDate,
        __invoiceDate: invoiceDate,
        __year: primaryDate ? primaryDate.getUTCFullYear() : null,
        __month: primaryDate ? primaryDate.getUTCMonth() + 1 : null,
        __monthName: primaryDate ? MONTHS[primaryDate.getUTCMonth()] : '',
        __pallets: pallets || 0,
        __palletsRequested: numericFields.palletsRequested.value || 0,
        __palletsDelivered: numericFields.palletsDelivered.value,
        __weight: numericFields.weight.value || 0,
        __sale: totalSale || 0,
        __cost: totalCost || 0,
        __profit: profit || 0,
        __margin: margin || 0,
        __statusNormalized: upperText(status),
        __requiresHelper: upperText(getRaw(raw, mapping, 'requiresHelper')),
        __serviceKey: serviceKey,
        __compositeKey: compositeKey,
        __issues: issues,
        __valid: missingCore.length === 0 && invalidNumeric.length === 0,
        __potentialDuplicate: false,
        __duplicateId: false,
        __appointmentTime: formatTime(getRaw(raw, mapping, 'appointmentTime')),
        __currentYearAtLoad: currentYear
      };
    });

    const idCounts = new Map();
    const compositeCounts = new Map();
    records.forEach(record => {
      if (record.__id) idCounts.set(upperText(record.__id), (idCounts.get(upperText(record.__id)) || 0) + 1);
      if (record.__compositeKey.replace(/\|/g, '')) compositeCounts.set(record.__compositeKey, (compositeCounts.get(record.__compositeKey) || 0) + 1);
    });
    records.forEach(record => {
      record.__duplicateId = record.__id ? (idCounts.get(upperText(record.__id)) || 0) > 1 : false;
      record.__potentialDuplicate = (compositeCounts.get(record.__compositeKey) || 0) > 1;
      if (record.__duplicateId) record.__issues.push('ID duplicado.');
      else if (record.__potentialDuplicate) record.__issues.push('Posible duplicado por fecha, cliente, pedido, guía y dirección.');
    });

    const duplicateIdExtras = Array.from(idCounts.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const potentialDuplicateExtras = Array.from(compositeCounts.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const observedRows = records.filter(record => record.__issues.length > 0);
    const incomplete = records.filter(record => !record.__valid);
    const invalidDateRows = records.filter(record => record.__issues.some(issue => issue.startsWith('Fecha')));
    const invalidMoneyRows = records.filter(record => record.__issues.some(issue => issue.startsWith('Valor')));

    const requiredFields = ['id','deliveryDate','client','carrier','palletsDelivered','totalSale','totalCost','status'];
    const optionalRequestedFields = ['serviceType','origin','center'];
    const missingRequired = requiredFields.filter(field => !mapping[field]);
    const missingOptional = optionalRequestedFields.filter(field => !mapping[field]);

    const dictionary = headers.map(header => {
      const field = Object.keys(mapping).find(key => mapping[key] === header);
      const meta = field ? FIELD_META[field] : null;
      return {
        column: header,
        field: field || 'Sin clasificación',
        type: meta?.type || inferType(header),
        use: meta?.use || 'Disponible en la tabla de detalle.',
        calculation: meta?.calculation || 'Sin cálculo específico configurado.'
      };
    });

    return {
      records,
      quality: {
        processed: records.length,
        valid: records.filter(record => record.__valid).length,
        observed: observedRows.length,
        incomplete: incomplete.length,
        invalidDates: invalidDateRows.length,
        invalidMonetary: invalidMoneyRows.length,
        duplicateIds: duplicateIdExtras,
        potentialDuplicates: potentialDuplicateExtras,
        missingRequired,
        missingOptional,
        columnsFound: headers.length
      },
      dictionary
    };
  }

  function inferType(header) {
    const normalized = normalizeHeader(header);
    if (normalized.includes('fecha')) return 'Fecha';
    if (normalized.includes('costo') || normalized.includes('venta') || normalized.includes('margen $') || normalized === 'peoneta') return 'Moneda CLP';
    if (normalized === 'mg' || normalized.includes('%')) return 'Porcentaje';
    if (normalized.includes('pallet') || normalized.includes('peso') || normalized.startsWith('n ')) return 'Número';
    return 'Texto';
  }

  function extractSheet(entries, workbookXml, relsXml, sharedStrings, onProgress) {
    const workbook = parseXml(workbookXml, 'workbook.xml');
    const rels = parseXml(relsXml, 'workbook.xml.rels');
    const relationships = new Map();
    Array.from(rels.getElementsByTagNameNS('*', 'Relationship')).forEach(rel => {
      relationships.set(rel.getAttribute('Id'), rel.getAttribute('Target'));
    });

    const sheetNodes = Array.from(workbook.getElementsByTagNameNS('*', 'sheet'));
    const sheetNames = sheetNodes.map(sheet => sheet.getAttribute('name') || '');
    const targetSheet = sheetNodes.find(sheet => normalizeHeader(sheet.getAttribute('name')) === normalizeHeader(EXPECTED_SHEET));
    if (!targetSheet) {
      const error = new Error(`No se encontró la hoja “${EXPECTED_SHEET}”. Hojas detectadas: ${sheetNames.join(', ') || 'ninguna'}.`);
      error.sheetNames = sheetNames;
      throw error;
    }

    const relId = targetSheet.getAttributeNS(REL_NS, 'id') || targetSheet.getAttribute('r:id');
    const target = relationships.get(relId);
    if (!target) throw new Error(`No se pudo resolver la hoja ${EXPECTED_SHEET}.`);
    const sheetPath = target.startsWith('/') ? target.replace(/^\//, '') : joinPath('xl', target);
    onProgress?.(40, `Leyendo la hoja ${EXPECTED_SHEET}…`);
    const sheetXml = parseXml(textEntry(entries, sheetPath), sheetPath);
    const rows = Array.from(sheetXml.getElementsByTagNameNS('*', 'row'));
    const headerRow = detectHeaderRow(rows, sharedStrings);
    const headerRowNumber = Number(headerRow.getAttribute('r')) || 1;
    const headerCells = rowValues(headerRow, sharedStrings);
    const headerColumns = Object.keys(headerCells).sort((a, b) => columnToNumber(a) - columnToNumber(b));
    const headers = headerColumns.map(col => normalizeText(headerCells[col])).filter(Boolean);
    const mapping = resolveColumns(headers);

    onProgress?.(55, `Procesando ${Math.max(0, rows.length - headerRowNumber)} filas…`);
    const rawRecords = [];
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = Number(row.getAttribute('r')) || 0;
      if (rowNumber <= headerRowNumber) continue;
      const values = rowValues(row, sharedStrings);
      const raw = { __rowNumber: rowNumber };
      let hasContent = false;
      headerColumns.forEach(col => {
        const header = normalizeText(headerCells[col]);
        if (!header) return;
        const value = Object.prototype.hasOwnProperty.call(values, col) ? values[col] : null;
        raw[header] = value;
        if (value !== null && value !== '') hasContent = true;
      });
      if (hasContent) rawRecords.push(raw);
      if (onProgress && index > 0 && index % Math.max(100, Math.floor(rows.length / 10)) === 0) {
        onProgress(55 + Math.round((index / rows.length) * 25), `Normalizando filas (${index}/${rows.length})…`);
      }
    }

    const normalized = normalizeRecords(rawRecords, headers, mapping);
    return {
      ...normalized,
      sheetNames,
      sheetName: targetSheet.getAttribute('name'),
      headerRow: headerRowNumber,
      headers,
      mapping
    };
  }

  function columnToNumber(column) {
    return String(column).split('').reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0);
  }

  async function readArrayBuffer(arrayBuffer, fileName = 'Archivo Excel', onProgress) {
    onProgress?.(3, 'Validando archivo…');
    if (!arrayBuffer || arrayBuffer.byteLength < 100) throw new Error('El archivo está vacío o no pudo ser leído.');
    const entries = await unzip(arrayBuffer, onProgress);
    onProgress?.(32, 'Leyendo estructura del libro…');
    const workbookXml = textEntry(entries, 'xl/workbook.xml');
    const relsXml = textEntry(entries, 'xl/_rels/workbook.xml.rels');
    const sharedStrings = readSharedStrings(entries);
    const result = extractSheet(entries, workbookXml, relsXml, sharedStrings, onProgress);
    onProgress?.(94, 'Finalizando validaciones…');
    result.fileName = fileName;
    result.loadedAt = new Date();
    onProgress?.(100, 'Archivo procesado correctamente.');
    return result;
  }

  async function readFile(file, onProgress) {
    if (!file) throw new Error('No se seleccionó un archivo.');
    if (!/\.xlsx$/i.test(file.name)) throw new Error('Selecciona un archivo con extensión .xlsx.');
    const buffer = await file.arrayBuffer();
    const result = await readArrayBuffer(buffer, file.name, onProgress);
    result.lastModified = file.lastModified ? new Date(file.lastModified) : new Date();
    return result;
  }

  global.ExcelReader = {
    EXPECTED_SHEET,
    MONTHS,
    FIELD_META,
    normalizeHeader,
    normalizeText,
    upperText,
    parseNumber,
    parseDate,
    isReasonableDate,
    readFile,
    readArrayBuffer
  };
})(window);
