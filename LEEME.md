# Pukllay: Colorea y Juega

Juego de colorear para niños. Funciona sin internet y se instala en el celular o la tablet como una app, con su ícono en la pantalla de inicio.

## Probarlo en la PC

Abrir `index.html` con doble clic no basta: el juego carga los dibujos desde la carpeta `dibujos/`, y eso solo funciona cuando se sirve como una web. Para probarlo:

```powershell
cd "$HOME\Documents\pinta-y-brilla"
python -m http.server 8080
```

Luego abre http://localhost:8080 en Chrome.

## Publicarlo (elige una opción)

**GitHub Pages (gratis, la que ya usas para APRENDE)**

1. Crea un repositorio nuevo, por ejemplo `pinta-y-brilla`.
2. Sube todo el contenido de esta carpeta (incluido `.nojekyll`).
3. En el repositorio: Settings → Pages → Branch `main` → carpeta `/ (root)` → Save.
4. En un minuto queda en `https://TU-USUARIO.github.io/pinta-y-brilla/`.

**Netlify Drop (sin cuenta de GitHub)**

Entra a https://app.netlify.com/drop y arrastra la carpeta. Netlify también lee el archivo `_headers` con las cabeceras de seguridad.

## Instalarlo en el celular o la tablet

- **Android (Chrome):** abre el enlace → menú ⋮ → "Instalar app" o "Agregar a la pantalla principal".
- **iPhone / iPad (Safari):** abre el enlace → botón Compartir → "Agregar a inicio".

Se abre a pantalla completa y, después de la primera vez, funciona sin internet.

## Zona para padres

El candado de arriba a la derecha abre los ajustes para adultos. Para entrar hay que resolver una suma, así los más chicos no cambian nada sin querer. Ahí se activa la voz, la música de fondo (viene apagada), se elige la voz y se puede borrar todo el progreso. Borrar el progreso quita colores, estrellas y obras, pero conserva los dibujos que agregaste.

## Agregar dibujos nuevos

Hay dos formas:

**Desde el celular o la tablet, sin tocar código.** En la galería, toca "Agregar dibujo" y elige una imagen. Se guarda en ese dispositivo, en la categoría "Mis dibujos". Para que también tenga pintar por números, coloréalo una vez con la cubeta y en la pestaña "Números" toca "Crear números con mi coloreado".

**Incluidos en la app, para que todos los vean.**

1. Copia el PNG a la carpeta `dibujos/` con un nombre en minúsculas y sin espacios, por ejemplo `perro.png`.
2. Agrega una entrada en `dibujos/dibujos.json`, dentro de la lista `"dibujos"`:
   ```json
   {"id":"perro","name":"Perro","cat":"animales","file":"perro.png","numeros":[]}
   ```
   Categorías válidas: `animales`, `vehiculos`, `naturaleza`, `dulces`, `halloween`, `letras`.
3. Cambia el nombre de la caché en la primera línea de `sw.js` (por ejemplo `pinta-y-brilla-v2`) para que los celulares descarguen la novedad.

**Muchas a la vez (recomendado).** Guarda las imágenes en `Documentos\laminas-nuevas` con el nombre de archivo de la lista de láminas (`gato.png`, `perro.png`…) y, dentro de esta carpeta:

```powershell
pip install pillow numpy scipy
python herramientas\preparar-laminas.py
```

El script limpia cada imagen (fondo blanco, sin grises ni puntitos, huecos pequeños cerrados), la deja en 1024 × 1024, calcula los números con colores distintos entre zonas vecinas, actualiza `dibujos/dibujos.json` y crea la versión a color para el Rompecabezas en `dibujos/color/` y el sticker del álbum en `dibujos/sticker/` (también se pueden correr solos: `python herramientas\colorear-rompecabezas.py` y luego `python herramientas\hacer-stickers.py`). Si una imagen tiene un problema, lo dice y no la agrega. Después cambia el nombre de la caché en `sw.js`.

**Gratis o de pago.** En `dibujos/dibujos.json`, las láminas con `"pack":"premium"` se abren solo con la compra "Desbloquear todo". Sin ese campo, la lámina es gratis. `preparar-laminas.py` marca como premium las láminas nuevas.

**Cómo debe ser la imagen:** líneas negras gruesas sobre fondo blanco, sin sombras ni grises, con las zonas bien cerradas. Si una línea tiene un hueco, la cubeta pinta las dos zonas juntas. Acepta PNG, JPG o WebP de al menos 200 px; lo ideal es 1024 px o más.

**Prompt para generarlas con IA:**

> Página para colorear para niños de 3 a 6 años: [tema]. Estilo kawaii, contorno negro grueso y uniforme, fondo blanco, sin sombras, sin grises, sin texto, formas grandes y simples, todas las líneas cerradas, un solo personaje centrado.

Antes de publicar imágenes hechas con IA, revisa las condiciones de uso comercial de la herramienta.

## Voz más natural

El juego usa la mejor voz en español que tenga cada dispositivo y deja elegir otra en el menú ⋯ → **Elegir voz**. Las que dicen "Natural" suenan mejor. Las voces del sistema dependen del celular. Para que suene igual de natural en todos, y sin internet, genera audios grabados con una voz neuronal de Azure:

1. Crea una cuenta en https://portal.azure.com y un recurso **Voz** (Speech). El plan gratis F0 alcanza de sobra para todas las frases del juego. Copia la **clave** y la **región**.
2. En PowerShell, dentro de esta carpeta:
   ```powershell
   $env:AZURE_SPEECH_KEY = "tu-clave"
   $env:AZURE_SPEECH_REGION = "eastus"
   python herramientas\generar-voz.py
   ```
   La clave solo se usa en tu PC: no queda en ningún archivo ni dentro de la app.
3. Se crea la carpeta `voz/` con los audios y `voz/voz.json`. El juego los usa solo; en ⋯ → Elegir voz aparece "Voz grabada".
4. Cambia el nombre de la caché en `sw.js` y vuelve a publicar.

La voz por defecto es **Camila (Perú)**. Para otra, antes del paso 2: `$env:VOZ = "es-PE-AlexNeural"` (Perú, masculina), `es-MX-DaliaNeural`, `es-US-PalomaNeural`, etc. Cuando agregues dibujos, vuelve a ejecutar el script: solo genera las frases nuevas.

Si prefieres tu propia voz, graba archivos MP3 con los mismos nombres que aparecen en `voz/voz.json`.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html`, `styles.css`, `app.js` | El juego |
| `dibujos/` | Las láminas (PNG) y `dibujos.json` con nombres, categorías y números |
| `manifest.webmanifest` | Nombre, ícono y pantalla completa al instalar |
| `sw.js` | Guarda el juego en el dispositivo para usarlo sin internet |
| `icons/` | Íconos para Android, iPhone y la pestaña del navegador |
| `fonts/` | Tipografías incluidas (licencia OFL), sin cargar nada de Google |
| `_headers` | Cabeceras de seguridad para Netlify o Cloudflare Pages |
| `herramientas/` | `generar-voz.py`, la lista de frases (`frases.json`), `preparar-laminas.py`, `colorear-rompecabezas.py` y `hacer-stickers.py`; no hacen falta para jugar |
| `voz/` | (Opcional) audios grabados que crea `generar-voz.py` |

## Política de privacidad

`privacidad.html` es la página que pide Google Play. Ya está completa con la marca **Pukllay Studio** y el correo **pukllay.studio24@gmail.com**. Al publicar la carpeta, queda en `https://pukllay-studio.github.io/pinta-y-brilla/privacidad.html`.

## Para llevarlo a Google Play

La app Android está en la carpeta hermana `pinta-y-brilla-android` (Capacitor 8, ya configurada). Su `LEEME.md` explica cómo probarla en tu celular y generar el archivo `.aab`. Después de cambiar algo aquí, corre `npm run sync` en esa carpeta.
