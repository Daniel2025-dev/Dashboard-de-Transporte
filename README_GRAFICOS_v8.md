# Corrección definitiva de tamaño de gráficos v8

## Problema
Las versiones anteriores conservaban reglas antiguas y reglas nuevas que competían entre sí.
Aunque v7 reducía los límites, algunos canvases aún podían verse demasiado grandes.

## Solución v8
Se elimina completamente el ancho dinámico de JavaScript y se fija una única regla final:

- ancho del gráfico = 100% de su tarjeta;
- ningún `min-width` puede ampliar la tarjeta;
- alto fijo por módulo;
- modo expandido máximo 460 px;
- tablet y celular usan alturas menores;
- se mantienen etiquetas completas, tooltips, hover e interacción.

## Archivos a reemplazar
- `index.html`
- `css/styles.css`
- `js/charts.js`

No se modifican cálculos, filtros, Excel, mapa ni lógica de negocio.
