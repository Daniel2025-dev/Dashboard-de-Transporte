# Validación de la corrección

- Se eliminó el orden anterior: Fecha de entrega → Fecha de necesidad → Fecha de solicitud.
- `__date`, `__year`, `__month` y `__monthName` ahora nacen únicamente de `Fecha de necesidad`.
- Los filtros Año, Mes, Desde y Hasta utilizan esos campos centrales.
- Las tablas y gráficos mensuales usan `__month`, por lo que heredan la corrección.
- Las comparaciones con el año anterior usan el mismo criterio de Fecha de necesidad.
- No se modificaron fórmulas de venta, costo, utilidad, margen, pallets ni conteo de ID único.
- Los archivos JavaScript pasan validación de sintaxis con Node.js.
