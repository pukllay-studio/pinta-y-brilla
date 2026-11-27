# dibujos-opt

Versiones de `dibujos/*.png` guardadas en escala de grises de 8 bits (los originales eran RGBA con
canal alfa 255 y R=G=B). Sin pérdida: los píxeles son idénticos (comprobado en los 67 archivos).
Solo se incluyen los que pesan menos que el original. Los `.webp` de `color/` y `sticker/` ya estaban
bien comprimidos (recomprimirlos ahorra 0,8 % y empeora los stickers): no se tocan.

Los originales NO se han modificado ni se han cambiado referencias. Para usarlos: copiar estos
archivos sobre `dibujos/` y subir `CACHE` en `sw.js`.
