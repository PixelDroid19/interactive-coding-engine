#!/usr/bin/env python3
"""Align the four spoken paragraphs of every JavaScript lesson to its generated MP3."""

from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "public" / "audio"
SCRIPTS = ROOT / "docs" / "guiones" / "javascript"
MANIFEST = ROOT / "src" / "curriculum" / "javascript" / "audioManifest.ts"


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-záéíóúüñ0-9]+", text.lower())


def paragraphs(markdown: str) -> list[str]:
    body = re.sub(r"^---[\s\S]*?---\n", "", markdown).strip()
    return [part.strip() for part in re.split(r"\n\s*\n", body) if part.strip()]


def paragraph_cues(parts: list[str], words: list[dict], duration_ms: int) -> list[dict]:
    script_tokens: list[str] = []
    boundaries: list[int] = []
    for part in parts:
        boundaries.append(len(script_tokens))
        script_tokens.extend(tokenize(part))

    spoken_tokens = [word["word"] for word in words]
    matcher = SequenceMatcher(None, script_tokens, spoken_tokens, autojunk=False)
    mapping: dict[int, int] = {}
    for block in matcher.get_matching_blocks():
        for offset in range(block.size):
            mapping[block.a + offset] = block.b + offset

    starts: list[int] = []
    for paragraph_index, boundary in enumerate(boundaries):
        if paragraph_index == 0:
            word_index = 0
        else:
            candidates = [(abs(script_index - boundary), spoken_index) for script_index, spoken_index in mapping.items()]
            word_index = min(candidates)[1] if candidates else round(boundary / max(1, len(script_tokens)) * len(words))
        word_index = max(0, min(word_index, len(words) - 1))
        starts.append(int(round(words[word_index]["start"] * 1000)))

    starts[0] = max(0, starts[0])
    for index in range(1, len(starts)):
        starts[index] = max(starts[index], starts[index - 1] + 500)

    last_spoken_end = min(duration_ms, int(round(words[-1]["end"] * 1000)) + 120)
    return [
        {
            "timestamp": start,
            "end": (starts[index + 1] - 150 if index + 1 < len(starts) else last_spoken_end),
            "text": parts[index],
        }
        for index, start in enumerate(starts)
    ]


def main() -> None:
    print("Cargando faster-whisper small…", flush=True)
    model = WhisperModel("small", device="cpu", compute_type="int8")
    manifest_entries: list[str] = []

    for number in range(1, 25):
        lesson_id = f"javascript-{number:02d}"
        audio_path = AUDIO / f"{lesson_id}.mp3"
        metadata_path = AUDIO / f"{lesson_id}.json"
        script_path = SCRIPTS / f"{number:02d}.md"
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        parts = paragraphs(script_path.read_text(encoding="utf-8"))
        if len(parts) != 4:
            raise RuntimeError(f"{script_path.name}: se esperaban 4 párrafos y se encontraron {len(parts)}")

        print(f"[{number:02d}/24] Alineando {audio_path.name}…", flush=True)
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

        cues = paragraph_cues(parts, words, metadata["durationMs"])
        metadata["cues"] = cues
        metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        cue_values = ", ".join(str(cue["timestamp"]) for cue in cues)
        end_values = ", ".join(str(cue["end"]) for cue in cues)
        manifest_entries.append(
            f"  '{lesson_id}': {{ url: '/audio/{lesson_id}.mp3?v=gemini-20260824', "
            f"durationMs: {metadata['durationMs']}, cues: [{cue_values}], ends: [{end_values}] }},"
        )
        print(f"  marcas: {cue_values}", flush=True)

    MANIFEST.write_text(
        "\n".join([
            "// Generado por scripts/align-javascript-audio.py. No edites duraciones ni marcas a mano.",
            "export const JAVASCRIPT_AUDIO_BY_LESSON: Record<string, { url: string; durationMs: number; cues: number[]; ends: number[] }> = {",
            *manifest_entries,
            "};",
            "",
        ]),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
