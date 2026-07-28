# Corrección: períodos por Fecha de necesidad

## Regla aplicada

El Año, Mes, rango de fechas, tablas mensuales, gráficos mensuales y comparaciones interanuales se calculan **exclusivamente** desde la columna `Fecha de necesidad` de la hoja `Plan_Transporte`.

Las columnas `Fecha_ Entrega _tte` y `Fecha de Solicitud` se conservan como información de detalle, pero ya no pueden trasladar una venta o servicio a otro mes.

## Archivos modificados

- `js/excel-reader.js`: define `Fecha de necesidad` como fecha única del período.
- `js/dashboard.js`: actualiza el mensaje de calidad de datos.
- `js/table.js`: muestra y ordena inicialmente por `Fecha de necesidad`.

## Cómo subir a GitHub

Copia estas carpetas y archivos sobre el repositorio local, acepta reemplazar los archivos existentes y realiza `Commit to main` y luego `Push origin` desde GitHub Desktop.

## Validación esperada

Al seleccionar un año y revisar la fila de julio, la venta debe coincidir con la suma de `Venta Total` para las filas cuya `Fecha de necesidad` pertenezca a julio del año seleccionado. Los registros sin una `Fecha de necesidad` válida quedan fuera de los meses y son informados como incompletos.
