"""Pinta cada lámina con sus colores de números, con luz y sombra suaves, y la guarda para el Rompecabezas y la Memoria.

Si en Documentos\\laminas-color hay una versión a color con el mismo nombre (por ejemplo gato.png), usa esa.

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
# los mismos 12 colores del juego de números, en tonos más suaves para la versión terminada
NUMS = [None, '#8ED3F5', '#FFD35C', '#78C95A', '#FF9A4D', '#F05A5E', '#A884E0',
        '#A26B47', '#FF9EC6', '#4A86E8', '#FFFFFF', '#B4B9CC', '#3E3B57']
# fondo suave por categoría (arriba, abajo): así las piezas del fondo no son todas blancas
FONDOS = {
    'animales': ('#E4F4FF', '#DDF2D2'), 'vehiculos': ('#E6EEFF', '#F3EBDD'),
    'naturaleza': ('#E9F7FF', '#E2F5D8'), 'dulces': ('#FFEAF3', '#FFF4DC'),
    'halloween': ('#EDE6FF', '#FFE9D6'),
}
CAPA_FONDO = ('#F2F0FF', '#FFF6E3')
VERDE_HOJA, CIELO = '#A6DB8C', '#BFE6FA'


def hex_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


def aclarar(c, t):
    return c + (255 - c) * t


def banda(lab, dy, dx):
    """Píxeles de cada zona cuyo vecino desplazado (dy, dx) ya es otra zona: el borde de ese lado."""
    otro = np.roll(lab, (dy, dx), axis=(0, 1))
    return (lab != otro) & (lab > 0)


def pintar(png, numeros, cat):
    g = np.asarray(Image.open(png).convert('L'), dtype=np.float32)
    n = g.shape[0]
    claro = g >= LINE_T
    lab, k = ndi.label(claro)
    tam = np.bincount(lab.ravel(), minlength=k + 1)
    borde = np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])
    borde = borde[borde > 0]
    fondo = np.bincount(borde, minlength=k + 1).argmax() if borde.size else 0
    toca_borde = np.zeros(k + 1, bool)
    toca_borde[np.unique(borde)] = True
    color = np.full((k + 1, 3), 255, dtype=np.float32)
    pintada = np.zeros(k + 1, bool)
    for x, y, num in numeros:
        r = lab[min(n - 1, int(y * n)), min(n - 1, int(x * n))]
        if r and 0 < num < len(NUMS):
            color[r] = hex_rgb(NUMS[num])
            pintada[r] = True
    # zonas grandes sin número (hojas, pasto, cielo de la escena): se pintan para que nada quede en blanco
    chica = n * n * 0.0015
    cy = ndi.center_of_mass(np.ones_like(lab), lab, range(k + 1)) if k else []
    vec = {}
    if k:
        dil = ndi.grey_dilation(lab, size=(5, 5))
        m = (dil != lab) & (lab > 0) & (dil > 0)
        for a_, b_ in zip(lab[m].tolist(), dil[m].tolist()):
            vec.setdefault(a_, set()).add(b_)
    for r in range(1, k + 1):
        if r == fondo or pintada[r] or tam[r] < chica:
            continue
        if toca_borde[r]:
            color[r] = hex_rgb(VERDE_HOJA if cy[r][0] > n * 0.45 else CIELO)
        else:
            vs = [v for v in vec.get(r, ()) if pintada[v] and v != fondo]
            if vs:
                v = max(vs, key=lambda q: tam[q])
                color[r] = aclarar(color[v], 0.55)
            else:
                color[r] = hex_rgb(VERDE_HOJA)
    # cada píxel de línea toma el color de la zona más cercana (bordes suaves sin halo blanco)
    _, (iy, ix) = ndi.distance_transform_edt(~claro, return_indices=True)
    duena = lab[iy, ix]
    rgb = color[duena]
    es_fondo = (duena == fondo)[..., None] if fondo else np.zeros((n, n, 1), bool)
    if fondo:
        arriba, abajo = (hex_rgb(c) for c in FONDOS.get(cat, CAPA_FONDO))
        t = np.linspace(0, 1, n, dtype=np.float32)[:, None, None]
        grad = arriba * (1 - t) + abajo * t
        # sombra suave en el piso, debajo de la figura
        fig = (duena != fondo)
        ys, xs = np.nonzero(fig)
        if ys.size and ys.max() < n * 0.97:
            yb, x0, x1 = ys.max(), np.percentile(xs, 8), np.percentile(xs, 92)
            yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
            e = ((xx - (x0 + x1) / 2) / ((x1 - x0) * 0.5)) ** 2 + ((yy - yb) / (n * 0.028)) ** 2
            sombra = np.clip(1 - e, 0, 1) ** 1.5 * 0.16
            grad = grad * (1 - sombra[..., None])
        rgb = np.where(es_fondo, np.broadcast_to(grad, rgb.shape), rgb)
    # luz desde arriba a la izquierda: sombra en el borde de abajo a la derecha y brillo arriba a la izquierda
    zona = duena.copy()
    if fondo:
        zona[duena == fondo] = 0
    # solo en las formas grandes: las zonas chicas (pelo, rayas) quedan planas para no verse en relieve
    d = max(3, int(n * 0.032))
    h = max(2, int(n * 0.014))
    media = (tam[zona] > n * n * 0.006) & (zona > 0)
    grande = (tam[zona] > n * n * 0.012) & (zona > 0)
    sombra = ndi.gaussian_filter((banda(zona, -d, -d) & media).astype(np.float32), d * 0.8)
    brillo = ndi.gaussian_filter((banda(zona, h, h) & grande).astype(np.float32), h * 0.9)
    sombra = np.where(media, np.clip(sombra * 1.5, 0, 1), 0)
    brillo = np.where(grande, np.clip(brillo * 1.3, 0, 1), 0)
    rgb = rgb * (1 - 0.15 * sombra[..., None])
    rgb = rgb + (255 - rgb) * (0.22 * brillo[..., None])
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
        propia = next((q for q in (raiz.parent / 'laminas-color').glob(e['id'] + '.*')
                       if q.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp')), None) if (raiz.parent / 'laminas-color').is_dir() else None
        if propia:
            # versión a color hecha a mano o con IA: se recorta al cuadrado y se usa tal cual
            im = Image.open(propia).convert('RGB')
            w, h = im.size
            lado = min(w, h)
            img = im.crop(((w - lado) // 2, (h - lado) // 2, (w + lado) // 2, (h + lado) // 2)).resize((LADO, LADO), Image.LANCZOS)
        else:
            img = pintar(dib / e['file'], e['numeros'], e.get('cat'))
        img.save(salida / f"{e['id']}.webp", 'WEBP', quality=80, method=6)
        hechos += 1
    print(f'listo: {hechos} imágenes en {salida}')


if __name__ == '__main__':
    main()
