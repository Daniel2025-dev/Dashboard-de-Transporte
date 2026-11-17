# Corrección gráfica v10 — estabilidad y contraste

## Resultado

- Se eliminó el redibujado de los gráficos al mover el mouse.
- Se desactivaron resaltados, filtros por clic, leyendas con clic y tooltips dentro de los gráficos.
- Los canvas mantienen ancho y alto constantes; ya no cambian de proporción al pasar el cursor.
- Se conserva la descarga y la expansión de cada tarjeta.
- La vista ampliada utiliza fondo blanco, cabecera blanca y contraste corporativo.
- Se eliminó la capa ploma semitransparente que aparecía dentro de los gráficos ampliados.
- Las etiquetas compactas y el control de superposición permanecen activos.
- Se agregó una hoja de estilos final independiente para evitar conflictos con reglas antiguas.

## Archivos modificados

- `index.html`
- `js/charts.js`
- `js/ui-enhancements.js`
- `css/styles.css`
- `css/static-charts-v10.css`

## Publicación

Reemplazar todos los archivos indicados y agregar `css/static-charts-v10.css`. Después de publicar, abrir el dashboard y presionar `Ctrl + F5` una vez.

