# Publicación en GitHub Pages

Esta carpeta está preparada para publicarse directamente en:

`https://daniel2025-dev.github.io/Dashboard-de-Transporte/`

## Archivos obligatorios en la raíz del repositorio

- `index.html`
- `.nojekyll`
- carpeta `css`
- carpeta `js`
- carpeta `assets`
- carpeta `data`

No subas solamente `index.html` ni el archivo ZIP sin descomprimir.

## Configuración de GitHub Pages

1. Abre el repositorio.
2. Ve a **Settings > Pages**.
3. En **Source**, selecciona **Deploy from a branch**.
4. Selecciona la rama **main**.
5. Selecciona la carpeta **/(root)**.
6. Presiona **Save**.
7. Espera a que la publicación termine.
8. Abre la dirección del dashboard y presiona `Ctrl + F5`.

## Carga automática del Excel

El archivo debe estar en:

`data/Planilla planificación diaria Transporte_OV.xlsx`

La configuración se encuentra en:

`data/config.json`

## Advertencia

El repositorio y GitHub Pages son públicos. La planilla incluida puede contener información empresarial accesible desde internet.
