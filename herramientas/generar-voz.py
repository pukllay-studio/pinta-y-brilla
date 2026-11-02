"""
Genera los audios de voz del juego con una voz neuronal de Microsoft Azure.

Se ejecuta una sola vez en tu PC (y otra vez cuando agregues dibujos o frases).
Los audios quedan en la carpeta voz/ y el juego los usa solo, sin internet.

Requisitos: Python 3.9 o más. No necesita instalar paquetes.

Uso (PowerShell, dentro de la carpeta pinta-y-brilla):
    $env:AZURE_SPEECH_KEY = "tu-clave"          # nunca la escribas dentro de este archivo
    $env:AZURE_SPEECH_REGION = "eastus"         # la región de tu recurso de Voz en Azure
    python herramientas\\generar-voz.py

Opcional:
    $env:VOZ = "es-PE-CamilaNeural"   # voz por defecto (Perú, femenina)
    # otras: es-PE-AlexNeural (Perú, masculina), es-MX-DaliaNeural, es-MX-JorgeNeural,
    #        es-US-PalomaNeural, es-CO-SalomeNeural, es-AR-ElenaNeural
"""
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from xml.sax.saxutils import escape

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETA_VOZ = os.path.join(RAIZ, "voz")
CLAVE = os.environ.get("AZURE_SPEECH_KEY", "").strip()
REGION = os.environ.get("AZURE_SPEECH_REGION", "eastus").strip()
VOZ = os.environ.get("VOZ", "es-PE-CamilaNeural").strip()

if not CLAVE:
    sys.exit("Falta la clave. En PowerShell: $env:AZURE_SPEECH_KEY = \"tu-clave\"  (luego vuelve a ejecutar)")
if not re.fullmatch(r"[a-z0-9]{3,30}", REGION):
    sys.exit("AZURE_SPEECH_REGION no es válida (ejemplo: eastus, brazilsouth)")
if not re.fullmatch(r"[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural", VOZ):
    sys.exit("VOZ no es válida (ejemplo: es-PE-CamilaNeural)")


def frases():
    lista = json.load(open(os.path.join(RAIZ, "herramientas", "frases.json"), encoding="utf-8"))["frases"]
    try:
        dib = json.load(open(os.path.join(RAIZ, "dibujos", "dibujos.json"), encoding="utf-8"))["dibujos"]
        for d in dib:
            lista.append(d.get("say") or d["name"])
    except (OSError, KeyError, ValueError):
        print("Aviso: no se pudo leer dibujos/dibujos.json; se generan solo las frases fijas.")
    vistas, unicas = set(), []
    for f in lista:
        f = str(f).strip()
        if f and len(f) <= 120 and f.lower() not in vistas:
            vistas.add(f.lower())
            unicas.append(f)
    return unicas


def nombre_archivo(texto):
    base = unicodedata.normalize("NFKD", texto.lower()).encode("ascii", "ignore").decode()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")[:40] or "frase"
    huella = hashlib.sha1((VOZ + "|" + texto).encode("utf-8")).hexdigest()[:6]
    return f"{base}-{huella}.mp3"


def sintetizar(texto):
    idioma = "-".join(VOZ.split("-")[:2])
    ssml = (
        f"<speak version='1.0' xml:lang='{idioma}'><voice name='{VOZ}'>"
        f"<prosody rate='-6%'>{escape(texto)}</prosody></voice></speak>"
    )
    req = urllib.request.Request(
        f"https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=ssml.encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": CLAVE,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "pinta-y-brilla",
        },
        method="POST",
    )
    for intento in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and intento < 3:  # demasiadas peticiones: espera y reintenta
                time.sleep(2 * (intento + 1))
                continue
            if e.code in (401, 403):
                sys.exit("Azure rechazó la clave o la región (error %d). Revisa AZURE_SPEECH_KEY y AZURE_SPEECH_REGION." % e.code)
            raise
    raise RuntimeError("No se pudo generar: " + texto)


def main():
    os.makedirs(CARPETA_VOZ, exist_ok=True)
    clips, nuevas = {}, 0
    todas = frases()
    for i, texto in enumerate(todas, 1):
        archivo = nombre_archivo(texto)
        ruta = os.path.join(CARPETA_VOZ, archivo)
        if not os.path.exists(ruta):  # los que ya existen no se vuelven a pedir (no gasta cuota)
            audio = sintetizar(texto)
            with open(ruta, "wb") as f:
                f.write(audio)
            nuevas += 1
            time.sleep(0.15)
        clips[texto] = archivo
        print(f"[{i}/{len(todas)}] {texto}")
    with open(os.path.join(CARPETA_VOZ, "voz.json"), "w", encoding="utf-8") as f:
        json.dump({"version": 1, "voz": VOZ, "clips": clips}, f, ensure_ascii=False, indent=1)
    print(f"\nListo: {len(clips)} frases ({nuevas} nuevas) en la carpeta voz/.")
    print("Cambia el nombre de la caché en sw.js para que los celulares descarguen los audios.")


if __name__ == "__main__":
    main()
