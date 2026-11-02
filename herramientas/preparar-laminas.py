"""Prepara láminas nuevas para Pinta y Brilla.

Toma las imágenes de una carpeta (por defecto Documentos/laminas-nuevas), las limpia
(fondo blanco, sin grises, sin puntitos sueltos, huecos pequeños cerrados), las deja en
1024 x 1024 y calcula los números para "pintar por números" con colores distintos entre
zonas vecinas. Luego las copia a dibujos/ y actualiza dibujos/dibujos.json.

Uso, dentro de la carpeta del juego:
    pip install pillow numpy scipy
    python herramientas/preparar-laminas.py                      (usa Documentos/laminas-nuevas)
    python herramientas/preparar-laminas.py C:/ruta/a/mis-laminas

No sube nada a internet. Si una lámina tiene un problema, lo dice y no la agrega.
"""
import json, os, re, sys, unicodedata
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

N = 1024
LINE_T = 140                     # igual que el juego: más oscuro que esto es línea
MIN_ZONE = int(N * N * 0.0015)   # zonas más chicas que ~40x40 px no llevan número (un niño no las toca bien)
MAX_BYTES = 25 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 60_000_000   # evita imágenes gigantes o malformadas
OK_EXT = {'.png', '.jpg', '.jpeg', '.webp'}
# colores de la paleta fija de números del juego (índices de NUMS), en orden de preferencia
PALETA = [5, 2, 9, 3, 4, 8, 6, 1, 7]

# la lista de las 50 láminas (archivo -> nombre, categoría)
LISTA = {
 'gato':('Gato','animales'),'perro':('Perro','animales'),'pez':('Pez','animales'),'dino':('Dinosaurio','animales'),
 'tortuga':('Tortuga','animales'),'buho':('Búho','animales'),'mariquita':('Mariquita','animales'),'pulpo':('Pulpo','animales'),
 'conejo':('Conejo','animales'),'llama':('Llama','animales'),'leon':('León','animales'),'elefante':('Elefante','animales'),
 'mono':('Mono','animales'),'oso-anteojos':('Oso de anteojos','animales'),'condor':('Cóndor','animales'),'mariposa':('Mariposa','animales'),
 'auto':('Auto','vehiculos'),'cohete':('Cohete','vehiculos'),'barco':('Barco','vehiculos'),'globo':('Globo','vehiculos'),
 'tren':('Tren','vehiculos'),'avion':('Avión','vehiculos'),'bus':('Bus escolar','vehiculos'),'tractor':('Tractor','vehiculos'),
 'helicoptero':('Helicóptero','vehiculos'),
 'flor':('Flor','naturaleza'),'casita':('Casita','naturaleza'),'arcoiris':('Arcoíris','naturaleza'),'hongo':('Hongo','naturaleza'),
 'sol':('Sol','naturaleza'),'arbol':('Árbol','naturaleza'),'luna':('Luna y estrellas','naturaleza'),'cactus':('Cactus','naturaleza'),
 'playa':('Playa','naturaleza'),
 'helado':('Helado','dulces'),'cupcake':('Cupcake','dulces'),'dona':('Dona','dulces'),'torta':('Torta','dulces'),
 'paleta':('Paleta','dulces'),'fresa':('Fresa','dulces'),'galleta':('Galleta','dulces'),'chocolate':('Chocolate caliente','dulces'),
 'sandia':('Sandía','dulces'),
 'calabaza':('Calabaza','halloween'),'fantasma':('Fantasma','halloween'),'gatito-bruja':('Gatito con sombrero','halloween'),
 'murcielago':('Murciélago','halloween'),'dulces-halloween':('Balde de dulces','halloween'),'castillo':('Castillo','halloween'),
 'brujita':('Brujita','halloween'),
}

# color principal, color de detalles y colores de acento por lámina (índices de NUMS:
# 1 celeste, 2 amarillo, 3 verde, 4 naranja, 5 rojo, 6 morado, 7 marrón, 8 rosado, 9 azul)
TEMAS = {
 'gato':(4,7,[8,9,5,2]),'perro':(7,2,[5,9,8,3]),'pez':(4,2,[1,8,9,6]),'dino':(3,2,[9,8,4,6]),
 'tortuga':(3,2,[8,4,9,7]),'buho':(7,4,[2,3,8,9]),'mariquita':(5,3,[2,8,9,4]),'pulpo':(6,8,[2,1,9,3]),
 'conejo':(1,8,[4,3,2,9]),'llama':(2,5,[9,3,8,4]),'leon':(2,4,[7,3,8,9]),'elefante':(1,8,[2,3,9,4]),
 'mono':(7,2,[2,3,8,4]),'oso-anteojos':(7,2,[3,8,9,4]),'condor':(6,1,[3,2,7,4]),'mariposa':(6,8,[2,1,3,4]),
 'auto':(5,1,[2,9,3,4]),'cohete':(5,2,[1,9,4,6]),'barco':(9,5,[2,1,4,3]),'globo':(0,2,[5,2,9,3,4,8]),
 'tren':(9,5,[2,3,4,1]),'avion':(1,5,[2,9,3,4]),'bus':(2,9,[5,3,1,4]),'tractor':(3,2,[5,9,1,7]),
 'helicoptero':(4,1,[9,2,3,5]),'flor':(8,3,[2,6,9,4]),'casita':(5,2,[9,3,7,1]),'arcoiris':(0,1,[5,4,2,3,9,6]),
 'hongo':(5,2,[2,3,8,1]),'sol':(2,4,[8,1,3,5]),'arbol':(3,5,[7,2,1,9]),'luna':(2,9,[1,8,6,3]),
 'cactus':(3,8,[4,2,7,1]),'playa':(2,1,[3,5,4,9]),'helado':(8,4,[5,7,2,1]),'cupcake':(8,1,[5,2,9,6]),
 'dona':(4,8,[8,2,9,6]),'torta':(8,2,[5,9,6,3]),'paleta':(0,8,[5,8,2,6,9,3]),'fresa':(5,3,[2,8,4,9]),
 'galleta':(7,4,[5,3,9,2]),'chocolate':(7,8,[5,2,9,3]),'sandia':(5,3,[2,8,7,9]),'calabaza':(4,3,[2,7,6,5]),
 'fantasma':(1,6,[8,2,3,9]),'gatito-bruja':(6,4,[2,3,7,9]),'murcielago':(6,2,[1,8,9,3]),
 'dulces-halloween':(4,6,[5,2,3,8]),'castillo':(6,2,[1,3,4,7]),'brujita':(6,3,[8,2,4,9]),
}
TEMA_DEFECTO = (5, 2, [9, 3, 4, 8, 6, 1])

def slug(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:40]

def limpiar(path):
    """Devuelve (imagen L 1024x1024 limpia, avisos)."""
    avisos = []
    im = Image.open(path)
    im.load()
    if im.width < 200 or im.height < 200:
        raise ValueError('es muy pequeña (mínimo 200 px)')
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); fondo = Image.new('RGBA', im.size, 'white'); fondo.alpha_composite(im); im = fondo
    g = np.asarray(im.convert('L'), dtype=np.float32)
    # niveles: el papel (percentil 90) pasa a blanco y la tinta (percentil 1) a negro
    hi = np.percentile(g, 90); lo = min(np.percentile(g, 1), hi - 60)
    g = np.clip((g - lo) / max(1, hi - lo) * 255, 0, 255)
    tinta = g < 110
    # gris = sombra (no línea): los grises lejos de la tinta se vuelven blanco para que se puedan pintar
    gris = (g >= 110) & (g < 200) & (ndi.distance_transform_edt(~tinta) > 3)
    if gris.mean() > 0.03:
        avisos.append('tenía sombras grises; las dejé en blanco')
    gruesa = ndi.distance_transform_edt(tinta) > max(tinta.shape) * 0.012
    if ndi.binary_dilation(gruesa, iterations=int(max(tinta.shape) * 0.012)).mean() > 0.02:
        avisos.append('tiene partes rellenas de negro; se verán negras y no se pueden pintar')
    # quitar puntitos sueltos
    lab, n = ndi.label(tinta)
    if n:
        tam = ndi.sum(tinta, lab, range(1, n + 1))
        quitar = np.isin(lab, np.nonzero(tam < max(12, tinta.size * 0.00002))[0] + 1)
        tinta &= ~quitar
    if not tinta.any():
        raise ValueError('no tiene líneas negras')
    # recortar al dibujo, dejar margen y hacerla cuadrada
    ys, xs = np.nonzero(tinta)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    lado = int(max(y1 - y0, x1 - x0) * 1.025) + 4
    cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
    lienzo = np.zeros((lado, lado), bool)
    sy, sx = cy - lado // 2, cx - lado // 2
    a0, a1 = max(0, sy), min(tinta.shape[0], sy + lado); b0, b1 = max(0, sx), min(tinta.shape[1], sx + lado)
    lienzo[a0 - sy:a1 - sy, b0 - sx:b1 - sx] = tinta[a0:a1, b0:b1]
    m = Image.fromarray((lienzo * 255).astype(np.uint8)).resize((N, N), Image.LANCZOS)
    tinta = np.asarray(m) > 110
    # grosor: si las líneas son muy finas, engrosarlas un poco (en celular se ven y se tocan mejor)
    dist = ndi.distance_transform_edt(tinta)
    esq = dist[(dist > 0) & (dist >= ndi.maximum_filter(dist, 3))]
    grosor = 2 * np.median(esq) if esq.size else 0
    if grosor < 5:
        tinta = ndi.binary_dilation(tinta, iterations=int(round((6 - grosor) / 2)))
    # cerrar huecos pequeños en las líneas (hasta ~6 px)
    tinta = ndi.binary_closing(tinta, structure=np.ones((3, 3)), iterations=3, border_value=0)
    out = Image.fromarray(np.where(tinta, 30, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    return out, avisos

def numerar(img, did=''):
    """Calcula semillas [x, y, n] con colores distintos entre zonas vecinas."""
    a = np.asarray(img)
    claro = a >= LINE_T
    lab, k = ndi.label(claro)
    if k == 0:
        return [], ['no tiene zonas para pintar']
    tam = np.bincount(lab.ravel(), minlength=k + 1)
    # fondo = la zona que más toca el borde
    borde = np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])
    borde = borde[borde > 0]
    fondo = np.bincount(borde, minlength=k + 1).argmax() if borde.size else 0
    avisos = []
    figura = [r for r in range(1, k + 1) if r != fondo and tam[r] >= MIN_ZONE]
    if len(figura) < 3:
        avisos.append('casi no tiene zonas cerradas: puede que una línea tenga un hueco y la cubeta pinte todo junto')

    # vecinas: cada píxel de línea toma la zona más cercana; zonas que se tocan así son vecinas
    _, (iy, ix) = ndi.distance_transform_edt(~claro, return_indices=True)
    duena = lab[iy, ix]
    vec = {r: set() for r in figura}
    h = np.stack([duena[:, 1:].ravel(), duena[:, :-1].ravel()], 1)
    v = np.stack([duena[1:, :].ravel(), duena[:-1, :].ravel()], 1)
    pares = np.unique(np.concatenate([h, v]), axis=0)
    for p, q in pares:
        if p != q and p in vec and q in vec:
            vec[p].add(q); vec[q].add(p)
    # colores: las zonas grandes llevan el color principal del personaje; las chicas rodeadas solo
    # por zonas principales (manchas, rayas) el color de detalle; el resto, colores de acento
    main, second, acc = TEMAS.get(did, TEMA_DEFECTO)
    total = sum(tam[r] for r in figura) or 1
    color = {}
    cy = ndi.center_of_mass(claro, lab, figura) if figura else []
    cajas = ndi.find_objects(lab)
    for r, (yy, _) in zip(figura, cy):
        ancho = cajas[r - 1][1].stop - cajas[r - 1][1].start
        if ancho < N * 0.85: continue                                     # cielo y suelo cruzan toda la hoja
        if tam[r] > a.size * 0.18 and yy < N * .55: color[r] = 1          # cielo
        elif tam[r] > a.size * 0.08 and yy >= N * .7: color[r] = 3        # suelo o pasto
    for r in figura:
        if main and r not in color and tam[r] >= total * 0.05: color[r] = main
    k = 0
    for r in sorted(figura, key=lambda r: -tam[r]):
        if r in color: continue
        vecinas = [q for q in vec[r] if q in color]
        if main and all(color[q] == main for q in vecinas) and tam[r] < total * 0.03:
            color[r] = second
        else:
            usadas = {color[q] for q in vec[r] if q in color}
            opciones = [c for c in acc if c not in usadas] or acc
            color[r] = opciones[k % len(opciones)]; k += 1
    # punto más interior de cada zona
    dist = ndi.distance_transform_edt(claro)
    semillas = []
    idx = ndi.maximum_position(dist, lab, figura)
    for r, (y, x) in zip(figura, idx):
        semillas.append([round((x + .5) / N, 4), round((y + .5) / N, 4), color[r]])
    if len(figura) > 120:
        avisos.append(f'tiene {len(figura)} zonas: puede ser difícil para niños pequeños')
    return semillas, avisos

def main():
    juego = Path(__file__).resolve().parent.parent
    origen = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Documents' / 'laminas-nuevas'
    destino = Path(sys.argv[2]) if len(sys.argv) > 2 else juego / 'dibujos'
    if not origen.is_dir():
        sys.exit(f'No encuentro la carpeta {origen}')
    cat_path = destino / 'dibujos.json'
    cat = json.loads(cat_path.read_text(encoding='utf-8'))
    por_id = {e['id']: e for e in cat['dibujos']}
    hechas, problemas = [], []
    for f in sorted(origen.iterdir()):
        if f.suffix.lower() not in OK_EXT or not f.is_file():
            continue
        if f.stat().st_size > MAX_BYTES:
            problemas.append((f.name, 'pesa más de 25 MB')); continue
        did = slug(f.stem)
        if not did:
            problemas.append((f.name, 'nombre de archivo inválido')); continue
        try:
            img, av1 = limpiar(f)
            sem, av2 = numerar(img, did)
        except Exception as e:
            problemas.append((f.name, str(e))); continue
        avisos = av1 + av2
        if not sem:
            problemas.append((f.name, '; '.join(avisos))); continue
        img.save(destino / f'{did}.png', optimize=True)
        nombre, categ = LISTA.get(did, (f.stem.replace('-', ' ').strip().capitalize()[:40], 'animales'))
        e = por_id.get(did) or {'id': did}
        e.update({'name': nombre, 'cat': categ, 'file': f'{did}.png', 'numeros': sem})
        e.pop('say', None)
        if did not in por_id:
            e['pack'] = 'premium'   # las láminas nuevas son parte de "desbloquear todo"; quita esta línea en dibujos.json para dejar una gratis
            cat['dibujos'].append(e); por_id[did] = e
        hechas.append((f.name, did, len(sem), avisos, did in LISTA))
    # orden: por categoría como en el juego, y dentro, como en la lista
    orden_cat = ['animales', 'vehiculos', 'naturaleza', 'dulces', 'halloween', 'letras']
    lista_ids = list(LISTA)
    cat['dibujos'].sort(key=lambda e: (orden_cat.index(e['cat']) if e['cat'] in orden_cat else 9,
                                       lista_ids.index(e['id']) if e['id'] in lista_ids else 999))
    cat_path.write_text(json.dumps(cat, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    for nombre, did, n, av, conocida in hechas:
        extra = '' if conocida else ' (no está en la lista: quedó en Animales, cambia la categoría en dibujos.json)'
        print(f'OK   {nombre} -> {did}.png, {n} zonas con número{extra}')
        for a in av: print(f'     aviso: {a}')
    for nombre, motivo in problemas:
        print(f'MAL  {nombre}: {motivo}')
    print(f'\n{len(hechas)} lista(s), {len(problemas)} con problema.')
    if hechas:
        # imágenes a color para el Rompecabezas
        import subprocess
        subprocess.run([sys.executable, str(Path(__file__).with_name('colorear-rompecabezas.py')), str(cat_path.parent.parent)], check=False)
        print('Ahora cambia el nombre de la caché en sw.js (o corre build) para que los celulares descarguen las nuevas.')

if __name__ == '__main__':
    main()
