# Validación de la corrección por Fecha de necesidad

## Causa encontrada

El archivo publicado actualmente en GitHub todavía utiliza esta prioridad para el período:

1. Fecha de entrega.
2. Fecha de necesidad.
3. Fecha de solicitud.

Por eso cuatro registros cuya **Fecha de necesidad es 03-08-2026** siguen apareciendo en julio, ya que su Fecha de entrega está en julio.

## Resultado comprobado con la planilla adjunta

| Regla | Servicios julio 2026 | Venta julio 2026 |
|---|---:|---:|
| Código anterior: entrega → necesidad → solicitud | 252 | $39,046,806 |
| Código corregido: solo Fecha de necesidad, columna C | 248 | $35,544,863 |

Los cuatro registros movidos correctamente desde julio hacia agosto suman:

**$3,501,943**

El detalle está en `VALIDACION_REGISTROS_MOVIDOS_A_AGOSTO.csv`.

## Diferencia con el monto indicado de $35.479.302

La planilla adjunta contiene además este registro válido de julio:

- Fila: 7684
- ID: `WH_2026_2489`
- Fecha de necesidad: 28-07-2026
- Cliente: `Comercializadora y Asorias Ortsac SPA`
- Venta Total: $65,561

Al restar ese registro:

$35,544,863 - $65,561 = **$35,479,302**

Por eso el monto de **$35.479.302** corresponde al total anterior a incorporar ese registro.

La corrección entregada no elimina el registro porque la columna C lo identifica correctamente como julio. Para excluirlo, debe corregirse o eliminarse en Excel, o definirse una regla de negocio adicional.

## Archivos para reemplazar en GitHub

- `index.html`
- `js/excel-reader.js`
- `data/config.json`
- `data/Planilla planificación diaria Transporte_OV.xlsx`

El `index.html` incorpora una versión en la URL del JavaScript para evitar que Edge reutilice el archivo antiguo desde la memoria caché.
