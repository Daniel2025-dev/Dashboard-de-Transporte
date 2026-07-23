/*
 * Inicio y coordinación general del Dashboard de Transporte.
 *
 * La carga automática funciona con archivos publicados desde la carpeta /data.
 * Como un navegador no puede enumerar libremente una carpeta, se utiliza:
 *   1. data/config.json, cuando está disponible.
 *   2. Una lista conocida de nombres alternativos.
 *   3. La carga manual como respaldo.
 */
(function (global) {
  'use strict';

  const state = {
    dataset: null,
    currentRecords: [],
    previousRecords: [],
    detailTable: null,
    loading: false
  };

  const AUTO_LOAD_SETTINGS = Object.freeze({
    configPath: 'data/config.json',
    expectedSheet: 'Plan_Transporte',
    candidateFileNames: [
      'Planilla planificación diaria Transporte_OV.xlsx',
      'Planilla planificación diaria Transporte_OV (1).xlsx',
      'Planilla planificación diaria Transporte_OV_actualizada.xlsx',
      'Planilla planificación diaria Transporte.xlsx'
    ]
  });

  const byId = id => document.getElementById(id);

  function setLoading(visible, percent = 8, message = 'Leyendo la hoja Plan_Transporte…', title = 'Procesando archivo Excel') {
    const overlay = byId('loadingOverlay');
    if (!overlay) return;
    overlay.hidden = !visible;
    byId('loadingTitle').textContent = title;
    byId('loadingMessage').textContent = message;
    byId('loadingProgress').style.width = `${Math.max(3, Math.min(100, Number(percent) || 0))}%`;
    state.loading = visible;
  }

  function progress(percent, message) {
    setLoading(true, percent, message);
  }

  function toast(message, type = '') {
    const container = byId('toastContainer');
    if (!container) return;
    const item = document.createElement('div');
    item.className = `toast ${type}`.trim();
    item.textContent = message;
    container.appendChild(item);
    setTimeout(() => item.remove(), 5200);
  }

  function formatDateTime(date) {
    const value = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(value);
  }

  function setReadyUi(dataset, source) {
    byId('emptyState').hidden = true;
    byId('dashboardContent').hidden = false;
    byId('loadedFileName').textContent = dataset.fileName || 'Archivo Excel cargado';

    const updateText = `Actualizado: ${formatDateTime(dataset.lastModified || dataset.loadedAt)}`;
    const sourceText = source === 'data' ? ' · Carga automática desde data' : '';
    byId('lastUpdateText').textContent = `${updateText}${sourceText}`;
    byId('lastUpdateText').title = source === 'data'
      ? 'Planilla cargada automáticamente desde la carpeta data.'
      : updateText;

    byId('processedRowsBadge').textContent = `${dataset.quality.processed.toLocaleString('es-CL')} registros`;
    byId('fileStatusDot').classList.remove('error');
    byId('fileStatusDot').classList.add('ready');
    ['resetFiltersButton','resetFiltersInlineButton','exportGlobalButton','qualityButton'].forEach(id => {
      const element = byId(id);
      if (element) element.disabled = false;
    });
  }

  function showManualLoadFallback(message) {
    if (state.dataset) return;

    byId('emptyState').hidden = false;
    byId('dashboardContent').hidden = true;
    byId('loadedFileName').textContent = 'Sin archivo cargado';
    byId('lastUpdateText').textContent = 'Carga la planilla para comenzar';
    byId('fileStatusDot').classList.remove('ready', 'error');

    const autoLoadMessage = byId('autoLoadMessage');
    if (autoLoadMessage) {
      autoLoadMessage.textContent = message || 'No se encontró una planilla válida en la carpeta data. Puedes cargarla manualmente.';
    }
  }

  function renderFromFilters(filters) {
    if (!state.dataset) return;
    const selected = filters || global.Filters.getValues();
    const currentRecords = global.Filters.apply(state.dataset.records, selected);
    const previousFilter = global.Filters.previousPeriodFilters(selected);
    const previousRecords = previousFilter ? global.Filters.apply(state.dataset.records, previousFilter) : null;
    state.currentRecords = currentRecords;
    state.previousRecords = previousRecords || [];
    global.Dashboard.render({
      currentRecords,
      previousRecords,
      filters: selected,
      dataset: state.dataset
    });
  }

  function requestFilter(key, value) {
    global.Filters.setFilter(key, value, true);
  }

  function configureTable(dataset) {
    if (!state.detailTable) {
      state.detailTable = new global.TableModule.TransportTable({
        containerId: 'detailTable',
        paginationId: 'detailPagination',
        searchInputId: 'detailSearchInput',
        pageSizeId: 'detailPageSize',
        columnChooserId: 'columnChooser',
        columnChooserButtonId: 'columnChooserButton',
        exportButtonId: 'exportDetailButton',
        onRowClick: record => global.Dashboard.showRecord(record)
      });
    }
    state.detailTable.configure(dataset.headers, dataset.dictionary);
  }

  async function acceptDataset(dataset, options = {}) {
    const source = options.source || 'manual';
    dataset.loadSource = source;
    state.dataset = dataset;

    configureTable(dataset);
    global.Dashboard.initialize(dataset, requestFilter, state.detailTable);
    const initialFilters = global.Filters.initialize(dataset.records, renderFromFilters);
    setReadyUi(dataset, source);
    renderFromFilters(initialFilters);
    setLoading(false);

    const warnings = dataset.quality.observed;
    if (source === 'data') {
      toast('Planilla cargada automáticamente desde la carpeta data.', 'success');
      if (warnings) {
        toast(`${warnings.toLocaleString('es-CL')} registros presentan observaciones. Revisa “Calidad de datos”.`, 'warning');
      }
      return;
    }

    toast(
      `${dataset.quality.processed.toLocaleString('es-CL')} registros procesados${warnings ? `; ${warnings.toLocaleString('es-CL')} con observaciones` : ''}.`,
      warnings ? 'warning' : 'success'
    );
  }

  async function loadFile(file) {
    if (state.loading || !file) return;
    setLoading(true, 5, 'Abriendo el archivo seleccionado…');

    try {
      const dataset = await global.ExcelReader.readFile(file, progress);
      await acceptDataset(dataset, { source: 'manual' });
    } catch (error) {
      console.error('[Carga manual] No se pudo procesar el archivo seleccionado.', error);
      setLoading(false);

      const message = error?.message || 'No se pudo procesar el archivo. Selecciona otra planilla con extensión .xlsx.';
      toast(message, 'error');

      if (!state.dataset) {
        showManualLoadFallback(message);
      }
    }
  }

  function isSafeExcelFileName(fileName) {
    if (typeof fileName !== 'string') return false;
    const trimmed = fileName.trim();
    return Boolean(trimmed)
      && /\.xlsx$/i.test(trimmed)
      && !trimmed.includes('/')
      && !trimmed.includes('\\')
      && !trimmed.includes('..');
  }

  function uniqueFileNames(fileNames) {
    const seen = new Set();
    return fileNames
      .map(name => typeof name === 'string' ? name.trim() : '')
      .filter(isSafeExcelFileName)
      .filter(name => {
        const key = name.toLocaleLowerCase('es-CL');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function buildDataUrl(fileName) {
    return `data/${encodeURIComponent(fileName)}?v=${Date.now()}`;
  }

  async function readAutoLoadConfig() {
    try {
      const response = await fetch(`${AUTO_LOAD_SETTINGS.configPath}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        console.info(`[Carga automática] No se encontró ${AUTO_LOAD_SETTINGS.configPath} (${response.status}). Se utilizará la lista interna de nombres.`);
        return null;
      }

      const config = await response.json();
      if (!config || typeof config !== 'object') {
        console.warn('[Carga automática] data/config.json no contiene un objeto JSON válido.');
        return null;
      }

      if (config.hoja && global.ExcelReader.normalizeHeader(config.hoja) !== global.ExcelReader.normalizeHeader(AUTO_LOAD_SETTINGS.expectedSheet)) {
        console.warn(`[Carga automática] La hoja configurada “${config.hoja}” no coincide con “${AUTO_LOAD_SETTINGS.expectedSheet}”. Se mantendrá la hoja requerida por el dashboard.`);
      }

      return config;
    } catch (error) {
      console.warn('[Carga automática] No fue posible leer data/config.json. Se utilizará la configuración interna.', error);
      return null;
    }
  }

  async function getAutoLoadCandidates() {
    const config = await readAutoLoadConfig();
    const configuredAlternatives = Array.isArray(config?.archivosAlternativos)
      ? config.archivosAlternativos
      : [];

    return uniqueFileNames([
      config?.archivoExcel,
      ...configuredAlternatives,
      ...AUTO_LOAD_SETTINGS.candidateFileNames
    ]);
  }

  async function readWorkbookFromData(fileName, candidateIndex, totalCandidates) {
    const progressBase = 5 + Math.round((candidateIndex / Math.max(totalCandidates, 1)) * 18);
    setLoading(true, progressBase, `Buscando “${fileName}” en la carpeta data…`, 'Buscando planilla de transporte');

    const response = await fetch(buildDataUrl(fileName), { cache: 'no-store' });
    if (!response.ok) {
      const error = new Error(`El archivo “${fileName}” no está disponible (${response.status}).`);
      error.httpStatus = response.status;
      throw error;
    }

    const buffer = await response.arrayBuffer();
    const dataset = await global.ExcelReader.readArrayBuffer(buffer, fileName, progress);
    const lastModifiedHeader = response.headers.get('last-modified');
    dataset.lastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : new Date();
    return dataset;
  }

  function base64ToArrayBuffer(base64) {
    if (typeof base64 !== 'string' || !base64.trim()) {
      throw new Error('La copia local de la planilla está vacía.');
    }

    const binary = global.atob(base64.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes.buffer;
  }

  async function loadEmbeddedWorkbook() {
    const bundle = global.TRANSPORT_LOCAL_BUNDLE;
    if (!bundle || typeof bundle !== 'object' || !bundle.base64) {
      console.info('[Carga local] No existe data/planilla-local.js o no contiene una planilla preparada.');
      return false;
    }

    try {
      setLoading(true, 6, 'Leyendo la copia local de la planilla…', 'Cargando planilla de transporte');
      const buffer = base64ToArrayBuffer(bundle.base64);
      const fileName = bundle.fileName || 'Planilla planificación diaria Transporte_OV.xlsx';
      const dataset = await global.ExcelReader.readArrayBuffer(buffer, fileName, progress);

      const lastModified = bundle.lastModified ? new Date(bundle.lastModified) : null;
      dataset.lastModified = lastModified && !Number.isNaN(lastModified.getTime())
        ? lastModified
        : new Date();
      dataset.bundleGeneratedAt = bundle.generatedAt || null;

      await acceptDataset(dataset, { source: 'data' });
      console.info('[Carga local] Planilla cargada desde data/planilla-local.js.');
      return true;
    } catch (error) {
      setLoading(false);
      console.warn('[Carga local] No fue posible utilizar la copia local preparada.', error);
      return false;
    }
  }

  async function autoLoadWorkbookFromData() {
    const message = byId('autoLoadMessage');

    // Al abrir index.html directamente (file://), el navegador no permite usar fetch()
    // para leer un Excel vecino. Como solución, se utiliza data/planilla-local.js,
    // generado por el iniciador o por actualizar_datos_locales.cmd.
    if (location.protocol === 'file:') {
      const loadedFromBundle = await loadEmbeddedWorkbook();
      if (loadedFromBundle) return true;

      console.info('[Carga automática] No fue posible cargar una copia local preparada al abrir con file://.');
      showManualLoadFallback('No existe una copia local preparada. Ejecuta “iniciar_dashboard.bat” o “actualizar_datos_locales.cmd”, o carga la planilla manualmente.');
      return false;
    }

    if (message) message.textContent = 'Buscando automáticamente una planilla válida en la carpeta data…';
    setLoading(true, 4, 'Revisando la configuración de la carpeta data…', 'Buscando planilla de transporte');

    const candidates = await getAutoLoadCandidates();
    const technicalErrors = [];

    for (let index = 0; index < candidates.length; index += 1) {
      const fileName = candidates[index];
      try {
        const dataset = await readWorkbookFromData(fileName, index, candidates.length);
        await acceptDataset(dataset, { source: 'data' });
        return true;
      } catch (error) {
        technicalErrors.push({ fileName, error });
        const logMethod = error?.httpStatus === 404 ? 'info' : 'warn';
        console[logMethod](`[Carga automática] No se pudo utilizar “${fileName}”.`, error);
      }
    }

    setLoading(false);
    console.warn('[Carga automática] No se encontró una planilla válida mediante HTTP en /data.', technicalErrors);

    // Respaldo adicional: utiliza la copia local preparada, si existe.
    const loadedFromBundle = await loadEmbeddedWorkbook();
    if (loadedFromBundle) {
      toast('Se utilizó la copia local preparada de la planilla.', 'warning');
      return true;
    }

    console.warn('[Carga automática] Se habilitó la carga manual porque no existe una fuente de datos válida.');
    showManualLoadFallback('No se encontró una planilla válida en la carpeta data. Puedes cargarla manualmente.');
    return false;
  }

  function exportCurrentRecords() {
    if (!state.dataset) return;
    const suffix = new Date().toISOString().slice(0, 10);
    global.TableModule.exportRecords(
      state.currentRecords,
      state.dataset.headers,
      state.dataset.dictionary,
      `dashboard_transporte_filtrado_${suffix}.csv`
    );
    toast('Se exportaron los registros que cumplen los filtros activos.', 'success');
  }

  function resetFilters() {
    if (!state.dataset) return;
    global.Filters.reset(true);
    toast('Los filtros fueron restablecidos.', 'success');
  }

  function closeModal(id) {
    const modal = byId(id);
    if (modal) modal.hidden = true;
  }

  function bindEvents() {
    const fileInput = byId('fileInput');
    fileInput?.addEventListener('change', event => {
      const [file] = event.target.files || [];
      loadFile(file);
      event.target.value = '';
    });

    const dropZone = byId('dropZone');
    ['dragenter','dragover'].forEach(type => dropZone?.addEventListener(type, event => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.add('dragging');
    }));
    ['dragleave','drop'].forEach(type => dropZone?.addEventListener(type, event => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove('dragging');
    }));
    dropZone?.addEventListener('drop', event => {
      const file = Array.from(event.dataTransfer?.files || []).find(item => /\.xlsx$/i.test(item.name));
      if (file) loadFile(file);
      else toast('Arrastra un archivo Excel con extensión .xlsx.', 'error');
    });
    dropZone?.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput?.click();
      }
    });

    document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => global.Dashboard.showView(button.dataset.view)));
    byId('resetFiltersButton')?.addEventListener('click', resetFilters);
    byId('resetFiltersInlineButton')?.addEventListener('click', resetFilters);
    byId('exportGlobalButton')?.addEventListener('click', exportCurrentRecords);
    byId('qualityButton')?.addEventListener('click', () => {
      if (state.dataset) {
        global.Dashboard.renderQuality();
        byId('qualityModal').hidden = false;
      }
    });

    document.querySelectorAll('[data-download-chart]').forEach(button => button.addEventListener('click', () => {
      const chartId = button.dataset.downloadChart;
      global.Charts.download(chartId, `${chartId}_${new Date().toISOString().slice(0,10)}.png`);
    }));

    document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.closeModal)));
    document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', event => {
      if (event.target === modal) modal.hidden = true;
    }));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      document.querySelectorAll('.modal:not([hidden])').forEach(modal => {
        modal.hidden = true;
      });
    });
  }

  function checkBrowserSupport() {
    if (!('DecompressionStream' in global)) {
      const message = 'Este navegador no permite leer archivos XLSX localmente. Usa una versión reciente de Microsoft Edge o Google Chrome.';
      byId('autoLoadMessage').textContent = message;
      toast('Navegador no compatible. Usa Microsoft Edge o Google Chrome actualizado.', 'error');
      return false;
    }
    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    if (checkBrowserSupport()) {
      autoLoadWorkbookFromData();
    }
  });
})(window);
