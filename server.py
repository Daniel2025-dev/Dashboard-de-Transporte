"""Servidor local del Dashboard de Transporte.

Uso:
    python server.py

Publica únicamente la carpeta del proyecto, evita caché y abre el navegador.
Si el puerto 8000 está ocupado, prueba automáticamente los siguientes.
"""

from __future__ import annotations

import http.server
import os
import socketserver
import threading
import webbrowser
from email.utils import formatdate
from pathlib import Path
from urllib.parse import urlsplit

HOST = "127.0.0.1"
START_PORT = 8000
PORT_ATTEMPTS = 11
PROJECT_DIR = Path(__file__).resolve().parent
ONEDRIVE_EXCEL = Path(
    os.environ.get(
        "WAREHOUSING_TRANSPORT_EXCEL",
        "/home/daniel/Documentos/Trabajo /Transporte WH/Transporte_WH/"
        "CONSOLIDADO_TTE/Planilla planificación diaria Transporte_OV.xlsx",
    )
).expanduser()
LIVE_WORKBOOK_ENDPOINT = "/api/transport-workbook"
SOURCE_STATUS_ENDPOINT = "/api/source-status"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """Sirve los archivos del proyecto sin conservar versiones antiguas en caché."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".json": "application/json",
        ".js": "application/javascript",
    }

    def do_GET(self) -> None:
        """Entrega la planilla sincronizada sin exponer el resto de OneDrive."""

        request_path = urlsplit(self.path).path
        if request_path == LIVE_WORKBOOK_ENDPOINT:
            self._serve_live_workbook()
            return
        if request_path == SOURCE_STATUS_ENDPOINT:
            self._serve_source_status()
            return
        super().do_GET()

    def _serve_live_workbook(self) -> None:
        source = ONEDRIVE_EXCEL
        if not source.is_file():
            self.send_error(503, "La planilla sincronizada de OneDrive no está disponible.")
            return

        stat = source.stat()
        self.send_response(200)
        self.send_header(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.send_header("Content-Length", str(stat.st_size))
        self.send_header("Last-Modified", formatdate(stat.st_mtime, usegmt=True))
        self.send_header(
            "Content-Disposition",
            'inline; filename="Planilla_planificacion_diaria_Transporte_OV.xlsx"',
        )
        self.send_header("X-Workbook-Source", "onedrive-local-sync")
        self.end_headers()
        with source.open("rb") as workbook:
            self.copyfile(workbook, self.wfile)

    def _serve_source_status(self) -> None:
        import json

        available = ONEDRIVE_EXCEL.is_file()
        payload = {
            "available": available,
            "source": "onedrive-local-sync",
            "fileName": ONEDRIVE_EXCEL.name,
        }
        if available:
            stat = ONEDRIVE_EXCEL.stat()
            payload.update({"size": stat.st_size, "lastModified": stat.st_mtime})
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ReusableThreadingTCPServer(socketserver.ThreadingTCPServer):
    """Servidor reutilizable que atiende varios recursos en paralelo."""

    allow_reuse_address = True
    daemon_threads = True


def open_browser(url: str) -> None:
    """Abre el navegador después de iniciar el servidor."""

    webbrowser.open(url, new=2)


def create_server() -> tuple[ReusableThreadingTCPServer, int]:
    """Busca el primer puerto disponible entre 8000 y 8010."""

    last_error: OSError | None = None
    for port in range(START_PORT, START_PORT + PORT_ATTEMPTS):
        try:
            return ReusableThreadingTCPServer((HOST, port), NoCacheHandler), port
        except OSError as error:
            last_error = error

    raise OSError(
        f"No hay puertos disponibles entre {START_PORT} y "
        f"{START_PORT + PORT_ATTEMPTS - 1}."
    ) from last_error


def main() -> None:
    """Inicia el servidor HTTP local."""

    os.chdir(PROJECT_DIR)

    try:
        httpd, port = create_server()
        url = f"http://{HOST}:{port}/"

        with httpd:
            print("=" * 58)
            print(" Dashboard de Transporte - Warehousing Chile")
            print("=" * 58)
            print(f"Carpeta: {PROJECT_DIR}")
            print(f"Dirección: {url}")
            print(f"Fuente OneDrive: {ONEDRIVE_EXCEL}")
            print(f"Estado fuente: {'disponible' if ONEDRIVE_EXCEL.is_file() else 'no disponible'}")
            print("Mantén esta ventana abierta mientras uses el dashboard.")
            print("Para detener el servidor, presiona Ctrl + C.")
            print()

            threading.Timer(0.8, open_browser, args=(url,)).start()
            httpd.serve_forever()
    except OSError as error:
        print("No fue posible iniciar el servidor local.")
        print(f"Detalle técnico: {error}")
        input("Presiona Enter para cerrar...")
    except KeyboardInterrupt:
        print("\nServidor detenido correctamente.")


if __name__ == "__main__":
    main()
