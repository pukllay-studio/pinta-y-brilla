"""Pinta cada lámina con sus colores de números y la guarda como imagen para el Rompecabezas.

Uso (dentro de la carpeta del juego):  python herramientas/colorear-rompecabezas.py
Lee dibujos/dibujos.json y dibujos/<lámina>.png y escribe dibujos/color/<id>.webp (800 px).
Las letras y números (ids letra-*, num-*) no llevan rompecabezas.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

LINE_T = 140
LADO = 800
NUMS = [None, '#7EC8F0', '#FFD23F', '#6CC24A', '#FF8A3D', '#E8424C', '#9B6BD6',
        '#8B5A3C', '#FF8FB8', '#2F6FD6', '#FFFFFF', '#9AA0B4', '#34324A']
# fondo suave por categoría (arriba, abajo): así las piezas del fondo no son todas blancas
FONDOS = {
    'animales': ('#E4F4FF', '#DDF2D2'), 'vehiculos': ('#E6EEFF', '#F3EBDD'),
    'naturaleza': ('#E9F7FF', '#E2F5D8'), 'dulces': ('#FFEAF3', '#FFF4DC'),
    'halloween': ('#EDE6FF', '#FFE9D6'),
}
CAPA_FONDO = ('#F2F0FF', '#FFF6E3')


def hex_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


def pintar(png, numeros, cat):
    g = np.asarray(Image.open(png).convert('L'), dtype=np.float32)
    n = g.shape[0]
    claro = g >= LINE_T
    lab, k = ndi.label(claro)
    borde = np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])
    borde = borde[borde > 0]
    fondo = np.bincount(borde, minlength=k + 1).argmax() if borde.size else 0
    color = np.full((k + 1, 3), 255, dtype=np.float32)
    for x, y, num in numeros:
        r = lab[min(n - 1, int(y * n)), min(n - 1, int(x * n))]
        if r and 0 < num < len(NUMS):
            color[r] = hex_rgb(NUMS[num])
    # cada píxel de línea toma el color de la zona más cercana (bordes suaves sin halo blanco)
    _, (iy, ix) = ndi.distance_transform_edt(~claro, return_indices=True)
    duena = lab[iy, ix]
    rgb = color[duena]
    if fondo:
        arriba, abajo = (hex_rgb(c) for c in FONDOS.get(cat, CAPA_FONDO))
        t = np.linspace(0, 1, n, dtype=np.float32)[:, None, None]
        grad = arriba * (1 - t) + abajo * t
        es_fondo = (duena == fondo)[..., None]
        rgb = np.where(es_fondo, np.broadcast_to(grad, rgb.shape), rgb)
    # multiplica por el gris original: las líneas quedan oscuras y suaves
    tinta = np.array([52, 50, 74], dtype=np.float32)
    a = (g / 255.0)[..., None]
    out = rgb * a + tinta * (1 - a)
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGB')
    return img.resize((LADO, LADO), Image.LANCZOS)


def main():
    raiz = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
    dib = raiz / 'dibujos'
    datos = json.loads((dib / 'dibujos.json').read_text(encoding='utf-8'))
    salida = dib / 'color'
    salida.mkdir(exist_ok=True)
    hechos = 0
    for e in datos['dibujos']:
        if e['id'].startswith(('letra-', 'num-')) or not e.get('numeros'):
            continue
        img = pintar(dib / e['file'], e['numeros'], e.get('cat'))
        img.save(salida / f"{e['id']}.webp", 'WEBP', quality=80, method=6)
        hechos += 1
    print(f'listo: {hechos} imágenes en {salida}')


if __name__ == '__main__':
    main()
