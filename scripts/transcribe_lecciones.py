#!/usr/bin/env python3
"""Transcribe fundamentos MP3s with word timestamps for lesson sync."""

from __future__ import annotations

import json
import re
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "public" / "audio"
GUIONES = ROOT / "docs" / "guiones"
OUT = AUDIO

LESSONS = [
    ("03", "03-variables-tipos.md", 118_200),
    ("04", "04-operadores.md", 98_960),
    ("05", "05-condicionales.md", 80_080),
    ("06", "06-bucles.md", 82_000),
    ("07", "07-funciones.md", 84_480),
    ("08", "08-arrays.md", 74_560),
    ("09", "09-objetos.md", 68_960),
    ("10", "10-scope-closures.md", 74_760),
    ("11", "11-algoritmos-basicos.md", 77_280),
    ("12", "12-estructuras-datos.md", 65_680),
    ("13", "13-complejidad-big-o.md", 59_240),
    ("14", "14-paradigmas.md", 80_240),
]


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-záéíóúüñ0-9]+", text.lower())


def paragraphs(md: str) -> list[str]:
    body = re.sub(r"^---[\s\S]*?---\n", "", md)
    body = re.sub(r"^#.*\n", "", body)
    parts = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
    return [p for p in parts if not p.startswith("#") and not p.startswith("---")]


def align(paras: list[str], words: list[dict]) -> list[dict]:
    tokens = [tokenize(p) for p in paras]
    idx = 0
    cues = []
    n = len(words)
    for pi, (para, want) in enumerate(zip(paras, tokens)):
        if not want:
            continue
        start_idx = idx
        best = None
        # find first token of paragraph in remaining words
        first = want[0]
        search_to = min(n, idx + 40)
        found = None
        for j in range(idx, search_to):
            if words[j]["word"] == first:
                found = j
                break
        if found is None:
            for j in range(idx, n):
                if words[j]["word"] == first:
                    found = j
                    break
        if found is None:
            found = min(idx, n - 1)
        # consume remaining tokens
        wi = found
        matched = 0
        while wi < n and matched < len(want):
            if words[wi]["word"] == want[matched]:
                matched += 1
            wi += 1
        end_idx = max(found + 1, wi)
        start_ms = int(round(words[found]["start"] * 1000))
        end_ms = int(round(words[min(end_idx, n) - 1]["end"] * 1000))
        cues.append(
            {
                "timestamp": start_ms,
                "end": end_ms,
                "text": para,
            }
        )
        idx = end_idx
        _ = start_idx
        _ = best
        _ = pi
    return cues


def main() -> None:
    print("loading whisper small…", flush=True)
    model = WhisperModel("small", device="cpu", compute_type="int8")
    for num, md_name, duration_ms in LESSONS:
        audio = AUDIO / f"fundamentos-{num}.mp3"
        out_path = OUT / f"fundamentos-{num}.json"
        print(f"transcribing {audio.name}", flush=True)
        segments, info = model.transcribe(
            str(audio),
            language="es",
            word_timestamps=True,
            vad_filter=True,
            beam_size=1,
        )
        words = []
        segs = []
        for seg in segments:
            segs.append({"start": seg.start, "end": seg.end, "text": seg.text.strip()})
            if seg.words:
                for w in seg.words:
                    token = tokenize(w.word)
                    if not token:
                        continue
                    words.append(
                        {
                            "word": token[0],
                            "start": w.start,
                            "end": w.end,
                        }
                    )
        md = (GUIONES / md_name).read_text(encoding="utf-8")
        paras = paragraphs(md)
        cues = align(paras, words) if words else []
        payload = {
            "id": f"fundamentos-{num}",
            "durationMs": duration_ms,
            "language": info.language,
            "engine": "faster-whisper-small",
            "cues": cues,
            "segments": segs,
        }
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  wrote {out_path.name}  cues={len(cues)}  words={len(words)}", flush=True)


if __name__ == "__main__":
    main()
