#!/usr/bin/env python3
"""Sonidos del juego. Todo se sintetiza aquí, sin samples de terceros.

Crea los WAV en sonidos-wav/. Para el juego, conviértelos a sonidos/ con:
ffmpeg -i sonidos-wav/NOMBRE.wav -c:a libvorbis -q:a 5 sonidos/NOMBRE.ogg
"""
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
OUT = Path("sonidos-wav")
rng = np.random.default_rng(2026)


def t_of(d):
    return np.arange(int(SR * d)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def fade(x, a=0.002, r=0.012):
    x = x.copy()
    na, nr = min(int(a * SR), len(x)), min(int(r * SR), len(x))
    if na:
        x[:na] *= np.linspace(0, 1, na)
    if nr:
        x[-nr:] *= np.linspace(1, 0, nr)
    return x


def phase(freq):
    return 2 * np.pi * np.cumsum(freq) / SR


def sweep(f0, f1, d, curve=1.0, wave="sine"):
    u = np.linspace(0, 1, int(SR * d)) ** curve
    p = phase(f0 * (f1 / f0) ** u)
    if wave == "tri":
        return 2 / np.pi * np.arcsin(np.sin(p))
    return np.sin(p)


def bell(f, d=0.8, tau=0.22, ratio=3.5, index=1.6):
    t = t_of(d)
    mod = index * np.exp(-t / (tau * 0.45)) * np.sin(2 * np.pi * f * ratio * t)
    return fade(np.sin(2 * np.pi * f * t + mod) * np.exp(-t / tau), 0.001, 0.03)


def marimba(f, d=0.6, tau=0.13):
    t = t_of(d)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
    y += 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / (tau * 0.22))
    y += 0.08 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t / (tau * 0.08))
    return fade(y, 0.001, 0.02)


def pluck(f, d=0.7, tau=0.32):
    t = t_of(d)
    y = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-t * h * 0.9 / tau) / h ** 1.2 for h in range(1, 7))
    return fade(y, 0.002, 0.03)


def pad(f, d):
    t = t_of(d)
    y = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 1.004 * t)
    y += 0.2 * np.sin(2 * np.pi * f * 2 * t)
    return fade(y, min(0.35, d / 3), min(0.5, d / 3))


def band(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def low(x, hi):
    return sosfilt(butter(2, hi, "low", fs=SR, output="sos"), x)


def noise(d):
    return rng.normal(0, 1, int(SR * d))


def periodic_noise(d, lo, hi):
    """Ruido filtrado en frecuencia: el final empalma con el inicio."""
    n = int(SR * d)
    spec = np.fft.rfft(rng.normal(0, 1, n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec *= np.exp(-((np.log(np.maximum(f, 1)) - np.log((lo * hi) ** 0.5)) ** 2) / (2 * (np.log(hi / lo) / 2) ** 2))
    return np.fft.irfft(spec, n)


def seq(events, tail=0.5):
    """events: lista de (segundo, señal, ganancia)"""
    n = max(int(s * SR) + len(y) for s, y, _ in events) + int(tail * SR)
    out = np.zeros(n)
    for s, y, g in events:
        i = int(s * SR)
        out[i : i + len(y)] += y * g
    return out


def reverb(x, mix=0.14, tau=0.28):
    ir = low(rng.normal(0, 1, int(SR * tau * 3)), 3500) * np.exp(-t_of(tau * 3) / tau)
    ir /= np.sqrt((ir ** 2).sum())
    n = len(x) + len(ir)
    wet = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)
    return np.pad(x, (0, n - len(x))) + mix * wet


def finish(x, peak=0.7, rev=0.0):
    """Quita silencio final, evita clics y fija el pico (-3 dBFS por defecto)."""
    if rev:
        x = reverb(x, rev)
    limit = np.abs(x).max() * 0.002
    x = x[: np.nonzero(np.abs(x) > limit)[0][-1] + 1]
    return fade(x, 0.001, 0.02) / np.abs(x).max() * peak


def save(name, x):
    OUT.mkdir(parents=True, exist_ok=True)
    wavfile.write(OUT / f"{name}.wav", SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))


C5, D5, E5, G5, A5, C6, D6, E6, G6, A6, C7 = [midi(n) for n in (72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96)]
G4, A4, E4, F4 = midi(67), midi(69), midi(64), midi(65)

S = {}
# --- Interfaz ---
S["ui_tap"] = finish(fade(sweep(1000, 620, 0.05)) * np.exp(-t_of(0.05) / 0.018), 0.55)
S["ui_pop"] = finish(fade(sweep(280, 1150, 0.08, 0.7)) * np.exp(-t_of(0.08) / 0.04), 0.65)
S["ui_confirmar"] = finish(seq([(0, marimba(E5), 1), (0.075, marimba(A5), 1)]), rev=0.1)
S["ui_atras"] = finish(seq([(0, marimba(A5), 0.8), (0.075, marimba(E5), 0.8)]), 0.6, rev=0.1)
S["ui_abrir"] = finish(seq([(0, bell(C6, 0.5), 1), (0.06, bell(E6, 0.5), 0.9), (0.12, bell(G6, 0.6), 0.8)]), 0.6, rev=0.12)
S["ui_cerrar"] = finish(seq([(0, bell(G6, 0.4), 0.7), (0.06, bell(E6, 0.4), 0.8), (0.12, bell(C6, 0.5), 0.9)]), 0.6, rev=0.12)
S["ui_interruptor"] = finish(seq([(0, marimba(G5, 0.2, 0.05), 1), (0.03, fade(noise(0.012)) * 0.15, 1)]), 0.55)
S["ui_burbuja"] = finish(
    seq([(s, fade(sweep(f, f * 2.2, 0.09, 0.6)) * np.exp(-t_of(0.09) / 0.04), 1) for s, f in ((0, 420), (0.08, 610), (0.17, 500))]),
    0.6,
)

# --- Pintura ---
for i, n in enumerate((72, 76, 79, 81, 84), 1):
    S[f"pintura_color_{i}"] = finish(seq([(0, marimba(midi(n), 0.5, 0.11), 1), (0.012, bell(midi(n + 12), 0.4, 0.12), 0.25)]), 0.55, rev=0.15)
for i, (f0, f1) in enumerate(((170, 620), (210, 780), (250, 920)), 1):
    y = fade(sweep(f0, f1, 0.2, 0.65)) * np.exp(-t_of(0.2) / 0.1)
    water = low(noise(0.25), 1800) * np.exp(-t_of(0.25) / 0.06) * 0.12
    S[f"pintura_relleno_{i}"] = finish(seq([(0, y, 1), (0.02, water, 1)]), 0.65, rev=0.1)
S["pintura_goma"] = finish(
    seq([(s, fade(band(noise(0.1), 500, 1700), 0.015, 0.03) * np.sin(np.linspace(0, np.pi, int(SR * 0.1))), 1) for s in (0, 0.13, 0.25)]),
    0.45,
)
S["pintura_deshacer"] = finish(fade(sweep(760, 290, 0.2, 0.8, "tri")) * np.exp(-t_of(0.2) / 0.1), 0.5, rev=0.1)

# Pincel en loop: 3 trazos exactos en 3 s; se reproduce mientras el dedo pinta.
t = t_of(3.0)
stroke = 0.62 + 0.38 * np.sin(2 * np.pi * t - np.pi / 2)
loop = periodic_noise(3.0, 650, 2600) * stroke
S["pintura_pincel_loop"] = loop / np.abs(loop).max() * 0.3

# --- Premios ---
S["premio_acierto"] = finish(seq([(0.075 * i, marimba(f), 1) for i, f in enumerate((C5, E5, G5, C6))]), rev=0.14)
S["premio_error_suave"] = finish(
    seq([(0, fade(sweep(G4, G4 * 0.97, 0.16, 1, "tri"), 0.01, 0.05), 0.8), (0.17, fade(sweep(E4, E4 * 0.95, 0.24, 1, "tri"), 0.01, 0.09), 0.8)]),
    0.45,
    rev=0.08,
)
S["premio_moneda"] = finish(seq([(0, bell(G5, 0.3, 0.1), 0.7), (0.05, bell(C6, 0.3, 0.1), 0.8), (0.1, bell(G6, 0.6, 0.18), 1)]), 0.6, rev=0.13)
S["premio_estrella"] = finish(
    seq([(0.055 * i, bell(midi(n), 0.7, 0.2, 3.5, 1.0), 0.85) for i, n in enumerate((84, 86, 88, 91, 93, 96, 98))]), 0.55, rev=0.2
)
S["premio_brillo"] = finish(
    seq([(0.07 * i, bell(midi(n), 0.6, 0.18, 5.0, 0.8), 0.8) for i, n in enumerate((100, 96, 93, 91, 88))]), 0.42, rev=0.25
)
S["premio_desbloqueo"] = finish(
    seq([(0, fade(sweep(300, 1250, 0.32, 1.4, "tri"), 0.02, 0.04), 0.4), (0.33, marimba(C6), 1), (0.33, bell(E6, 0.9), 0.5), (0.33, bell(G6, 0.9), 0.4)]),
    rev=0.18,
)
notes = [(0, 72), (0.14, 76), (0.28, 79), (0.46, 81), (0.6, 79), (0.78, 84)]
ev = [(s, pluck(midi(n), 0.6), 0.75) for s, n in notes] + [(s, bell(midi(n + 12), 0.5, 0.14, 3.5, 0.8), 0.22) for s, n in notes]
ev += [(0.78, pad(midi(n), 1.3) * np.exp(-t_of(1.3) / 0.65), 0.17) for n in (60, 67, 72, 76)]
ev += [(0.78 + 0.05 * i, bell(midi(n), 0.9, 0.25), 0.45) for i, n in enumerate((91, 96, 100))]
S["premio_nivel_completo"] = finish(seq(ev), rev=0.2)

claps = []
for s in rng.uniform(0, 1.15, 110):
    b = band(noise(0.035), 900, 3800) * np.exp(-t_of(0.035) / 0.009)
    claps.append((s, fade(b), rng.uniform(0.15, 0.55) * (1 - 0.65 * s / 1.15)))
S["premio_aplausos"] = finish(seq(claps), 0.5, rev=0.1)

# --- Movimiento ---
S["mov_salto"] = finish(fade(sweep(260, 780, 0.15, 0.7)) * np.exp(-t_of(0.15) / 0.09), 0.6)
t = t_of(0.48)
S["mov_boing"] = finish(np.sin(phase(230 + 150 * np.sin(2 * np.pi * 15 * t) * np.exp(-t / 0.2) + 110 * t)) * np.exp(-t / 0.2), 0.6)
S["mov_caida"] = finish(fade(sweep(1250, 240, 0.55, 0.8, "tri"), 0.01, 0.05), 0.42)
n = noise(0.35)
S["mov_whoosh"] = finish(band(n, 350, 2300) * np.sin(np.linspace(0, np.pi, len(n))) ** 2, 0.42)
S["mov_paso_1"] = finish(fade(sweep(180, 95, 0.07)) * np.exp(-t_of(0.07) / 0.025), 0.45)
S["mov_paso_2"] = finish(fade(sweep(205, 110, 0.07)) * np.exp(-t_of(0.07) / 0.025), 0.45)

# --- Animalitos estilo caricatura ---
pio = lambda: fade(sweep(2650, 3900, 0.08, 1.3)) * np.sin(np.linspace(0, np.pi, int(SR * 0.08)))
S["animal_pollito"] = finish(seq([(s, pio(), 1) for s in (0, 0.13, 0.29)]), 0.42)
t = t_of(0.3)
rana = np.sign(np.sin(phase(130 + 25 * t))) * (0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 34 * t)))
S["animal_rana"] = finish(seq([(s, fade(low(rana, 950), 0.02, 0.07), 1) for s in (0, 0.36)]), 0.42)
t = t_of(1.0)
saw = 2 * ((np.cumsum(205 + 12 * np.sin(2 * np.pi * 5.5 * t)) / SR) % 1) - 1
S["animal_abeja"] = finish(fade(band(saw, 240, 1600), 0.08, 0.2) * (0.85 + 0.15 * np.sin(2 * np.pi * 2.3 * t)), 0.33)
S["animal_grillo"] = finish(
    seq([(s, fade(np.sin(2 * np.pi * 4300 * t_of(0.018)), 0.002, 0.006), 1) for b in (0, 0.42) for s in (b, b + 0.03, b + 0.06, b + 0.09)]), 0.25
)


# --- Música original en loop ---
def put(buf, y, s, g=1.0):
    i = np.arange(len(y)) + int(s * SR)
    np.add.at(buf, i % len(buf), y * g)


def circular_reverb(x, mix, tau=0.5):
    ir = np.zeros(len(x))
    tail = low(rng.normal(0, 1, int(SR * tau * 3)), 3200) * np.exp(-t_of(tau * 3) / tau)
    ir[: len(tail)] = tail / np.sqrt((tail ** 2).sum())
    return x + mix * np.fft.irfft(np.fft.rfft(x) * np.fft.rfft(ir), len(x))


def track(bpm, beats_per_bar, chords, melody, inst, style):
    b = 60 / bpm
    bars = len(chords)
    length = int(SR * b * beats_per_bar * bars)
    buf = np.zeros(length)
    for bar, ch in enumerate(chords):
        s = bar * beats_per_bar * b
        for n in ch:
            put(buf, pad(midi(n), b * beats_per_bar * 1.05), s, 0.055)
        if style == "juego":
            for beat in (0, 2):
                put(buf, pluck(midi(ch[0] - 12), b * 1.1, 0.42), s + beat * b, 0.34)
            for off in (0.5, 1.5, 2.5, 3.5):
                for n in ch[1:]:
                    put(buf, marimba(midi(n), b * 0.8, 0.07), s + off * b, 0.12)
            for i in range(8):
                hit = fade(band(noise(0.04), 5000, 11000), 0.001, 0.02)
                put(buf, hit, s + i * b / 2, 0.018 if i % 2 else 0.009)
        else:
            order = [0, 2, 1, 2] if beats_per_bar == 4 else [0, 1, 2]
            for i in range(beats_per_bar):
                n = ch[order[i % len(order)]]
                put(buf, marimba(midi(n), b * 1.2, 0.2), s + i * b, 0.16 if i else 0.2)
    for s_beat, n, dur in melody:
        put(buf, inst(midi(n), b * dur + 0.25), s_beat * b, 0.3)
    wet = circular_reverb(buf, 0.2)
    wet = np.tanh(wet / np.abs(wet).max() * 1.15)
    return wet / np.abs(wet).max() * 0.55


def bars(data, per_bar):
    return [(i * per_bar + b, n, d) for i, bar in enumerate(data) for b, n, d in bar]


menu_mel = bars(
    [
        [(0, 76, 1), (1, 79, 0.5), (1.5, 81, 0.5), (2, 79, 2)],
        [(0, 72, 1), (1, 76, 1), (2, 74, 2)],
        [(0, 77, 1), (1, 76, 0.5), (1.5, 74, 0.5), (2, 72, 2)],
        [(0, 74, 1.5), (1.5, 76, 0.5), (2, 71, 2)],
        [(0, 79, 1), (1, 84, 1), (2, 83, 0.5), (2.5, 81, 0.5), (3, 79, 1)],
        [(0, 76, 2), (2, 79, 2)],
        [(0, 81, 1), (1, 79, 0.5), (1.5, 77, 0.5), (2, 76, 1), (3, 74, 1)],
        [(0, 71, 2), (2, 74, 2)],
    ],
    4,
)
game_mel = bars(
    [
        [(0, 81, 0.5), (0.5, 84, 0.5), (1, 81, 0.5), (1.5, 79, 0.5), (2, 77, 1), (3, 79, 1)],
        [(0, 74, 0.5), (0.5, 79, 0.5), (1, 83, 1), (2, 81, 0.5), (2.5, 79, 0.5), (3, 74, 1)],
        [(0, 76, 0.5), (0.5, 79, 0.5), (1, 83, 0.5), (1.5, 79, 0.5), (2, 76, 1), (3, 74, 1)],
        [(0, 72, 0.5), (0.5, 76, 0.5), (1, 81, 1), (2, 84, 2)],
        [(0, 81, 0.5), (0.5, 77, 0.5), (1, 74, 0.5), (1.5, 77, 0.5), (2, 81, 1), (3, 86, 1)],
        [(0, 83, 0.5), (0.5, 79, 0.5), (1, 74, 1), (2, 79, 0.5), (2.5, 83, 0.5), (3, 86, 1)],
        [(0, 84, 1), (1, 83, 0.5), (1.5, 81, 0.5), (2, 79, 1), (3, 76, 1)],
        [(0, 77, 0.5), (0.5, 76, 0.5), (1, 74, 1), (2, 79, 2)],
    ],
    4,
)
paint_mel = bars(
    [
        [(0, 79, 2), (2, 83, 1)],
        [(0, 81, 3)],
        [(0, 76, 1), (1, 79, 1), (2, 81, 1)],
        [(0, 78, 3)],
        [(0, 83, 2), (2, 86, 1)],
        [(0, 84, 1.5), (1.5, 83, 0.5), (2, 81, 1)],
        [(0, 79, 1), (1, 76, 1), (2, 78, 1)],
        [(0, 79, 3)],
    ],
    3,
)
S["musica_menu_loop"] = track(
    100,
    4,
    [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [60, 64, 67], [52, 55, 59], [53, 57, 60], [55, 59, 62]],
    menu_mel,
    lambda f, d: bell(f, d, 0.3, 3.5, 0.9),
    "menu",
)
S["musica_juego_loop"] = track(
    124,
    4,
    [[53, 57, 60], [55, 59, 62], [52, 55, 59], [57, 60, 64], [50, 53, 57], [55, 59, 62], [48, 52, 55], [50, 53, 57]],
    game_mel,
    lambda f, d: pluck(f, d, 0.3),
    "juego",
)
S["musica_pintar_loop"] = track(
    92,
    3,
    [[55, 59, 62], [50, 54, 57], [52, 55, 59], [50, 54, 57], [55, 59, 62], [48, 52, 55], [52, 55, 59], [55, 59, 62]],
    paint_mel,
    lambda f, d: bell(f, d, 0.42, 2.0, 0.55),
    "pintar",
)

for k, v in S.items():
    assert np.isfinite(v).all(), k
    save(k, v)
print(len(S), "sonidos en", OUT)
