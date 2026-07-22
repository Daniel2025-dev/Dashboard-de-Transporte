# Código completo del proyecto corregido

`data/planilla-local.js` no se reproduce aquí porque es un archivo generado de aproximadamente 11 MB que contiene el Excel codificado. Se regenera ejecutando `actualizar_datos_locales.cmd`.

## `index.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Dashboard local para analizar la planificación diaria de transporte de Warehousing Chile.">
  <title>Dashboard de Transporte | Warehousing</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="app" class="app-shell">
    <header class="topbar">
      <div class="brand-block">
        <img src="assets/images/logo-warehousing.png" alt="Warehousing Operador Logístico" class="brand-logo">
        <div>
          <h1>Dashboard de Transporte</h1>
          <p>Control operativo, comercial y financiero</p>
        </div>
      </div>

      <div class="file-status" aria-live="polite">
        <span class="status-dot" id="fileStatusDot"></span>
        <div>
          <strong id="loadedFileName">Sin archivo cargado</strong>
          <small id="lastUpdateText">Carga la planilla para comenzar</small>
        </div>
      </div>

      <div class="top-actions">
        <label class="btn btn-primary" for="fileInput" title="Cargar o reemplazar archivo Excel">
          <span aria-hidden="true">↥</span> Cargar Excel
          <input id="fileInput" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
        </label>
        <button class="btn btn-secondary" id="resetFiltersButton" type="button" disabled>
          <span aria-hidden="true">↺</span> Restablecer filtros
        </button>
        <button class="btn btn-secondary" id="exportGlobalButton" type="button" disabled>
          <span aria-hidden="true">⇩</span> Exportar
        </button>
        <button class="btn btn-secondary" id="qualityButton" type="button" disabled>
          <span aria-hidden="true">✓</span> Calidad de datos
        </button>
      </div>
    </header>

    <div class="privacy-banner">
      <span aria-hidden="true">🔒</span>
      <strong>Privacidad:</strong> Los datos se procesan localmente y no se cargan a servidores externos.
    </div>

    <div class="main-layout">
      <aside class="sidebar" aria-label="Vistas del dashboard">
        <button class="nav-item active" data-view="summary"><span>▦</span> Resumen Ejecutivo</button>
        <button class="nav-item" data-view="services"><span>▤</span> Servicios</button>
        <button class="nav-item" data-view="clients"><span>◉</span> Clientes</button>
        <button class="nav-item" data-view="carriers"><span>▰</span> Empresas de Transporte</button>
        <button class="nav-item" data-view="geography"><span>⌖</span> Distribución Geográfica</button>
        <button class="nav-item" data-view="finance"><span>$</span> Costos y Ventas</button>
        <button class="nav-item" data-view="detail"><span>≣</span> Detalle de Registros</button>
        <div class="sidebar-footer">
          <small>Hoja esperada</small>
          <strong>Plan_Transporte</strong>
          <span id="processedRowsBadge">0 registros</span>
        </div>
      </aside>

      <main class="main-content">
        <section class="filters-panel" aria-label="Filtros interactivos">
          <div class="filter-field">
            <label for="filterYear">Año</label>
            <select id="filterYear" disabled><option value="">Todos</option></select>
          </div>
          <div class="filter-field">
            <label for="filterMonth">Mes</label>
            <select id="filterMonth" disabled>
              <option value="">Todos</option>
              <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
              <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
              <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
              <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
            </select>
          </div>
          <div class="filter-field date-field">
            <label for="filterDateFrom">Desde</label>
            <input id="filterDateFrom" type="date" disabled>
          </div>
          <div class="filter-field date-field">
            <label for="filterDateTo">Hasta</label>
            <input id="filterDateTo" type="date" disabled>
          </div>
          <div class="filter-field wide">
            <label for="filterClient">Cliente</label>
            <select id="filterClient" disabled><option value="">Todos</option></select>
          </div>
          <div class="filter-field wide">
            <label for="filterCarrier">Empresa transportista</label>
            <select id="filterCarrier" disabled><option value="">Todas</option></select>
          </div>
          <div class="filter-field">
            <label for="filterStatus">Estado</label>
            <select id="filterStatus" disabled><option value="">Todos</option></select>
          </div>
          <div class="filter-field">
            <label for="filterDestination">Comuna / destino</label>
            <select id="filterDestination" disabled><option value="">Todos</option></select>
          </div>
          <div class="filter-field">
            <label for="filterRegion">Región</label>
            <select id="filterRegion" disabled><option value="">Todas</option></select>
          </div>
          <div class="filter-field missing-field" title="La planilla no contiene una columna identificable de tipo de servicio.">
            <label for="filterServiceType">Tipo de servicio</label>
            <select id="filterServiceType" disabled><option>No disponible</option></select>
          </div>
          <div class="filter-field missing-field" title="La planilla no contiene una columna de comuna de origen.">
            <label for="filterOrigin">Comuna de origen</label>
            <select id="filterOrigin" disabled><option>No disponible</option></select>
          </div>
          <div class="filter-field missing-field" title="La planilla no contiene una columna identificable de centro o bodega.">
            <label for="filterCenter">Centro / bodega</label>
            <select id="filterCenter" disabled><option>No disponible</option></select>
          </div>
          <button class="btn btn-accent compact" id="resetFiltersInlineButton" type="button" disabled>Restablecer filtros</button>
        </section>

        <section id="emptyState" class="empty-state">
          <div id="dropZone" class="drop-zone" tabindex="0" role="button" aria-label="Arrastra o selecciona el archivo Excel">
            <div class="drop-icon">▣</div>
            <h2>Carga la planilla de transporte</h2>
            <p>Arrastra aquí el archivo <strong>Planilla planificación diaria Transporte_OV.xlsx</strong> o selecciónalo desde tu computador.</p>
            <label class="btn btn-primary" for="fileInput">Seleccionar archivo Excel</label>
            <small>La aplicación buscará automáticamente la hoja <strong>Plan_Transporte</strong>.</small>
          </div>
          <div id="autoLoadMessage" class="auto-load-message">Buscando automáticamente una planilla válida en la carpeta data…</div>
        </section>

        <div id="dashboardContent" hidden>
          <section id="view-summary" class="dashboard-view active" data-view-panel="summary">
            <div class="section-heading">
              <div><span class="eyebrow">Vista principal</span><h2>Resumen Ejecutivo</h2></div>
              <div class="period-label" id="summaryPeriodLabel"></div>
            </div>
            <div id="summaryKpis" class="kpi-grid"></div>

            <div class="content-grid two-columns">
              <article class="card chart-card">
                <div class="card-header"><div><h3>Ventas, costos, utilidad y margen</h3><p>Evolución mensual del período seleccionado</p></div><button class="icon-btn" data-download-chart="financialSummaryChart" title="Descargar gráfico">⇩</button></div>
                <canvas id="financialSummaryChart" class="chart-canvas" height="330"></canvas>
              </article>
              <article class="card chart-card">
                <div class="card-header"><div><h3>Servicios y pallets por mes</h3><p>Cantidad de servicios únicos y pallets entregados</p></div><button class="icon-btn" data-download-chart="servicePalletChart" title="Descargar gráfico">⇩</button></div>
                <canvas id="servicePalletChart" class="chart-canvas" height="330"></canvas>
              </article>
            </div>

            <div class="content-grid two-columns">
              <article class="card">
                <div class="card-header"><div><h3>Comparación mensual</h3><p>Período actual frente al año anterior</p></div></div>
                <div id="monthlyComparisonTable" class="table-wrap compact-table"></div>
              </article>
              <article class="card chart-card">
                <div class="card-header"><div><h3>Variación anual de ventas</h3><p>Mismo mes del año actual y anterior</p></div><button class="icon-btn" data-download-chart="annualSalesChart" title="Descargar gráfico">⇩</button></div>
                <canvas id="annualSalesChart" class="chart-canvas" height="330"></canvas>
              </article>
            </div>

            <div class="content-grid three-columns">
              <article class="card chart-card"><div class="card-header"><div><h3>Ranking de clientes</h3><p>Por venta total</p></div><button class="icon-btn" data-download-chart="topClientsChart" title="Descargar gráfico">⇩</button></div><canvas id="topClientsChart" class="chart-canvas" height="360"></canvas></article>
              <article class="card"><div class="card-header"><div><h3>Empresas transportistas</h3><p>Participación y rentabilidad</p></div></div><div id="topCarriersTable" class="table-wrap"></div></article>
              <article class="card"><div class="card-header"><div><h3>Registros recientes</h3><p>Últimos servicios según fecha de transporte</p></div></div><div id="recentRecordsTable" class="table-wrap"></div></article>
            </div>
          </section>

          <section id="view-services" class="dashboard-view" data-view-panel="services">
            <div class="section-heading"><div><span class="eyebrow">Control operacional</span><h2>Servicios</h2></div></div>
            <div id="serviceKpis" class="kpi-grid"></div>
            <div class="content-grid two-columns">
              <article class="card chart-card"><div class="card-header"><div><h3>Servicios y pallets</h3><p>Evolución mensual</p></div><button class="icon-btn" data-download-chart="servicesTrendChart">⇩</button></div><canvas id="servicesTrendChart" class="chart-canvas" height="330"></canvas></article>
              <article class="card chart-card"><div class="card-header"><div><h3>Estado de los servicios</h3><p>Entregados, rechazados y cancelados</p></div><button class="icon-btn" data-download-chart="statusChart">⇩</button></div><canvas id="statusChart" class="chart-canvas" height="330"></canvas></article>
            </div>
            <div class="content-grid two-columns">
              <article class="card chart-card"><div class="card-header"><div><h3>Principales destinos</h3><p>Comunas o ciudades con más servicios</p></div><button class="icon-btn" data-download-chart="destinationsChart">⇩</button></div><canvas id="destinationsChart" class="chart-canvas" height="390"></canvas></article>
              <article class="card"><div class="card-header"><div><h3>Alertas operativas</h3><p>Registros que requieren revisión</p></div></div><div id="serviceAlertsPanel"></div></article>
            </div>
          </section>

          <section id="view-clients" class="dashboard-view" data-view-panel="clients">
            <div class="section-heading"><div><span class="eyebrow">Análisis comercial</span><h2>Clientes</h2></div></div>
            <div id="clientKpis" class="kpi-grid"></div>
            <div class="content-grid two-columns">
              <article class="card chart-card"><div class="card-header"><div><h3>Ranking por ventas</h3><p>Haz clic para filtrar un cliente</p></div><button class="icon-btn" data-download-chart="clientSalesChart">⇩</button></div><canvas id="clientSalesChart" class="chart-canvas" height="410"></canvas></article>
              <article class="card chart-card"><div class="card-header"><div><h3>Ranking por utilidad</h3><p>Rentabilidad acumulada por cliente</p></div><button class="icon-btn" data-download-chart="clientProfitChart">⇩</button></div><canvas id="clientProfitChart" class="chart-canvas" height="410"></canvas></article>
            </div>
            <article class="card chart-card"><div class="card-header"><div><h3>Evolución mensual del cliente</h3><p id="clientEvolutionLabel">Cliente con mayor venta del período</p></div><button class="icon-btn" data-download-chart="clientEvolutionChart">⇩</button></div><canvas id="clientEvolutionChart" class="chart-canvas" height="330"></canvas></article>
            <article class="card"><div class="card-header"><div><h3>Detalle consolidado de clientes</h3><p>Servicios, pallets, venta, costo, utilidad y margen</p></div></div><div id="clientDetailTable" class="table-wrap"></div></article>
          </section>

          <section id="view-carriers" class="dashboard-view" data-view-panel="carriers">
            <div class="section-heading"><div><span class="eyebrow">Proveedores de transporte</span><h2>Empresas de Transporte</h2></div></div>
            <div id="carrierKpis" class="kpi-grid"></div>
            <div class="content-grid two-columns">
              <article class="card chart-card"><div class="card-header"><div><h3>Servicios por transportista</h3><p>Haz clic para analizar una empresa</p></div><button class="icon-btn" data-download-chart="carrierServicesChart">⇩</button></div><canvas id="carrierServicesChart" class="chart-canvas" height="410"></canvas></article>
              <article class="card chart-card"><div class="card-header"><div><h3>Costo por transportista</h3><p>Participación en el costo total</p></div><button class="icon-btn" data-download-chart="carrierCostChart">⇩</button></div><canvas id="carrierCostChart" class="chart-canvas" height="410"></canvas></article>
            </div>
            <article class="card chart-card"><div class="card-header"><div><h3>Evolución mensual del transportista</h3><p id="carrierEvolutionLabel">Empresa con más servicios del período</p></div><button class="icon-btn" data-download-chart="carrierEvolutionChart">⇩</button></div><canvas id="carrierEvolutionChart" class="chart-canvas" height="330"></canvas></article>
            <article class="card"><div class="card-header"><div><h3>Detalle consolidado de transportistas</h3><p>Servicios, costos, venta asociada, utilidad y margen</p></div></div><div id="carrierDetailTable" class="table-wrap"></div></article>
          </section>

          <section id="view-geography" class="dashboard-view" data-view-panel="geography">
            <div class="section-heading"><div><span class="eyebrow">Cobertura</span><h2>Distribución Geográfica</h2></div></div>
            <div class="data-note warning"><strong>Dato disponible:</strong> la columna “Region” contiene las categorías RM y RG, y “Destino” contiene comuna o ciudad. No existe una columna de origen ni coordenadas sistemáticas; por eso el mapa es esquemático y no inventa ubicaciones.</div>
            <div class="content-grid geo-grid">
              <article class="card"><div class="card-header"><div><h3>Mapa esquemático de cobertura</h3><p>Haz clic en RM o Regiones para filtrar</p></div></div><div id="geoSchematicMap" class="geo-map"></div></article>
              <article class="card chart-card"><div class="card-header"><div><h3>Servicios por destino</h3><p>Principales comunas o ciudades</p></div><button class="icon-btn" data-download-chart="geoDestinationsChart">⇩</button></div><canvas id="geoDestinationsChart" class="chart-canvas" height="470"></canvas></article>
            </div>
            <div class="content-grid two-columns">
              <article class="card"><div class="card-header"><div><h3>Resumen por categoría geográfica</h3><p>RM y RG según la clasificación del archivo</p></div></div><div id="regionSummaryTable" class="table-wrap"></div></article>
              <article class="card"><div class="card-header"><div><h3>Destinos y direcciones frecuentes</h3><p>No se calcula ruta origen-destino porque el origen no está registrado</p></div></div><div id="destinationAddressTable" class="table-wrap"></div></article>
            </div>
          </section>

          <section id="view-finance" class="dashboard-view" data-view-panel="finance">
            <div class="section-heading"><div><span class="eyebrow">Rentabilidad</span><h2>Costos, Ventas y Margen</h2></div></div>
            <div id="financeKpis" class="kpi-grid"></div>
            <div class="content-grid two-columns">
              <article class="card chart-card"><div class="card-header"><div><h3>Evolución financiera mensual</h3><p>Ventas, costos, utilidad y margen</p></div><button class="icon-btn" data-download-chart="financeTrendChart">⇩</button></div><canvas id="financeTrendChart" class="chart-canvas" height="350"></canvas></article>
              <article class="card chart-card"><div class="card-header"><div><h3>Costo por empresa transportista</h3><p>Detalle del gasto de transporte</p></div><button class="icon-btn" data-download-chart="costByCarrierChart">⇩</button></div><canvas id="costByCarrierChart" class="chart-canvas" height="350"></canvas></article>
            </div>
            <div class="content-grid two-columns">
              <article class="card"><div class="card-header"><div><h3>Servicios con margen negativo</h3><p>Prioriza la revisión de los casos de mayor pérdida</p></div></div><div id="negativeMarginTable" class="table-wrap"></div></article>
              <article class="card"><div class="card-header"><div><h3>Alertas de calidad financiera</h3><p>Servicios sin costo, sin venta o con inconsistencias</p></div></div><div id="financeAlertsTable" class="table-wrap"></div></article>
            </div>
          </section>

          <section id="view-detail" class="dashboard-view" data-view-panel="detail">
            <div class="section-heading"><div><span class="eyebrow">Base completa</span><h2>Detalle de Registros</h2></div></div>
            <article class="card detail-card">
              <div class="detail-toolbar">
                <div class="search-box"><span>⌕</span><input id="detailSearchInput" type="search" placeholder="Buscar en todos los registros…"></div>
                <label>Filas por página <select id="detailPageSize"><option>25</option><option>50</option><option>100</option></select></label>
                <button id="columnChooserButton" class="btn btn-secondary compact" type="button">Mostrar / ocultar columnas</button>
                <button id="exportDetailButton" class="btn btn-accent compact" type="button">Exportar registros filtrados</button>
              </div>
              <div id="columnChooser" class="column-chooser" hidden></div>
              <div id="detailTable" class="data-grid"></div>
              <div class="pagination" id="detailPagination"></div>
            </article>
          </section>
        </div>
      </main>
    </div>
  </div>

  <div id="loadingOverlay" class="loading-overlay" hidden>
    <div class="loading-card">
      <div class="spinner"></div>
      <h2 id="loadingTitle">Procesando archivo Excel</h2>
      <p id="loadingMessage">Leyendo la hoja Plan_Transporte…</p>
      <div class="progress-track"><div id="loadingProgress" class="progress-bar"></div></div>
    </div>
  </div>

  <div id="qualityModal" class="modal" hidden>
    <div class="modal-dialog large">
      <div class="modal-header"><div><span class="eyebrow">Validación</span><h2>Calidad de los datos</h2></div><button class="modal-close" data-close-modal="qualityModal" aria-label="Cerrar">×</button></div>
      <div class="modal-body">
        <div id="qualityCards" class="quality-grid"></div>
        <div class="content-grid two-columns modal-grid">
          <section><h3>Columnas identificadas</h3><div id="columnMappingTable" class="table-wrap"></div></section>
          <section><h3>Observaciones</h3><div id="qualityObservations"></div><h3>Hojas encontradas</h3><div id="sheetList" class="tag-list"></div></section>
        </div>
        <section><h3>Diccionario de datos</h3><div id="dataDictionaryTable" class="table-wrap dictionary-table"></div></section>
      </div>
    </div>
  </div>

  <div id="recordModal" class="modal" hidden>
    <div class="modal-dialog">
      <div class="modal-header"><div><span class="eyebrow">Registro individual</span><h2 id="recordModalTitle">Detalle del servicio</h2></div><button class="modal-close" data-close-modal="recordModal" aria-label="Cerrar">×</button></div>
      <div id="recordModalBody" class="modal-body record-detail"></div>
    </div>
  </div>

  <div id="toastContainer" class="toast-container" aria-live="polite"></div>
  <div id="chartTooltip" class="chart-tooltip" hidden></div>

  <script src="js/excel-reader.js"></script>
  <script src="js/calculations.js"></script>
  <script src="js/filters.js"></script>
  <script src="js/charts.js"></script>
  <script src="js/table.js"></script>
  <script src="js/dashboard.js"></script>
  <!-- Copia local opcional del Excel. Permite abrir index.html directamente. -->
  <script src="data/planilla-local.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

## `css/styles.css`

```css
:root {
  --blue-900: #13275a;
  --blue-800: #1d3475;
  --blue-700: #28468f;
  --blue-500: #4668b4;
  --orange-600: #e95c24;
  --orange-500: #f36a2d;
  --orange-100: #fff0e8;
  --gray-950: #151923;
  --gray-800: #303744;
  --gray-700: #4c5565;
  --gray-600: #667085;
  --gray-500: #8b95a5;
  --gray-400: #b8c0cc;
  --gray-300: #d6dbe3;
  --gray-200: #e8ebf0;
  --gray-100: #f3f5f8;
  --gray-50: #f8f9fb;
  --white: #ffffff;
  --green-700: #157347;
  --green-600: #1d8b58;
  --green-100: #e8f7ef;
  --red-700: #b4232f;
  --red-600: #d43f4b;
  --red-100: #fdecee;
  --yellow-700: #946200;
  --yellow-100: #fff6da;
  --shadow-sm: 0 1px 3px rgba(18, 39, 90, .08);
  --shadow-md: 0 10px 30px rgba(18, 39, 90, .10);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --font: Inter, "Segoe UI", Roboto, Arial, sans-serif;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font);
  color: var(--gray-950);
  background: var(--gray-100);
  min-width: 320px;
}
button, input, select { font: inherit; }
button { cursor: pointer; }
button:disabled, select:disabled, input:disabled { cursor: not-allowed; opacity: .58; }
[hidden] { display: none !important; }

.app-shell { min-height: 100vh; }
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  min-height: 88px;
  display: grid;
  grid-template-columns: minmax(330px, 1fr) minmax(260px, .75fr) auto;
  align-items: center;
  gap: 20px;
  padding: 12px 22px;
  background: var(--white);
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
}
.brand-block { display: flex; align-items: center; gap: 16px; min-width: 0; }
.brand-logo {
  flex: 0 0 auto;
  width: 206px;
  max-width: 42vw;
  height: auto;
  object-fit: contain;
}
.brand-block h1 { margin: 0; color: var(--blue-900); font-size: clamp(1.18rem, 2vw, 1.65rem); line-height: 1.1; }
.brand-block p { margin: 5px 0 0; color: var(--gray-600); font-size: .86rem; }
.file-status {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 10px 14px;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: 12px;
}
.file-status strong, .file-status small { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-status strong { color: var(--blue-900); font-size: .86rem; }
.file-status small { margin-top: 3px; color: var(--gray-600); font-size: .74rem; }
.status-dot { flex: 0 0 auto; width: 10px; height: 10px; border-radius: 50%; background: var(--gray-400); box-shadow: 0 0 0 4px rgba(184,192,204,.25); }
.status-dot.ready { background: var(--green-600); box-shadow: 0 0 0 4px rgba(29,139,88,.16); }
.status-dot.error { background: var(--red-600); box-shadow: 0 0 0 4px rgba(212,63,75,.15); }
.top-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }

.btn {
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-weight: 700;
  font-size: .83rem;
  line-height: 1;
  text-decoration: none;
  transition: .18s ease;
  white-space: nowrap;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(18,39,90,.13); }
.btn-primary { color: var(--white); background: var(--blue-800); border-color: var(--blue-800); }
.btn-primary:hover:not(:disabled) { background: var(--blue-900); }
.btn-secondary { color: var(--blue-900); background: var(--white); border-color: var(--gray-300); }
.btn-secondary:hover:not(:disabled) { border-color: var(--blue-500); background: #f7f9ff; }
.btn-accent { color: var(--white); background: var(--orange-600); border-color: var(--orange-600); }
.btn-accent:hover:not(:disabled) { background: #cf4b18; }
.btn.compact { padding: 9px 12px; font-size: .78rem; }
.icon-btn {
  width: 34px; height: 34px; border: 1px solid var(--gray-300); border-radius: 9px;
  background: var(--white); color: var(--blue-800); font-weight: 800;
}
.icon-btn:hover { background: var(--gray-100); border-color: var(--blue-500); }

.privacy-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 16px;
  background: #eef3ff;
  border-bottom: 1px solid #dbe5ff;
  color: var(--blue-800);
  font-size: .76rem;
}
.main-layout { display: grid; grid-template-columns: 246px minmax(0, 1fr); min-height: calc(100vh - 120px); }
.sidebar {
  position: sticky;
  top: 120px;
  align-self: start;
  height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 18px 12px;
  background: linear-gradient(180deg, var(--blue-900), #0d1d46);
  color: var(--white);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 13px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgba(255,255,255,.75);
  text-align: left;
  font-weight: 650;
  font-size: .84rem;
  transition: .16s ease;
}
.nav-item span { width: 22px; text-align: center; color: #adc1ff; font-size: 1.05rem; }
.nav-item:hover { background: rgba(255,255,255,.08); color: var(--white); }
.nav-item.active { background: var(--orange-600); color: var(--white); box-shadow: 0 7px 18px rgba(0,0,0,.18); }
.nav-item.active span { color: var(--white); }
.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,.12);
  padding: 15px 10px 4px;
  display: grid;
  gap: 4px;
}
.sidebar-footer small { color: rgba(255,255,255,.55); }
.sidebar-footer strong { font-size: .82rem; }
.sidebar-footer span { margin-top: 6px; display: inline-block; width: fit-content; background: rgba(255,255,255,.10); color: #dce6ff; border-radius: 999px; padding: 5px 9px; font-size: .72rem; }
.main-content { min-width: 0; padding: 18px 20px 36px; }

.filters-panel {
  position: sticky;
  top: 104px;
  z-index: 35;
  display: grid;
  grid-template-columns: repeat(6, minmax(118px, 1fr));
  gap: 10px;
  align-items: end;
  padding: 14px;
  margin-bottom: 18px;
  background: rgba(255,255,255,.97);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
}
.filter-field { min-width: 0; }
.filter-field.wide { grid-column: span 2; }
.filter-field label { display: block; margin: 0 0 5px; color: var(--gray-700); font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .035em; }
.filter-field select, .filter-field input {
  width: 100%; height: 38px; border: 1px solid var(--gray-300); border-radius: 8px;
  background: var(--white); color: var(--gray-950); padding: 0 9px; font-size: .79rem;
}
.filter-field select:focus, .filter-field input:focus { outline: 3px solid rgba(70,104,180,.14); border-color: var(--blue-500); }
.filter-field.missing-field select { background: repeating-linear-gradient(135deg,#fafafa,#fafafa 7px,#f2f2f2 7px,#f2f2f2 14px); color: var(--gray-500); }

.empty-state { min-height: 58vh; display: grid; place-items: center; }
.drop-zone {
  width: min(690px, 100%);
  padding: 52px 28px;
  text-align: center;
  background: var(--white);
  border: 2px dashed #9fb0d5;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: .2s ease;
}
.drop-zone.dragging { border-color: var(--orange-600); background: var(--orange-100); transform: scale(1.01); }
.drop-icon { width: 74px; height: 74px; margin: 0 auto 18px; display: grid; place-items: center; border-radius: 20px; background: #edf2ff; color: var(--blue-800); font-size: 2.4rem; }
.drop-zone h2 { margin: 0; color: var(--blue-900); }
.drop-zone p { max-width: 540px; margin: 12px auto 22px; color: var(--gray-600); line-height: 1.55; }
.drop-zone small { display: block; margin-top: 15px; color: var(--gray-500); }
.auto-load-message { margin-top: 12px; color: var(--gray-500); font-size: .78rem; text-align: center; }

.dashboard-view { display: none; animation: fadeIn .22s ease; }
.dashboard-view.active { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin: 3px 2px 14px; }
.section-heading h2 { margin: 2px 0 0; color: var(--blue-900); font-size: 1.42rem; }
.eyebrow { color: var(--orange-600); font-size: .68rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.period-label { color: var(--gray-600); font-size: .82rem; font-weight: 700; }

.kpi-grid { display: grid; grid-template-columns: repeat(5, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; }
.kpi-card {
  position: relative;
  overflow: hidden;
  min-height: 120px;
  padding: 15px 16px 13px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--white);
  box-shadow: var(--shadow-sm);
}
.kpi-card::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 4px; background: var(--blue-700); }
.kpi-card.accent::before { background: var(--orange-600); }
.kpi-card.positive::before { background: var(--green-600); }
.kpi-card.negative::before { background: var(--red-600); }
.kpi-label { display: block; min-height: 34px; color: var(--gray-600); font-size: .72rem; font-weight: 800; line-height: 1.25; text-transform: uppercase; letter-spacing: .02em; }
.kpi-value { display: block; margin-top: 5px; color: var(--blue-900); font-size: clamp(1.1rem, 1.65vw, 1.55rem); font-weight: 850; line-height: 1.15; word-break: break-word; }
.kpi-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; color: var(--gray-500); font-size: .68rem; }
.variation-badge { display: inline-flex; align-items: center; gap: 3px; border-radius: 999px; padding: 4px 7px; font-weight: 850; white-space: nowrap; }
.variation-badge.up { color: var(--green-700); background: var(--green-100); }
.variation-badge.down { color: var(--red-700); background: var(--red-100); }
.variation-badge.neutral { color: var(--gray-700); background: var(--gray-100); }

.content-grid { display: grid; gap: 14px; margin-bottom: 14px; }
.content-grid.two-columns { grid-template-columns: repeat(2, minmax(0,1fr)); }
.content-grid.three-columns { grid-template-columns: 1.08fr 1fr 1fr; }
.content-grid.geo-grid { grid-template-columns: minmax(300px,.75fr) minmax(0,1.25fr); }
.card { min-width: 0; padding: 15px; background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.card-header { display: flex; align-items: start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.card-header h3 { margin: 0; color: var(--blue-900); font-size: .97rem; }
.card-header p { margin: 4px 0 0; color: var(--gray-500); font-size: .72rem; }
.chart-card { overflow: hidden; }
.chart-canvas { width: 100%; display: block; min-height: 260px; }
.chart-empty { display: grid; place-items: center; height: 260px; color: var(--gray-500); font-size: .82rem; }

.table-wrap { max-width: 100%; overflow: auto; border: 1px solid var(--gray-200); border-radius: 10px; }
.table-wrap table { width: 100%; border-collapse: collapse; font-size: .75rem; }
.table-wrap th { position: sticky; top: 0; z-index: 2; padding: 9px 10px; background: var(--blue-900); color: var(--white); text-align: left; white-space: nowrap; font-weight: 800; }
.table-wrap td { padding: 8px 10px; border-bottom: 1px solid var(--gray-200); vertical-align: top; }
.table-wrap tbody tr:nth-child(even) { background: var(--gray-50); }
.table-wrap tbody tr:hover { background: #edf2ff; }
.table-wrap tfoot td { background: #edf2ff; color: var(--blue-900); font-weight: 850; }
.table-wrap .numeric { text-align: right; white-space: nowrap; }
.table-wrap .positive-text { color: var(--green-700); font-weight: 800; }
.table-wrap .negative-text { color: var(--red-700); font-weight: 800; }
.table-wrap .warning-text { color: var(--yellow-700); font-weight: 800; }
.table-wrap .muted { color: var(--gray-500); }
.compact-table { max-height: 410px; }

.data-note { margin: 0 0 14px; padding: 11px 14px; border-radius: 10px; font-size: .78rem; line-height: 1.45; }
.data-note.warning { color: #725000; background: var(--yellow-100); border: 1px solid #f4df9c; }
.geo-map { min-height: 465px; display: grid; place-items: center; }
.geo-schematic { width: min(100%, 420px); }
.geo-segment { cursor: pointer; transition: .18s ease; }
.geo-segment:hover { filter: brightness(1.06); transform: translateY(-1px); }
.geo-label { font-weight: 800; fill: var(--blue-900); }
.geo-value { font-weight: 900; fill: var(--white); }

.alert-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
.alert-card { padding: 13px; border-radius: 11px; border: 1px solid var(--gray-200); background: var(--gray-50); }
.alert-card strong { display: block; color: var(--blue-900); font-size: 1.35rem; }
.alert-card span { display: block; margin-top: 4px; color: var(--gray-600); font-size: .72rem; }
.alert-card.danger { background: var(--red-100); border-color: #f3c8ce; }
.alert-card.warning { background: var(--yellow-100); border-color: #f4df9c; }
.alert-card.info { background: #eef3ff; border-color: #d6e1ff; }
.alert-card.success { background: var(--green-100); border-color: #c8ead7; }

.detail-card { padding: 0; overflow: hidden; }
.detail-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 13px; border-bottom: 1px solid var(--gray-200); background: var(--gray-50); }
.detail-toolbar label { display: flex; align-items: center; gap: 7px; color: var(--gray-600); font-size: .76rem; font-weight: 700; }
.detail-toolbar select { height: 35px; border: 1px solid var(--gray-300); border-radius: 8px; background: var(--white); }
.search-box { flex: 1 1 280px; display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 11px; border: 1px solid var(--gray-300); border-radius: 9px; background: var(--white); }
.search-box input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; }
.column-chooser { display: grid; grid-template-columns: repeat(4, minmax(170px,1fr)); gap: 7px 12px; padding: 14px; border-bottom: 1px solid var(--gray-200); background: #fbfcff; max-height: 310px; overflow: auto; }
.column-chooser label { display: flex; align-items: center; gap: 7px; font-size: .75rem; color: var(--gray-700); }
.data-grid { overflow: auto; max-height: calc(100vh - 340px); }
.data-grid table { width: max-content; min-width: 100%; border-collapse: separate; border-spacing: 0; font-size: .73rem; }
.data-grid th { position: sticky; top: 0; z-index: 3; min-width: 110px; padding: 10px; background: var(--blue-900); color: var(--white); border-right: 1px solid rgba(255,255,255,.14); text-align: left; white-space: nowrap; user-select: none; cursor: pointer; }
.data-grid th:hover { background: var(--blue-800); }
.data-grid td { max-width: 320px; padding: 8px 10px; border-right: 1px solid var(--gray-200); border-bottom: 1px solid var(--gray-200); background: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.data-grid tr:nth-child(even) td { background: var(--gray-50); }
.data-grid tbody tr:hover td { background: #edf2ff; }
.data-grid tr.flagged td:first-child { box-shadow: inset 4px 0 0 var(--orange-600); }
.data-grid .cell-negative { color: var(--red-700); background: var(--red-100) !important; font-weight: 800; }
.data-grid .cell-positive { color: var(--green-700); background: var(--green-100) !important; font-weight: 800; }
.sort-indicator { margin-left: 6px; opacity: .8; }
.pagination { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; padding: 11px 13px; border-top: 1px solid var(--gray-200); background: var(--white); color: var(--gray-600); font-size: .75rem; }
.pagination-actions { display: flex; gap: 6px; }
.pagination button { min-width: 34px; height: 32px; border: 1px solid var(--gray-300); border-radius: 7px; background: var(--white); color: var(--blue-900); font-weight: 800; }
.pagination button:hover:not(:disabled) { background: #edf2ff; }
.pagination button.active { background: var(--blue-800); color: var(--white); border-color: var(--blue-800); }

.loading-overlay { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; background: rgba(12,25,58,.68); backdrop-filter: blur(5px); }
.loading-card { width: min(450px,100%); padding: 30px; border-radius: var(--radius-lg); background: var(--white); text-align: center; box-shadow: 0 20px 70px rgba(0,0,0,.3); }
.spinner { width: 48px; height: 48px; margin: 0 auto 17px; border: 5px solid #dfe7fb; border-top-color: var(--orange-600); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-card h2 { margin: 0; color: var(--blue-900); }
.loading-card p { margin: 8px 0 18px; color: var(--gray-600); font-size: .85rem; }
.progress-track { height: 8px; overflow: hidden; border-radius: 999px; background: var(--gray-200); }
.progress-bar { width: 10%; height: 100%; border-radius: 999px; background: linear-gradient(90deg,var(--blue-700),var(--orange-600)); transition: width .3s ease; }

.modal { position: fixed; inset: 0; z-index: 120; display: grid; place-items: center; padding: 20px; background: rgba(12,25,58,.64); backdrop-filter: blur(4px); }
.modal-dialog { width: min(850px,100%); max-height: 90vh; overflow: hidden; border-radius: var(--radius-lg); background: var(--white); box-shadow: 0 24px 80px rgba(0,0,0,.32); }
.modal-dialog.large { width: min(1240px,100%); }
.modal-header { display: flex; justify-content: space-between; align-items: start; gap: 20px; padding: 18px 21px; border-bottom: 1px solid var(--gray-200); }
.modal-header h2 { margin: 3px 0 0; color: var(--blue-900); }
.modal-close { width: 38px; height: 38px; border: 0; border-radius: 10px; background: var(--gray-100); color: var(--gray-700); font-size: 1.5rem; line-height: 1; }
.modal-close:hover { background: var(--red-100); color: var(--red-700); }
.modal-body { max-height: calc(90vh - 80px); overflow: auto; padding: 20px; }
.modal-body h3 { margin: 4px 0 10px; color: var(--blue-900); font-size: .95rem; }
.modal-grid { align-items: start; }
.quality-grid { display: grid; grid-template-columns: repeat(5,minmax(130px,1fr)); gap: 10px; margin-bottom: 18px; }
.quality-card { padding: 13px; border: 1px solid var(--gray-200); border-radius: 11px; background: var(--gray-50); }
.quality-card strong { display: block; color: var(--blue-900); font-size: 1.3rem; }
.quality-card span { color: var(--gray-600); font-size: .7rem; }
.quality-card.good { background: var(--green-100); border-color: #c8ead7; }
.quality-card.warn { background: var(--yellow-100); border-color: #f4df9c; }
.quality-card.bad { background: var(--red-100); border-color: #f3c8ce; }
.tag-list { display: flex; flex-wrap: wrap; gap: 7px; }
.tag { padding: 6px 9px; border-radius: 999px; background: #edf2ff; color: var(--blue-800); font-size: .7rem; font-weight: 800; }
.observation-list { display: grid; gap: 8px; margin-bottom: 18px; }
.observation { padding: 10px 12px; border-left: 4px solid var(--orange-600); background: var(--gray-50); border-radius: 7px; color: var(--gray-700); font-size: .76rem; line-height: 1.4; }
.dictionary-table { max-height: 430px; }
.record-detail { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0; padding: 0; }
.record-field { padding: 12px 16px; border-right: 1px solid var(--gray-200); border-bottom: 1px solid var(--gray-200); }
.record-field span { display: block; color: var(--gray-500); font-size: .67rem; font-weight: 800; text-transform: uppercase; }
.record-field strong { display: block; margin-top: 4px; color: var(--gray-950); font-size: .82rem; word-break: break-word; }

.chart-tooltip { position: fixed; z-index: 160; pointer-events: none; min-width: 130px; max-width: 270px; padding: 9px 11px; border-radius: 8px; background: rgba(15,27,61,.95); color: var(--white); box-shadow: 0 8px 24px rgba(0,0,0,.25); font-size: .72rem; line-height: 1.4; }
.chart-tooltip strong { display: block; margin-bottom: 3px; }
.toast-container { position: fixed; z-index: 180; right: 18px; bottom: 18px; display: grid; gap: 9px; width: min(380px,calc(100% - 36px)); }
.toast { padding: 12px 14px; border-radius: 10px; color: var(--white); background: var(--blue-900); box-shadow: var(--shadow-md); font-size: .8rem; animation: toastIn .2s ease; }
.toast.success { background: var(--green-700); }
.toast.error { background: var(--red-700); }
.toast.warning { background: #866000; }
@keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

@media (max-width: 1450px) {
  .topbar { grid-template-columns: minmax(300px,1fr) minmax(230px,.75fr); }
  .top-actions { grid-column: 1 / -1; justify-content: flex-start; }
  .main-layout { grid-template-columns: 220px minmax(0,1fr); }
  .filters-panel { top: 151px; grid-template-columns: repeat(5,minmax(115px,1fr)); }
  .sidebar { top: 167px; height: calc(100vh - 167px); }
  .kpi-grid { grid-template-columns: repeat(4,minmax(145px,1fr)); }
  .content-grid.three-columns { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .content-grid.three-columns > :last-child { grid-column: span 2; }
}
@media (max-width: 1100px) {
  .main-layout { grid-template-columns: 76px minmax(0,1fr); }
  .sidebar { padding: 14px 8px; }
  .nav-item { justify-content: center; padding: 12px 8px; }
  .nav-item span { width: auto; }
  .nav-item { font-size: 0; }
  .nav-item span { font-size: 1.15rem; }
  .sidebar-footer { display: none; }
  .filters-panel { grid-template-columns: repeat(4,minmax(110px,1fr)); }
  .filter-field.wide { grid-column: span 2; }
  .kpi-grid { grid-template-columns: repeat(3,minmax(145px,1fr)); }
  .content-grid.two-columns, .content-grid.geo-grid { grid-template-columns: 1fr; }
  .column-chooser { grid-template-columns: repeat(3,minmax(160px,1fr)); }
}
@media (max-width: 760px) {
  .topbar { position: static; grid-template-columns: 1fr; padding: 12px; gap: 10px; }
  .brand-logo { width: 168px; max-width: 58vw; }
  .brand-block { align-items: flex-start; }
  .file-status { width: 100%; }
  .top-actions { grid-column: auto; justify-content: stretch; }
  .top-actions .btn { flex: 1 1 140px; }
  .privacy-banner { text-align: center; }
  .main-layout { display: block; }
  .sidebar { position: sticky; top: 0; z-index: 60; height: auto; flex-direction: row; overflow-x: auto; padding: 7px; }
  .nav-item { flex: 0 0 49px; }
  .main-content { padding: 12px 10px 28px; }
  .filters-panel { position: static; grid-template-columns: repeat(2,minmax(0,1fr)); padding: 11px; }
  .filter-field.wide { grid-column: span 2; }
  .filters-panel .btn { grid-column: span 2; }
  .kpi-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .content-grid.three-columns { grid-template-columns: 1fr; }
  .content-grid.three-columns > :last-child { grid-column: auto; }
  .quality-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .column-chooser { grid-template-columns: 1fr 1fr; }
  .record-detail { grid-template-columns: 1fr; }
  .chart-canvas { min-height: 230px; }
}
@media (max-width: 480px) {
  .brand-block { display: grid; grid-template-columns: 1fr; }
  .top-actions .btn { flex-basis: 100%; }
  .filters-panel { grid-template-columns: 1fr; }
  .filter-field.wide, .filters-panel .btn { grid-column: auto; }
  .kpi-grid { grid-template-columns: 1fr; }
  .column-chooser, .quality-grid { grid-template-columns: 1fr; }
  .section-heading { align-items: start; flex-direction: column; }
  .alert-grid { grid-template-columns: 1fr; }
}

@media print {
  .top-actions, .sidebar, .filters-panel, .privacy-banner, .icon-btn { display: none !important; }
  .main-layout { display: block; }
  .main-content { padding: 0; }
  .topbar { position: static; box-shadow: none; }
  .dashboard-view { display: block !important; page-break-after: always; }
  .card, .kpi-card { box-shadow: none; break-inside: avoid; }
}
```

## `js/app.js`

```javascript
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
```

## `js/excel-reader.js`

```javascript
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
```

## `js/calculations.js`

```javascript
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
```

## `js/charts.js`

```javascript
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
```

## `js/filters.js`

```javascript
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
```

## `js/table.js`

```javascript
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
```

## `js/dashboard.js`

```javascript
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

  function renderSummary(context) {
    const { currentRecords, previousRecords, filters } = context;
    const { current, previous, variation } = metricComparison(currentRecords, previousRecords);
    byId('summaryPeriodLabel').textContent = global.Filters.periodLabel(filters);

    renderKpis('summaryKpis', [
      { label: 'Total de servicios', value: C.formatNumber(current.services, 0), variation: variation.services, note: 'IDs únicos', tone: 'accent' },
      { label: 'Total de pallets', value: C.formatNumber(current.pallets, 1), variation: variation.pallets, note: 'Entregados; respaldo solicitados' },
      { label: 'Venta total', value: C.formatCurrency(current.sale), variation: variation.sale, note: 'Venta Total', tone: 'accent' },
      { label: 'Costo total', value: C.formatCurrency(current.cost), variation: variation.cost, favorableLower: true, note: 'Costo Total' },
      { label: 'Utilidad total', value: C.formatCurrency(current.profit), variation: variation.profit, note: 'Venta - Costo', tone: current.profit < 0 ? 'negative' : 'positive' },
      { label: 'Margen porcentual', value: C.formatPercent(current.margin, 1), variation: variation.margin, note: 'Utilidad / Venta', tone: current.margin < 0 ? 'negative' : 'positive' },
      { label: 'Venta promedio por servicio', value: C.formatCurrency(current.avgSale), note: 'Venta / servicios' },
      { label: 'Costo promedio por servicio', value: C.formatCurrency(current.avgCost), note: 'Costo / servicios' },
      { label: 'Utilidad promedio por servicio', value: C.formatCurrency(current.avgProfit), note: 'Utilidad / servicios', tone: current.avgProfit < 0 ? 'negative' : '' },
      { label: 'Variación de servicios', value: C.formatVariation(variation.services), note: 'Frente al año anterior', tone: variationClass(variation.services) === 'down' ? 'negative' : 'positive' },
      { label: 'Variación de ventas', value: C.formatVariation(variation.sale), note: 'Frente al año anterior', tone: variationClass(variation.sale) === 'down' ? 'negative' : 'positive' },
      { label: 'Variación de costos', value: C.formatVariation(variation.cost), note: 'Frente al año anterior', tone: variationClass(variation.cost, true) === 'down' ? 'negative' : 'positive' },
      { label: 'Variación de utilidad', value: C.formatVariation(variation.profit), note: 'Frente al año anterior', tone: variationClass(variation.profit) === 'down' ? 'negative' : 'positive' },
      { label: 'Variación de margen', value: C.formatVariation(variation.margin), note: previous ? `${(variation.marginPoints * 100).toLocaleString('es-CL', { maximumFractionDigits: 1 })} pp` : 'Sin base', tone: variationClass(variation.margin) === 'down' ? 'negative' : 'positive' }
    ]);

    const monthlyCurrent = monthlyData(currentRecords);
    const monthlyPrevious = previousRecords ? monthlyData(previousRecords) : monthlyData([]);
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
    global.Charts.mixed('annualSalesChart', {
      labels: monthlyCurrent.map(item => item.monthShort),
      datasets: [
        { type: 'line', label: filters.year ? String(filters.year) : 'Período actual', data: monthlyCurrent.map(item => item.sale), color: COLORS.orange, format: 'currency' },
        { type: 'line', label: filters.year ? String(filters.year - 1) : 'Período anterior', data: monthlyPrevious.map(item => item.sale), color: COLORS.blueLight, format: 'currency' }
      ],
      leftFormat: 'currency', onClickLabel: (_, index) => filterRequest?.('month', index + 1)
    });

    const comparisonRows = monthlyCurrent.map((item, index) => {
      const prev = monthlyPrevious[index];
      const salesVar = C.variation(item.sale, prev.sale);
      const marginVar = C.variation(item.margin, prev.margin);
      return [
        item.monthName,
        cell(C.formatNumber(item.services, 0), 'numeric'),
        cell(C.formatNumber(item.pallets, 1), 'numeric'),
        cell(C.formatCurrency(item.sale), 'numeric'),
        cell(C.formatCurrency(item.cost), 'numeric'),
        cell(C.formatCurrency(item.profit), `numeric ${item.profit < 0 ? 'negative-text' : 'positive-text'}`),
        cell(C.formatPercent(item.margin, 1), `numeric ${item.margin < 0 ? 'negative-text' : ''}`),
        cell(C.formatVariation(salesVar), `numeric ${salesVar < 0 ? 'negative-text' : salesVar > 0 ? 'positive-text' : 'muted'}`),
        cell(C.formatVariation(marginVar), `numeric ${marginVar < 0 ? 'negative-text' : marginVar > 0 ? 'positive-text' : 'muted'}`)
      ];
    });
    createTable('monthlyComparisonTable', ['Mes','Servicios','Pallets','Venta','Costo','Utilidad','Margen','Var. venta','Var. margen'], comparisonRows,
      { footer: ['Total', C.formatNumber(current.services,0), C.formatNumber(current.pallets,1), C.formatCurrency(current.sale), C.formatCurrency(current.cost), C.formatCurrency(current.profit), C.formatPercent(current.margin,1), C.formatVariation(variation.sale), C.formatVariation(variation.margin)] });

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

  function regionColor(value, max, baseColor, lightColor) {
    const ratio = max ? Math.max(.2, value / max) : .2;
    return ratio > .65 ? baseColor : ratio > .35 ? lightColor : '#dce4f7';
  }

  function renderGeoMap(regionGroups, filters) {
    const container = clear('geoSchematicMap');
    if (!container) return;
    const map = new Map(regionGroups.map(item => [item.label.toUpperCase(), item]));
    const rg = map.get('RG') || { services: 0, pallets: 0 };
    const rm = map.get('RM') || { services: 0, pallets: 0 };
    const max = Math.max(rg.services, rm.services, 1);
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 420 520'); svg.classList.add('geo-schematic'); svg.setAttribute('role','img');
    svg.setAttribute('aria-label','Mapa esquemático de servicios en Región Metropolitana y Regiones');
    const title = document.createElementNS(svg.namespaceURI,'text'); title.setAttribute('x','210'); title.setAttribute('y','28'); title.setAttribute('text-anchor','middle'); title.setAttribute('class','geo-label'); title.textContent='Clasificación geográfica del archivo'; svg.appendChild(title);

    const makeGroup = (code, label, x, y, w, h, data, fill) => {
      const g = document.createElementNS(svg.namespaceURI,'g'); g.classList.add('geo-segment'); g.setAttribute('tabindex','0');
      const rect = document.createElementNS(svg.namespaceURI,'rect'); rect.setAttribute('x',x); rect.setAttribute('y',y); rect.setAttribute('width',w); rect.setAttribute('height',h); rect.setAttribute('rx','24'); rect.setAttribute('fill',fill); rect.setAttribute('stroke',filters.region===code?COLORS.orange:'#c4cee2'); rect.setAttribute('stroke-width',filters.region===code?'6':'2');
      const t1 = document.createElementNS(svg.namespaceURI,'text'); t1.setAttribute('x',x+w/2); t1.setAttribute('y',y+h/2-15); t1.setAttribute('text-anchor','middle'); t1.setAttribute('class','geo-value'); t1.setAttribute('font-size','26'); t1.textContent=code;
      const t2 = document.createElementNS(svg.namespaceURI,'text'); t2.setAttribute('x',x+w/2); t2.setAttribute('y',y+h/2+14); t2.setAttribute('text-anchor','middle'); t2.setAttribute('class','geo-value'); t2.setAttribute('font-size','18'); t2.textContent=C.formatNumber(data.services,0)+' servicios';
      const t3 = document.createElementNS(svg.namespaceURI,'text'); t3.setAttribute('x',x+w/2); t3.setAttribute('y',y+h/2+39); t3.setAttribute('text-anchor','middle'); t3.setAttribute('fill','#ffffff'); t3.setAttribute('font-size','12'); t3.textContent=C.formatNumber(data.pallets,1)+' pallets';
      g.append(rect,t1,t2,t3); g.addEventListener('click',()=>filterRequest?.('region',filters.region===code?'':code)); g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();filterRequest?.('region',filters.region===code?'':code);}}); svg.appendChild(g);
      const labelText = document.createElementNS(svg.namespaceURI,'text'); labelText.setAttribute('x',x+w+14); labelText.setAttribute('y',y+h/2); labelText.setAttribute('class','geo-label'); labelText.setAttribute('font-size','13'); labelText.textContent=label; svg.appendChild(labelText);
    };
    makeGroup('RG','Regiones',100,55,120,300,rg,regionColor(rg.services,max,COLORS.blue,COLORS.blueLight));
    makeGroup('RM','Región Metropolitana',128,370,64,90,rm,regionColor(rm.services,max,COLORS.orange,COLORS.orangeLight));
    const note=document.createElementNS(svg.namespaceURI,'text'); note.setAttribute('x','210'); note.setAttribute('y','500'); note.setAttribute('text-anchor','middle'); note.setAttribute('fill','#667085'); note.setAttribute('font-size','11'); note.textContent='Representación esquemática: no utiliza coordenadas geográficas.'; svg.appendChild(note);
    container.appendChild(svg);
  }

  function renderGeography(context) {
    const { currentRecords, filters } = context;
    const regions = C.sortGroups(C.group(currentRecords, '__region'), 'services');
    renderGeoMap(regions, filters);
    const destinations = C.sortGroups(C.group(currentRecords, '__destination'), 'services').slice(0,20);
    global.Charts.horizontalBars('geoDestinationsChart', {
      items: destinations.map(item => ({ label:item.label,value:item.services,extraTooltip:`Pallets: ${C.formatNumber(item.pallets,1)} · Venta: ${C.formatCurrency(item.sale)}` })),
      format:'number',valueLabel:'Servicios',color:COLORS.orange,onClick:item=>filterRequest?.('destination',item.label==='Sin información'?'':item.label)
    });
    createTable('regionSummaryTable',['Clasificación','Servicios','Pallets','Venta','Costo','Utilidad','Margen'],regions.map(item=>[
      item.label,cell(C.formatNumber(item.services,0),'numeric'),cell(C.formatNumber(item.pallets,1),'numeric'),cell(C.formatCurrency(item.sale),'numeric'),cell(C.formatCurrency(item.cost),'numeric'),cell(C.formatCurrency(item.profit),`numeric ${item.profit<0?'negative-text':'positive-text'}`),cell(C.formatPercent(item.margin,1),'numeric')
    ]),{onRowClick:index=>filterRequest?.('region',regions[index].label==='Sin información'?'':regions[index].label)});
    const addresses=C.destinationAddressGroups(currentRecords,25);
    createTable('destinationAddressTable',['Destino','Dirección','Servicios','Pallets'],addresses.map(item=>[item.destination,item.address,cell(C.formatNumber(item.services,0),'numeric'),cell(C.formatNumber(item.pallets,1),'numeric')]));
  }

  function renderFinance(context) {
    const { currentRecords, previousRecords } = context;
    const { current, variation } = metricComparison(currentRecords, previousRecords);
    const alerts=C.financialAlerts(currentRecords);
    renderKpis('financeKpis',[
      {label:'Venta total',value:C.formatCurrency(current.sale),variation:variation.sale,note:'Venta Total',tone:'accent'},
      {label:'Costo total',value:C.formatCurrency(current.cost),variation:variation.cost,favorableLower:true,note:'Costo Total'},
      {label:'Utilidad total',value:C.formatCurrency(current.profit),variation:variation.profit,note:'Venta - Costo',tone:current.profit<0?'negative':'positive'},
      {label:'Margen',value:C.formatPercent(current.margin,1),variation:variation.margin,note:'Utilidad / Venta',tone:current.margin<0?'negative':'positive'},
      {label:'Servicios con margen negativo',value:C.formatNumber(alerts.negativeMargin.length,0),note:'Requieren revisión',tone:alerts.negativeMargin.length?'negative':'positive'},
      {label:'Servicios sin venta',value:C.formatNumber(alerts.noSale.length,0),note:'Venta Total = 0',tone:alerts.noSale.length?'negative':'positive'},
      {label:'Servicios sin costo',value:C.formatNumber(alerts.noCost.length,0),note:'Costo Total = 0',tone:alerts.noCost.length?'negative':'positive'},
      {label:'Costo mayor que venta',value:C.formatNumber(alerts.costOverSale.length,0),note:'Pérdida potencial',tone:alerts.costOverSale.length?'negative':'positive'}
    ]);
    const monthly=monthlyData(currentRecords);
    global.Charts.mixed('financeTrendChart',{
      labels:monthly.map(item=>item.monthShort),datasets:[
        {type:'bar',label:'Ventas',data:monthly.map(item=>item.sale),color:COLORS.orange,format:'currency'},
        {type:'bar',label:'Costos',data:monthly.map(item=>item.cost),color:COLORS.blue,format:'currency'},
        {type:'line',label:'Utilidad',data:monthly.map(item=>item.profit),color:COLORS.green,format:'currency'},
        {type:'line',label:'Margen',data:monthly.map(item=>item.margin),color:COLORS.red,axis:'right',format:'percent'}
      ],leftFormat:'currency',rightFormat:'percent',onClickLabel:(_,index)=>filterRequest?.('month',index+1)
    });
    const carriers=C.sortGroups(C.group(currentRecords,'__carrier'),'cost').slice(0,14);
    global.Charts.horizontalBars('costByCarrierChart',{items:carriers.map(item=>({label:item.label,value:item.cost,extraTooltip:`Utilidad: ${C.formatCurrency(item.profit)} · Margen: ${C.formatPercent(item.margin,1)}`})),format:'currency',valueLabel:'Costo',color:COLORS.blue,onClick:item=>filterRequest?.('carrier',item.label)});
    const negative=C.negativeMarginRows(currentRecords,25);
    createTable('negativeMarginTable',['Fecha','ID','Cliente','Transportista','Venta','Costo','Pérdida','Margen'],negative.map(item=>[
      C.formatDate(item.__date),item.__id||'Sin ID',item.__client||'Sin cliente',item.__carrier||'Sin transportista',cell(C.formatCurrency(item.__sale),'numeric'),cell(C.formatCurrency(item.__cost),'numeric'),cell(C.formatCurrency(item.__profit),'numeric negative-text'),cell(C.formatPercent(item.__margin,1),'numeric negative-text')
    ]),{onRowClick:index=>showRecord(negative[index])});
    const alertRows=[
      ['Servicios sin costo',alerts.noCost.length,'Costo Total = 0'],['Servicios sin venta',alerts.noSale.length,'Venta Total = 0'],['Costo mayor que venta',alerts.costOverSale.length,'Costo Total > Venta Total'],['Margen negativo',alerts.negativeMargin.length,'Utilidad < 0'],['Registros incompletos',alerts.incomplete.length,'Campos esenciales ausentes'],['Duplicados potenciales',alerts.potentialDuplicate.length,'Coincidencia de fecha, cliente, pedido, guía y dirección']
    ];
    createTable('financeAlertsTable',['Alerta','Registros','Criterio'],alertRows.map(row=>[row[0],cell(C.formatNumber(row[1],0),`numeric ${row[1]?'negative-text':'positive-text'}`),row[2]]));
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
      `La fecha principal es “${dataset.mapping.deliveryDate || 'no encontrada'}”; si está vacía o fuera de rango se intenta “Fecha de necesidad” y luego “Fecha de Solicitud”.`,
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
    else if(activeView==='finance') renderFinance(context);
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
```

## `server.py`

```python
"""Servidor local del Dashboard de Transporte.

Uso:
    python server.py

Publica únicamente la carpeta del proyecto, evita caché y abre el navegador.
Si el puerto 8000 está ocupado, prueba automáticamente los siguientes.
"""

from __future__ import annotations

import http.server
import socketserver
import threading
import webbrowser
from pathlib import Path

HOST = "127.0.0.1"
START_PORT = 8000
PORT_ATTEMPTS = 11
PROJECT_DIR = Path(__file__).resolve().parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """Sirve los archivos del proyecto sin conservar versiones antiguas en caché."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".json": "application/json",
        ".js": "application/javascript",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ReusableThreadingTCPServer(socketserver.ThreadingTCPServer):
    """Servidor reutilizable que atiende varios recursos en paralelo."""

    allow_reuse_address = True
    daemon_threads = True


def open_browser(url: str) -> None:
    """Abre el navegador después de iniciar el servidor."""

    webbrowser.open(url, new=2)


def create_server() -> tuple[ReusableThreadingTCPServer, int]:
    """Busca el primer puerto disponible entre 8000 y 8010."""

    last_error: OSError | None = None
    for port in range(START_PORT, START_PORT + PORT_ATTEMPTS):
        try:
            return ReusableThreadingTCPServer((HOST, port), NoCacheHandler), port
        except OSError as error:
            last_error = error

    raise OSError(
        f"No hay puertos disponibles entre {START_PORT} y "
        f"{START_PORT + PORT_ATTEMPTS - 1}."
    ) from last_error


def main() -> None:
    """Inicia el servidor HTTP local."""

    import os

    os.chdir(PROJECT_DIR)

    try:
        httpd, port = create_server()
        url = f"http://{HOST}:{port}/"

        with httpd:
            print("=" * 58)
            print(" Dashboard de Transporte - Warehousing Chile")
            print("=" * 58)
            print(f"Carpeta: {PROJECT_DIR}")
            print(f"Dirección: {url}")
            print("Mantén esta ventana abierta mientras uses el dashboard.")
            print("Para detener el servidor, presiona Ctrl + C.")
            print()

            threading.Timer(0.8, open_browser, args=(url,)).start()
            httpd.serve_forever()
    except OSError as error:
        print("No fue posible iniciar el servidor local.")
        print(f"Detalle técnico: {error}")
        input("Presiona Enter para cerrar...")
    except KeyboardInterrupt:
        print("\nServidor detenido correctamente.")


if __name__ == "__main__":
    main()
```

## `servidor_local.ps1`

```powershell
param(
    [int]$Puerto = 8000
)

$ErrorActionPreference = "Stop"
$ProjectDir = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))

function Get-ContentType {
    param([string]$Path)
    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { return "text/html; charset=utf-8" }
        ".htm"  { return "text/html; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".md"   { return "text/markdown; charset=utf-8" }
        ".txt"  { return "text/plain; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".svg"  { return "image/svg+xml" }
        ".ico"  { return "image/x-icon" }
        ".xlsx" { return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        default  { return "application/octet-stream" }
    }
}

function Send-HttpResponse {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [string]$ContentType,
        [byte[]]$Body,
        [bool]$HeadOnly = $false
    )

    if ($null -eq $Body) { $Body = [byte[]]@() }
    $headers = "HTTP/1.1 $StatusCode $StatusText`r`n" +
               "Content-Type: $ContentType`r`n" +
               "Content-Length: $($Body.Length)`r`n" +
               "Cache-Control: no-store, no-cache, must-revalidate`r`n" +
               "Pragma: no-cache`r`n" +
               "Connection: close`r`n`r`n"

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if (-not $HeadOnly -and $Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
    $Stream.Flush()
}

$listener = $null
$selectedPort = $null
foreach ($candidatePort in $Puerto..($Puerto + 10)) {
    try {
        $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidatePort)
        $candidate.Start()
        $listener = $candidate
        $selectedPort = $candidatePort
        break
    }
    catch {
        if ($candidate) {
            try { $candidate.Stop() } catch { }
        }
    }
}

if ($null -eq $listener) {
    Write-Host "No fue posible iniciar el servidor entre los puertos $Puerto y $($Puerto + 10)." -ForegroundColor Red
    exit 1
}

$url = "http://127.0.0.1:$selectedPort/"
Write-Host "=======================================================" -ForegroundColor DarkBlue
Write-Host " Dashboard de Transporte - Warehousing Chile" -ForegroundColor Blue
Write-Host "=======================================================" -ForegroundColor DarkBlue
Write-Host "Carpeta: $ProjectDir"
Write-Host "Dirección: $url"
Write-Host ""
Write-Host "El navegador se abrirá automáticamente." -ForegroundColor Green
Write-Host "Mantén esta ventana abierta mientras uses el dashboard."
Write-Host "Para detenerlo, presiona Ctrl + C o cierra esta ventana."
Write-Host ""

Start-Process $url
$rootPrefix = $ProjectDir.TrimEnd('\') + '\'

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $null
        $reader = $null
        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
            $requestLine = $reader.ReadLine()

            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                continue
            }

            # Consume el resto de los encabezados HTTP.
            while ($true) {
                $line = $reader.ReadLine()
                if ($null -eq $line -or $line.Length -eq 0) { break }
            }

            $parts = $requestLine.Split(' ')
            if ($parts.Length -lt 2) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Solicitud no válida.")
                Send-HttpResponse $stream 400 "Bad Request" "text/plain; charset=utf-8" $body
                continue
            }

            $method = $parts[0].ToUpperInvariant()
            $headOnly = $method -eq "HEAD"
            if ($method -ne "GET" -and -not $headOnly) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Método no permitido.")
                Send-HttpResponse $stream 405 "Method Not Allowed" "text/plain; charset=utf-8" $body
                continue
            }

            $requestUri = [System.Uri]::new("http://127.0.0.1$($parts[1])")
            $relativePath = [System.Uri]::UnescapeDataString($requestUri.AbsolutePath).TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = "index.html"
            }

            $relativePath = $relativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $ProjectDir $relativePath))

            if (-not $fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -and
                -not $fullPath.Equals($ProjectDir, [System.StringComparison]::OrdinalIgnoreCase)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Acceso denegado.")
                Send-HttpResponse $stream 403 "Forbidden" "text/plain; charset=utf-8" $body $headOnly
                continue
            }

            if (Test-Path -LiteralPath $fullPath -PathType Container) {
                $fullPath = Join-Path $fullPath "index.html"
            }

            if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("Archivo no encontrado.")
                Send-HttpResponse $stream 404 "Not Found" "text/plain; charset=utf-8" $body $headOnly
                continue
            }

            $body = [System.IO.File]::ReadAllBytes($fullPath)
            Send-HttpResponse $stream 200 "OK" (Get-ContentType $fullPath) $body $headOnly
        }
        catch {
            Write-Warning "Error atendiendo una solicitud: $($_.Exception.Message)"
        }
        finally {
            if ($reader) { $reader.Dispose() }
            if ($stream) { $stream.Dispose() }
            $client.Close()
        }
    }
}
finally {
    $listener.Stop()
}
```

## `actualizar_datos_locales.ps1`

```powershell
param(
    [switch]$Silencioso
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DataDir = Join-Path $ProjectDir "data"
$ConfigPath = Join-Path $DataDir "config.json"
$BundlePath = Join-Path $DataDir "planilla-local.js"

function Write-Status {
    param([string]$Message)
    if (-not $Silencioso) {
        Write-Host $Message
    }
}

function ConvertTo-JavaScriptString {
    param([string]$Value)
    if ($null -eq $Value) { return '""' }

    $escaped = $Value.Replace('\', '\\')
    $escaped = $escaped.Replace('"', '\"')
    $escaped = $escaped.Replace("`r", '\r')
    $escaped = $escaped.Replace("`n", '\n')
    return '"' + $escaped + '"'
}

function Write-EmptyBundle {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    $content = "/* No existe una planilla local preparada. */`r`nwindow.TRANSPORT_LOCAL_BUNDLE = null;`r`n"
    [System.IO.File]::WriteAllText($BundlePath, $content, $encoding)
}

if (-not (Test-Path -LiteralPath $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir | Out-Null
}

$candidateNames = [System.Collections.Generic.List[string]]::new()

if (Test-Path -LiteralPath $ConfigPath) {
    try {
        $config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($config.archivoExcel) {
            $candidateNames.Add([string]$config.archivoExcel)
        }
        if ($config.archivosAlternativos) {
            foreach ($name in $config.archivosAlternativos) {
                if ($name) { $candidateNames.Add([string]$name) }
            }
        }
    }
    catch {
        Write-Warning "No se pudo leer data/config.json. Se utilizarán los nombres predeterminados."
    }
}

$defaults = @(
    "Planilla planificación diaria Transporte_OV.xlsx",
    "Planilla planificación diaria Transporte_OV (1).xlsx",
    "Planilla planificación diaria Transporte_OV_actualizada.xlsx",
    "Planilla planificación diaria Transporte.xlsx"
)
foreach ($name in $defaults) { $candidateNames.Add($name) }

$selectedFile = $null
$seen = @{}
foreach ($name in $candidateNames) {
    if ([string]::IsNullOrWhiteSpace($name)) { continue }
    if (-not $name.EndsWith(".xlsx", [System.StringComparison]::OrdinalIgnoreCase)) { continue }
    if ($name.Contains("\") -or $name.Contains("/") -or $name.Contains("..")) { continue }

    $key = $name.ToLowerInvariant()
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true

    $candidatePath = Join-Path $DataDir $name
    if (Test-Path -LiteralPath $candidatePath -PathType Leaf) {
        $selectedFile = Get-Item -LiteralPath $candidatePath
        break
    }
}

# Si el nombre varió, busca la planilla de transporte más reciente dentro de /data.
if ($null -eq $selectedFile) {
    $selectedFile = Get-ChildItem -LiteralPath $DataDir -File -Filter "*.xlsx" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notlike '~$*' -and $_.Name -match '(?i)planilla.*transporte' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

if ($null -eq $selectedFile) {
    Write-EmptyBundle
    Write-Warning "No se encontró una planilla .xlsx válida dentro de la carpeta data."
    exit 2
}

if ($selectedFile.Length -lt 100) {
    Write-EmptyBundle
    Write-Warning "La planilla encontrada está vacía o incompleta: $($selectedFile.Name)"
    exit 3
}

Write-Status "Preparando copia local desde: $($selectedFile.Name)"
$bytes = [System.IO.File]::ReadAllBytes($selectedFile.FullName)
$base64 = [System.Convert]::ToBase64String($bytes)
$generatedAt = [DateTime]::UtcNow.ToString("o")
$lastModified = $selectedFile.LastWriteTimeUtc.ToString("o")

$fileNameJs = ConvertTo-JavaScriptString $selectedFile.Name
$lastModifiedJs = ConvertTo-JavaScriptString $lastModified
$generatedAtJs = ConvertTo-JavaScriptString $generatedAt

$content = @"
/*
 * Archivo generado automáticamente.
 * No editar manualmente: ejecuta actualizar_datos_locales.cmd.
 */
window.TRANSPORT_LOCAL_BUNDLE = {
  fileName: $fileNameJs,
  lastModified: $lastModifiedJs,
  generatedAt: $generatedAtJs,
  base64: "$base64"
};
"@

$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($BundlePath, $content, $encoding)

$sizeMb = [Math]::Round((Get-Item -LiteralPath $BundlePath).Length / 1MB, 2)
Write-Status "Copia local actualizada correctamente: data/planilla-local.js ($sizeMb MB)"
exit 0
```

## `iniciar_dashboard.bat`

```bat
@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Dashboard de Transporte - Warehousing Chile

echo =====================================================
echo  Dashboard de Transporte - Warehousing Chile
echo =====================================================
echo.
echo 1. Actualizando la copia local de la planilla...

where powershell.exe >nul 2>nul
if errorlevel 1 goto SIN_POWERSHELL

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar_datos_locales.ps1" -Silencioso
if errorlevel 1 (
    echo AVISO: No se pudo actualizar la copia local.
    echo El dashboard se abrira igualmente y permitira carga manual.
    echo.
)

echo 2. Iniciando servidor local seguro...
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor_local.ps1"
if errorlevel 1 goto ERROR_SERVIDOR
exit /b 0

:SIN_POWERSHELL
echo No se encontro Windows PowerShell.
echo Abre el proyecto con Live Server en Visual Studio Code.
echo.
pause
exit /b 1

:ERROR_SERVIDOR
echo.
echo No fue posible iniciar el dashboard.
echo Revisa que el antivirus no haya bloqueado PowerShell.
echo Tambien puedes ejecutar: python server.py
echo.
pause
exit /b 1
```

## `ABRIR_DASHBOARD.cmd`

```bat
@echo off
call "%~dp0iniciar_dashboard.bat"
```

## `actualizar_datos_locales.cmd`

```bat
@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Actualizar datos locales del Dashboard

echo =====================================================
echo  Actualizar planilla local del Dashboard
echo =====================================================
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar_datos_locales.ps1"
echo.
if errorlevel 1 (
    echo No se pudo preparar la planilla. Revisa la carpeta data.
) else (
    echo Proceso finalizado correctamente.
)
echo.
pause
```

## `data/config.json`

```json
{
  "archivoExcel": "Planilla planificación diaria Transporte_OV.xlsx",
  "hoja": "Plan_Transporte",
  "archivosAlternativos": [
    "Planilla planificación diaria Transporte_OV (1).xlsx",
    "Planilla planificación diaria Transporte_OV_actualizada.xlsx",
    "Planilla planificación diaria Transporte.xlsx"
  ]
}
```

## `data/LEEME.txt`

```text
CARPETA DATA — DASHBOARD DE TRANSPORTE
======================================

Guarda aquí la planilla de transporte.

Nombre recomendado:
Planilla planificación diaria Transporte_OV.xlsx

Hoja obligatoria:
Plan_Transporte

ARCHIVOS DE ESTA CARPETA
- config.json: define el nombre principal y nombres alternativos.
- Planilla planificación diaria Transporte_OV.xlsx: fuente de datos.
- planilla-local.js: copia generada para poder abrir index.html directamente.

IMPORTANTE
No edites planilla-local.js manualmente.
Cada vez que reemplaces o actualices el Excel, ejecuta:

actualizar_datos_locales.cmd

o inicia el dashboard mediante:

iniciar_dashboard.bat

El iniciador actualiza automáticamente la copia local antes de abrir el dashboard.
```

## `README.md`

```markdown
# Dashboard de Transporte — ejecución corregida

Este proyecto procesa la planilla de transporte localmente y utiliza la hoja **`Plan_Transporte`**.

## Qué se corrigió

El dashboard se estaba abriendo con una dirección que comenzaba con `file:///C:/...`. En ese modo, Microsoft Edge y Google Chrome bloquean la lectura automática del Excel mediante `fetch()` por seguridad. Por eso aparecía **“Carga la planilla de transporte”**, aunque el archivo estuviera dentro de `/data`.

La versión corregida incorpora dos formas de trabajo:

1. **Servidor local automático**, sin exigir Python, mediante Windows PowerShell.
2. **Copia local preparada del Excel** (`data/planilla-local.js`) para que `index.html` también pueda abrirse directamente.

## Forma recomendada de abrirlo

1. Guarda la planilla dentro de:

```text
data/Planilla planificación diaria Transporte_OV.xlsx
```

2. Haz doble clic en:

```text
iniciar_dashboard.bat
```

También puedes usar:

```text
ABRIR_DASHBOARD.cmd
```

3. El proceso realizará lo siguiente:

- Buscará la planilla dentro de `/data`.
- Actualizará `data/planilla-local.js`.
- Iniciará un servidor local usando PowerShell incluido en Windows 11.
- Abrirá el navegador en una dirección similar a `http://127.0.0.1:8000/`.
- Cargará automáticamente la hoja `Plan_Transporte`.

**Mantén abierta la ventana del servidor mientras revisas el dashboard.** Para detenerlo, presiona `Ctrl + C` o cierra esa ventana.

## Abrir `index.html` directamente

Esta versión también permite hacer doble clic en `index.html`. En ese caso, el dashboard utiliza la última copia preparada en:

```text
data/planilla-local.js
```

Al reemplazar o actualizar el Excel, ejecuta primero:

```text
actualizar_datos_locales.cmd
```

Después podrás abrir `index.html` directamente y ver los datos actualizados.

> La copia preparada no reemplaza al Excel. Es una representación codificada que el navegador puede leer cuando trabaja con `file://`.

## Nombres de archivo admitidos

Primero se revisa `data/config.json`. Además, el actualizador reconoce estos nombres:

- `Planilla planificación diaria Transporte_OV.xlsx`
- `Planilla planificación diaria Transporte_OV (1).xlsx`
- `Planilla planificación diaria Transporte_OV_actualizada.xlsx`
- `Planilla planificación diaria Transporte.xlsx`

Si el nombre es distinto, buscará dentro de `/data` el archivo `.xlsx` más reciente cuyo nombre contenga las palabras **Planilla** y **Transporte**.

## Probar la carga automática

1. Confirma que el Excel está dentro de `/data`.
2. Ejecuta `iniciar_dashboard.bat`.
3. Verifica que el encabezado muestre el nombre del archivo.
4. Verifica que aparezca el mensaje:

```text
Planilla cargada automáticamente desde la carpeta data.
```

5. Confirma que los KPI, gráficos, filtros y tablas tengan información.

## Probar la apertura directa

1. Ejecuta una vez `actualizar_datos_locales.cmd`.
2. Haz doble clic en `index.html`.
3. La planilla debe cargarse desde `data/planilla-local.js` sin pedir selección manual.

## Probar la carga manual

1. Mueve temporalmente fuera de `/data` el archivo Excel.
2. Ejecuta `actualizar_datos_locales.cmd` para limpiar la copia anterior.
3. Abre el dashboard.
4. Debe aparecer el panel de carga manual.
5. Arrastra un `.xlsx` o presiona **Seleccionar archivo Excel**.
6. El sistema validará la extensión y la hoja `Plan_Transporte`.

## Alternativa con Python

Python sigue siendo compatible:

```bash
python server.py
```

o en algunos equipos:

```bash
py -3 server.py
```

## Alternativa con Visual Studio Code

1. Abre la carpeta del proyecto.
2. Instala la extensión **Live Server**.
3. Haz clic derecho sobre `index.html`.
4. Selecciona **Open with Live Server**.

## Archivos incorporados o modificados

| Archivo | Función |
|---|---|
| `js/app.js` | Intenta carga HTTP y, al abrir con `file://`, usa la copia local preparada. |
| `index.html` | Incluye `data/planilla-local.js` antes de iniciar la aplicación. |
| `iniciar_dashboard.bat` | Actualiza los datos e inicia el servidor PowerShell. |
| `ABRIR_DASHBOARD.cmd` | Acceso alternativo y visible para iniciar el dashboard. |
| `servidor_local.ps1` | Servidor web local incluido, sin Node.js ni Python obligatorios. |
| `actualizar_datos_locales.ps1` | Busca el Excel y genera la copia que puede leer `index.html`. |
| `actualizar_datos_locales.cmd` | Ejecuta el actualizador mediante doble clic. |
| `data/planilla-local.js` | Copia generada del Excel para modo `file://`. |
| `INSTRUCCIONES_RAPIDAS.txt` | Guía breve para los usuarios. |

No se modificaron los cálculos, filtros, gráficos, tablas ni la identidad visual.

## OneDrive

OneDrive puede almacenar y sincronizar la carpeta, pero existen dos escenarios distintos:

### Carpeta sincronizada en Windows

Funciona. Los usuarios deben tener la carpeta descargada en el equipo y ejecutar `iniciar_dashboard.bat`, o abrir `index.html` usando la copia preparada. Es recomendable marcar la carpeta como **“Mantener siempre en este dispositivo”**.

### Enlace web compartido de OneDrive

No funciona como publicación de un sitio web. OneDrive normalmente muestra una vista previa o descarga el archivo; no sirve los archivos HTML, CSS, JavaScript y Excel con comportamiento de servidor web.

Para entregar un enlace que abra el dashboard directamente en el navegador se requiere una plataforma de publicación, por ejemplo:

- Azure Static Web Apps.
- Servidor web interno.
- SharePoint mediante una solución autorizada por TI.
- GitHub Pages, solo cuando la política corporativa y la confidencialidad lo permitan.

## Errores frecuentes

### Abro `index.html` y aparecen datos antiguos

Ejecuta `actualizar_datos_locales.cmd` después de reemplazar el Excel.

### El iniciador indica que no encontró la planilla

Revisa que:

- El archivo esté dentro de `/data`.
- La extensión sea `.xlsx`.
- No sea un archivo temporal cuyo nombre empiece por `~$`.
- El archivo esté descargado localmente desde OneDrive.

### La ventana se cierra inmediatamente

Ejecuta `iniciar_dashboard.bat` desde una carpeta sincronizada localmente. Si el antivirus bloquea scripts, utiliza `python server.py` o Live Server y solicita autorización a TI.

### El puerto 8000 está ocupado

El servidor PowerShell y `server.py` prueban automáticamente puertos siguientes hasta encontrar uno disponible.

### El dashboard solicita carga manual

Revisa la consola del navegador con `F12 > Consola`. La aplicación registra allí el detalle técnico, pero mantiene la carga manual para no bloquear el uso.
```

## `VALIDACION_TECNICA.md`

```markdown
# Validación técnica — versión corregida

## Resultado

- Existe la carpeta `/data`.
- Existe `data/config.json`.
- Existe la planilla principal `.xlsx`.
- Se generó `data/planilla-local.js` desde la planilla real.
- `index.html` carga la copia local antes de `js/app.js`.
- `js/app.js` utiliza la copia local cuando el protocolo es `file://`.
- Mediante HTTP mantiene la búsqueda directa del Excel en `/data`.
- La carga manual continúa disponible como respaldo.
- Los errores técnicos se registran en la consola y no bloquean la interfaz.
- El iniciador ya no depende obligatoriamente de Python.
- Se agregó un servidor local compatible con Windows PowerShell.
- No se modificaron los archivos de cálculos, gráficos, filtros ni tablas.

## Pruebas automatizadas realizadas

- Verificación de sintaxis de todos los archivos JavaScript mediante Node.js.
- Verificación de las rutas referenciadas desde `index.html`.
- Arranque de `server.py` y respuesta HTTP de `index.html`, `data/config.json` y el Excel.
- Comprobación de que el archivo preparado se puede decodificar y coincide byte a byte con el `.xlsx` original.
- Comprobación de que el libro contiene la hoja `Plan_Transporte`.
- Comprobación de integridad del archivo ZIP final.

## Prueba final recomendada en Windows

1. Sincronizar o descargar completamente la carpeta desde OneDrive.
2. Ejecutar `iniciar_dashboard.bat`.
3. Confirmar que el navegador abre `http://127.0.0.1:<puerto>/`.
4. Confirmar que se muestran el nombre de la planilla, los registros, KPI y gráficos.
5. Cerrar la ventana del servidor al terminar.
```

## `INSTRUCCIONES_RAPIDAS.txt`

```text
DASHBOARD DE TRANSPORTE - INICIO RÁPIDO
============================================

OPCIÓN RECOMENDADA
1. Verifica que la planilla esté dentro de la carpeta data.
2. Haz doble clic en iniciar_dashboard.bat o ABRIR_DASHBOARD.cmd.
3. Mantén abierta la ventana azul/negra del servidor.
4. El navegador abrirá el dashboard y cargará la planilla automáticamente.

ABRIR INDEX.HTML DIRECTAMENTE
- Ahora también funciona gracias a data/planilla-local.js.
- Esa copia se actualiza al ejecutar iniciar_dashboard.bat.
- Si reemplazas el Excel y deseas seguir abriendo index.html directamente,
  ejecuta primero actualizar_datos_locales.cmd.

IMPORTANTE SOBRE ONEDRIVE
- La carpeta debe estar sincronizada o descargada en el computador.
- Un enlace web de OneDrive no publica index.html como sitio web.
- Para un enlace web directo se necesita SharePoint/SPFx, Azure Static Web Apps,
  GitHub Pages o un servidor interno autorizado por TI.
```

## `.vscode/extensions.json`

```json
{
  "recommendations": [
    "ritwickdey.liveserver",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ecmel.vscode-html-css",
    "christian-kohler.path-intellisense"
  ]
}
```

## `.vscode/settings.json`

```json
{
  "files.encoding": "utf8",
  "files.eol": "\n",
  "editor.formatOnSave": false,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "html.format.wrapLineLength": 140,
  "javascript.preferences.quoteStyle": "single",
  "liveServer.settings.port": 5500,
  "liveServer.settings.root": "/"
}
```

## `.gitignore`

```text
__pycache__/
*.pyc
.DS_Store
Thumbs.db
.vscode/*.log
```
