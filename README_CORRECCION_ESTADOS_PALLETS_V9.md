# Corrección integral v9 — estados, pallets y gráficos

## Problemas corregidos

- Los KPI **Entregados**, **Rechazados** y **Cancelados** aparecían en cero porque el encabezado real `Entregado/Rechazado` no coincidía con el alias interno al conservar la barra `/`.
- Los pallets se mostraban con decimales en KPI, gráficos, tablas, mapas y tooltips.
- Las etiquetas de gráficos mensuales podían superponerse en tarjetas de ancho normal.
- El navegador podía conservar archivos JavaScript anteriores por caché.

## Cambios aplicados

1. Normalización ampliada de encabezados, incluyendo `/`, `\\`, paréntesis, corchetes y otros separadores.
2. Estados operativos homologados:
   - Entregado, Despachado, Completado, Finalizado y Realizado → `ENTREGADO`.
   - Rechazado, No entregado, Devuelto y Fallido → `RECHAZADO`.
   - Cancelado, Anulado y Eliminado → `CANCELADO`.
   - Si el estado está vacío, pero existe una fecha real de entrega válida → `ENTREGADO`.
3. Pallets redondeados a enteros al importar el Excel y mostrados sin decimales en todas las vistas.
4. Etiquetas compactas en gráficos densos y omisión automática de etiquetas que no caben sin superponerse. Los tooltips mantienen el valor completo.
5. Versionado v9 en los scripts modificados para forzar la recarga del navegador.

## Archivos modificados

- `index.html`
- `js/excel-reader.js`
- `js/calculations.js`
- `js/filters.js`
- `js/dashboard.js`
- `js/charts.js`
- `js/table.js`

## Recomendación al publicar

Reemplazar todos los archivos anteriores por los de esta versión. Después de publicar, abrir el dashboard con `Ctrl + F5` una sola vez para descartar cualquier caché previa del navegador.

