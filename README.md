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
