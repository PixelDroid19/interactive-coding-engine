#!/usr/bin/env python3
"""Validate and align the six spoken paragraphs of every Web Components/Lit lesson."""

from __future__ import annotations

import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "public" / "audio"
SCRIPTS = ROOT / "docs" / "guiones" / "web-components-lit"
MANIFEST = ROOT / "src" / "curriculum" / "web-components-lit" / "audioManifest.ts"
LESSON_COUNT = 45
CACHE_VERSION = "gemini-20260824"


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-záéíóúüñ0-9]+", text.lower())


def paragraphs(markdown: str) -> list[str]:
    body = re.sub(r"^---[\s\S]*?---\n", "", markdown).strip()
    return [part.strip() for part in re.split(r"\n\s*\n", body) if part.strip()]


def align_paragraphs(parts: list[str], words: list[dict], duration_ms: int) -> tuple[list[dict], float]:
    script_tokens: list[str] = []
    boundaries: list[int] = []
    for part in parts:
        boundaries.append(len(script_tokens))
        script_tokens.extend(tokenize(part))

    spoken_tokens = [word["word"] for word in words]
    matcher = SequenceMatcher(None, script_tokens, spoken_tokens, autojunk=False)
    mapping: dict[int, int] = {}
    matched = 0
    for block in matcher.get_matching_blocks():
        matched += block.size
        for offset in range(block.size):
            mapping[block.a + offset] = block.b + offset

    coverage = matched / max(1, len(script_tokens))
    starts: list[int] = []
    for paragraph_index, boundary in enumerate(boundaries):
        if paragraph_index == 0:
            word_index = 0
        else:
            candidates = [
                (abs(script_index - boundary), spoken_index)
                for script_index, spoken_index in mapping.items()
            ]
            word_index = min(candidates)[1] if candidates else round(
                boundary / max(1, len(script_tokens)) * len(words)
            )
        word_index = max(0, min(word_index, len(words) - 1))
        starts.append(int(round(words[word_index]["start"] * 1000)))

    starts[0] = max(0, starts[0])
    for index in range(1, len(starts)):
        starts[index] = max(starts[index], starts[index - 1] + 500)

    last_spoken_end = min(duration_ms, int(round(words[-1]["end"] * 1000)) + 120)
    cues = [
        {
            "timestamp": start,
            "end": starts[index + 1] - 150 if index + 1 < len(starts) else last_spoken_end,
            "text": parts[index],
        }
        for index, start in enumerate(starts)
    ]
    return cues, coverage


def main() -> None:
    available_only = "--available" in sys.argv
    print("Cargando faster-whisper small para validar 45 audios…", flush=True)
    model = WhisperModel("small", device="cpu", compute_type="int8")
    manifest_entries: list[str] = []
    processed = 0

    for number in range(1, LESSON_COUNT + 1):
        lesson_id = f"componentes-lit-{number:02d}"
        audio_path = AUDIO / f"{lesson_id}.mp3"
        metadata_path = AUDIO / f"{lesson_id}.json"
        script_path = SCRIPTS / f"{number:02d}.md"
        missing = [required for required in [audio_path, metadata_path, script_path] if not required.exists()]
        if missing and available_only:
            continue
        if missing:
            raise RuntimeError(f"Falta {missing[0].relative_to(ROOT)}")

        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        if metadata.get("engine") != "gemini-3.1-flash-tts-preview":
            raise RuntimeError(f"{metadata_path.name}: modelo de voz incorrecto")
        parts = paragraphs(script_path.read_text(encoding="utf-8"))
        if len(parts) != 6:
            raise RuntimeError(
                f"{script_path.name}: se esperaban 6 párrafos y se encontraron {len(parts)}"
            )

        cached_cues = metadata.get("cues")
        cached_coverage = float(metadata.get("transcriptCoverage", 0))
        if isinstance(cached_cues, list) and len(cached_cues) == 6 and cached_coverage >= 0.82:
            cues = cached_cues
            coverage = cached_coverage
            print(
                f"[{number:02d}/{LESSON_COUNT}] {audio_path.name}: alineación válida existente.",
                flush=True,
            )
        else:
            print(f"[{number:02d}/{LESSON_COUNT}] Alineando {audio_path.name}…", flush=True)
            segments, _ = model.transcribe(
                str(audio_path),
                language="es",
                word_timestamps=True,
                vad_filter=True,
                beam_size=1,
            )
            words: list[dict] = []
            for segment in segments:
                for word in segment.words or []:
                    tokens = tokenize(word.word)
                    if tokens:
                        words.append({"word": tokens[0], "start": word.start, "end": word.end})
            if not words:
                raise RuntimeError(f"{audio_path.name}: Whisper no devolvió palabras")
            cues, coverage = align_paragraphs(parts, words, metadata["durationMs"])
        if coverage < 0.82:
            raise RuntimeError(
                f"{audio_path.name}: el audio solo cubre {coverage:.1%} del guion; no se acepta como completo"
            )
        if cues[-1]["end"] < metadata["durationMs"] * 0.72:
            raise RuntimeError(f"{audio_path.name}: la narración termina demasiado pronto; posible truncado")

        metadata["cues"] = cues
        metadata["transcriptCoverage"] = round(coverage, 4)
        metadata_path.write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        cue_values = ", ".join(str(cue["timestamp"]) for cue in cues)
        end_values = ", ".join(str(cue["end"]) for cue in cues)
        manifest_entries.append(
            f"  '{lesson_id}': {{ url: '/audio/{lesson_id}.mp3?v={CACHE_VERSION}', "
            f"durationMs: {metadata['durationMs']}, cues: [{cue_values}], ends: [{end_values}] }},"
        )
        processed += 1
        print(f"  cobertura: {coverage:.1%} · marcas: {cue_values}", flush=True)

    if processed != LESSON_COUNT:
        print(
            f"Alineación parcial terminada: {processed}/{LESSON_COUNT}. El manifiesto no se modificó.",
            flush=True,
        )
        return

    MANIFEST.write_text(
        "\n".join(
            [
                "// Generado por scripts/align-component-course-audio.py. No edites duraciones ni marcas a mano.",
                "export const COMPONENT_AUDIO_BY_LESSON: Record<string, { url: string; durationMs: number; cues: number[]; ends: number[] }> = {",
                *manifest_entries,
                "};",
                "",
            ]
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
