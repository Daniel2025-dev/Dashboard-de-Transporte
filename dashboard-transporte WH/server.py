"""Servidor local del Dashboard de Transporte.

Uso:
    python server.py

Publica únicamente la carpeta del proyecto, evita caché y abre el navegador.
Si el puerto 8000 está ocupado, prueba automáticamente los siguientes.
"""

from __future__ import annotations

import http.server
import socketserver
import threading
import webbrowser
from pathlib import Path

HOST = "127.0.0.1"
START_PORT = 8000
PORT_ATTEMPTS = 11
PROJECT_DIR = Path(__file__).resolve().parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """Sirve los archivos del proyecto sin conservar versiones antiguas en caché."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".json": "application/json",
        ".js": "application/javascript",
    }

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

    import os

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
