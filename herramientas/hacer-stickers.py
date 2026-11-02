"""Recorta cada lámina a color (dibujos/color/<id>.webp) como sticker con borde blanco.

Uso (dentro de la carpeta del juego):  python herramientas/hacer-stickers.py
Escribe dibujos/sticker/<id>.webp (320 px, fondo transparente). Corre después de colorear-rompecabezas.py.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

LINE_T = 140
LADO = 320


def mascara(png):
    """Píxeles que no son el fondo de la lámina (la zona clara que más toca el borde)."""
    g = np.asarray(Image.open(png).convert('L'))
    claro = g >= LINE_T
    lab, k = ndi.label(claro)
    borde = np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])
    borde = borde[borde > 0]
    fondo = np.bincount(borde, minlength=k + 1).argmax() if borde.size else 0
    m = lab != fondo
    m = ndi.binary_fill_holes(m)
    # quita puntitos sueltos (menos de 0,05 % de la hoja)
    lab2, k2 = ndi.label(m)
    if k2:
        tam = np.bincount(lab2.ravel())
        chicos = tam < m.size * 0.0005
        chicos[0] = False
        m[chicos[lab2]] = False
    return m


def sticker(color_img, m):
    n = m.shape[0]
    pad = int(n * 0.035)
    borde = ndi.binary_dilation(m, iterations=pad)
    borde = ndi.binary_fill_holes(borde)
    ys, xs = np.nonzero(borde)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    lado = max(y1 - y0, x1 - x0) + 8
    cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
    col = np.asarray(color_img.convert('RGB').resize((n, n), Image.LANCZOS))
    rgba = np.zeros((n, n, 4), np.uint8)
    rgba[borde] = (255, 255, 255, 255)
    rgba[m, :3] = col[m]
    img = Image.fromarray(rgba, 'RGBA')
    # suaviza el borde del recorte
    a = img.getchannel('A').filter(ImageFilter.GaussianBlur(1.2))
    img.putalpha(a)
    caja = (cx - lado // 2, cy - lado // 2, cx - lado // 2 + lado, cy - lado // 2 + lado)
    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    lienzo.paste(img.crop((max(0, caja[0]), max(0, caja[1]), min(n, caja[2]), min(n, caja[3]))),
                 (max(0, -caja[0]), max(0, -caja[1])))
    return lienzo.resize((LADO, LADO), Image.LANCZOS)


def main():
    raiz = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
    dib = raiz / 'dibujos'
    datos = json.loads((dib / 'dibujos.json').read_text(encoding='utf-8'))
    salida = dib / 'sticker'
    salida.mkdir(exist_ok=True)
    hechos = 0
    for e in datos['dibujos']:
        col = dib / 'color' / f"{e['id']}.webp"
        if not col.exists():
            continue
        st = sticker(Image.open(col), mascara(dib / e['file']))
        st.save(salida / f"{e['id']}.webp", 'WEBP', quality=82, method=6)
        hechos += 1
    print(f'listo: {hechos} stickers en {salida}')


if __name__ == '__main__':
    main()
