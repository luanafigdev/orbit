from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


class OrbitHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    project = Path(__file__).resolve().parent
    handler = partial(OrbitHandler, directory=str(project))
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    url = f'http://127.0.0.1:{server.server_port}/'
    print(f'ORBIT aberto em: {url}', flush=True)
    print('Mantenha esta janela aberta enquanto estiver usando o site.', flush=True)
    webbrowser.open(url)
    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        print('Encerrando ORBIT...')
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
