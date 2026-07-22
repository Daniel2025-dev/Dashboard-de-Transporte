# Análisis del archivo y diccionario de datos

## Resultado del análisis inicial

Archivo analizado: `Planilla planificación diaria Transporte_OV.xlsx`  
Hoja utilizada: `Plan_Transporte`  
Fila de encabezados: 10  
Rango de la tabla identificado: `A10:AJ7599`  
Columnas: 36  
Filas con contenido: 7.588

### Resumen de calidad observado

| Revisión | Resultado |
|---|---:|
| IDs con contenido | 7.580 |
| IDs únicos | 7.580 |
| IDs duplicados | 0 |
| Clientes distintos | 73 |
| Empresas transportistas distintas | 11 |
| Destinos distintos | 101 |
| Registros incompletos en campos esenciales | 14 |
| Posibles duplicados por llave compuesta | 10 |
| Servicios con venta cero | 65 |
| Servicios con costo cero | 32 |
| Servicios con costo mayor que venta | 1.592 |
| Servicios con margen negativo | 1.637 |

Los conteos del dashboard se recalculan en cada carga y pueden variar cuando la planilla se actualice.

### Períodos detectados

La mayoría de los registros pertenece a 2024, 2025 y 2026. Se detectaron fechas antiguas aisladas en las columnas de entrega/factura; el dashboard las marca como observación y usa la fecha alternativa válida cuando está disponible.

### Principales categorías observadas

- Cliente con mayor cantidad de filas: `FORD MOTOR COMPANY CHILE SPA`.
- Empresa transportista con mayor cantidad de filas: `TRANSPORTE CARGO TRADER`.
- La columna `Region` contiene solamente `RM` y `RG` en los registros poblados.
- Estados encontrados: `ENTREGADO`, `RECHAZADO` y `CANCELADO`.

## Relación entre columnas y dashboard

| Nº | Columna real | Tipo | Uso | Cálculo o indicador |
|---:|---|---|---|---|
| 1 | `ID` | Texto | Identificador del servicio y trazabilidad | Conteo de servicios únicos; control de duplicados |
| 2 | `Fecha de Solicitud` | Fecha | Fecha en que se pide el servicio | Tercera alternativa para asignar período |
| 3 | `Fecha de necesidad` | Fecha | Fecha requerida por la operación | Segunda alternativa para asignar período |
| 4 | `Fecha_ Entrega _tte` | Fecha | Fecha principal del servicio | Año, mes, evolución y comparación interanual |
| 5 | `Cliente` | Texto | Cliente asociado | Filtro, ranking, participación y rentabilidad |
| 6 | `Direccion ` | Texto | Dirección del servicio | Detalle y frecuencia de direcciones |
| 7 | `Destino` | Texto | Comuna o ciudad de destino | Filtro, ranking y distribución geográfica |
| 8 | `Region ` | Categoría | Clasificación RM/RG del archivo | Filtro y participación geográfica esquemática |
| 9 | `Puntos de Entrega` | Texto | Punto específico de entrega | Detalle operativo |
| 10 | `Empresa_transp ` | Texto | Proveedor de transporte | Filtro, ranking, costos, venta y margen |
| 11 | `N° Pedido` | Texto | Número de pedido | Trazabilidad y llave de duplicado potencial |
| 12 | `Guía de despacho` | Texto | Documento de despacho | Trazabilidad y llave de duplicado potencial |
| 13 | `Cita` | Texto / número | Referencia de cita | Detalle operativo |
| 14 | `Hora_Cita` | Hora | Hora comprometida | Detalle del registro |
| 15 | `Pallets solicitados` | Número | Cantidad solicitada | Respaldo cuando no existe cantidad entregada |
| 16 | `Pallets Entregados` | Número | Cantidad efectivamente entregada | Total pallets, promedio y evolución mensual |
| 17 | `Devolución Pallets` | Número | Diferencia o devolución | Control operativo en tabla de detalle |
| 18 | `Peso` | Número | Peso transportado | Peso total y promedio por servicio |
| 19 | `Venta ` | Moneda CLP | Venta base | Componente de la venta total |
| 20 | `Exigencia Peoneta` | Categoría | Indica si requiere peoneta | KPI y control operacional |
| 21 | `N° Peoneta` | Número | Cantidad de peonetas | Detalle del servicio adicional |
| 22 | `Peoneta` | Moneda CLP | Venta por peoneta | Componente de la venta total |
| 23 | `Costo TTE` | Moneda CLP | Costo principal del transporte | Componente del costo total |
| 24 | `Costo Peoneta` | Moneda CLP | Costo de peoneta | Componente del costo total |
| 25 | `Otros Costos` | Moneda CLP | Costos adicionales | Componente del costo total |
| 26 | `Costo total` | Moneda CLP | Costo consolidado | KPI, evolución, alertas y rentabilidad |
| 27 | `Venta Total` | Moneda CLP | Venta consolidada | KPI, evolución, rankings y rentabilidad |
| 28 | `Margen $` | Moneda CLP | Utilidad guardada | Se valida, pero el dashboard recalcula Venta - Costo |
| 29 | `MG` | Porcentaje | Margen guardado | Se valida, pero el dashboard recalcula Utilidad / Venta |
| 30 | `Factura_tte` | Texto / número | Factura del transportista | Control documental en detalle |
| 31 | `Fecha_Factura` | Fecha | Fecha de factura | Calidad y control documental |
| 32 | `Entregado/Rechazado` | Categoría | Estado del servicio | Filtro, KPI y distribución por estado |
| 33 | `OBS 2` | Texto | Observación operativa | Detalle del registro |
| 34 | `OBS 3` | Texto | Observación adicional | Detalle del registro |
| 35 | `Motivo` | Texto | Motivo de excepción o rechazo | Análisis de alertas y detalle |
| 36 | `Responsable` | Texto | Responsable del registro | Seguimiento operativo |

## Campos no identificados

| Campo solicitado | Estado | Alternativa propuesta |
|---|---|---|
| Tipo de servicio | No existe una columna identificable | Agregar `Tipo de servicio` con categorías controladas |
| Comuna de origen | No existe | Agregar `Comuna de origen`; no deducir desde dirección |
| Centro o bodega | No existe | Agregar `Centro/Bodega` con lista estandarizada |
| Coordenadas | No existen sistemáticamente | Mantener catálogo autorizado de comunas/coordenadas o integrar geocodificación aprobada |
| Ruta origen-destino | No calculable | Requiere origen normalizado y destino normalizado |

## Indicadores implementados

| Indicador | Fórmula |
|---|---|
| Total de servicios | Conteo de ID único; llave de respaldo si falta ID |
| Total de pallets | Suma de pallets entregados; respaldo en solicitados |
| Venta total | Suma de `Venta Total` |
| Costo total | Suma de `Costo total` |
| Utilidad total | Venta total - Costo total |
| Margen porcentual | Utilidad total / Venta total |
| Venta promedio | Venta total / total de servicios |
| Costo promedio | Costo total / total de servicios |
| Utilidad promedio | Utilidad total / total de servicios |
| Variación interanual | (Actual - Anterior) / Anterior |
| Participación | Servicios del grupo / servicios totales |

## Validaciones de carga

- Extensión `.xlsx`.
- Existencia de la hoja `Plan_Transporte`.
- Detección de encabezados dentro de las primeras 40 filas.
- Conversión de números con formato chileno e internacional.
- Conversión de fechas Excel y fechas escritas.
- Fechas fuera de rango razonable.
- Campos esenciales vacíos.
- IDs duplicados.
- Coincidencias potenciales por fecha, cliente, pedido, guía y dirección.
- Venta y costo inválidos.
- Venta cero, costo cero, costo mayor que venta y margen negativo.
