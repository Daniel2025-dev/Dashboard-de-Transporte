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
