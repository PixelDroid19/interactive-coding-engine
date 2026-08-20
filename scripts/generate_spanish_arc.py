#!/usr/bin/env python3
"""Generate Spanish lesson narration with Kokoro on Intel Arc (XPU)."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "public" / "audio"
VOICE = "ef_dora"
SPEED = 0.86
SAMPLE_RATE = 24000


def to_numpy(audio) -> np.ndarray:
    if hasattr(audio, "detach"):
        audio = audio.detach()
    if hasattr(audio, "cpu"):
        audio = audio.cpu()
    if hasattr(audio, "numpy"):
        audio = audio.numpy()
    data = np.asarray(audio, dtype=np.float32).reshape(-1)
    peak = np.max(np.abs(data)) if data.size else 0.0
    if peak > 1.0:
        data = data / peak
    return data


def split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?…])\s+", text.strip())
    return [part.strip() for part in parts if part.strip()]


def synthesize(pipeline: KPipeline, text: str) -> np.ndarray:
    sentences = split_sentences(text) or [text.strip()]
    chunks: list[np.ndarray] = []
    pause = np.zeros(int(SAMPLE_RATE * 0.28), dtype=np.float32)
    for index, sentence in enumerate(sentences):
        produced = False
        for _gs, _ps, audio in pipeline(sentence, voice=VOICE, speed=SPEED):
            chunks.append(to_numpy(audio))
            produced = True
        if not produced:
            raise RuntimeError(f"Kokoro produced no audio for: {sentence!r}")
        if index < len(sentences) - 1:
            chunks.append(pause)
    return np.concatenate(chunks)


def fit_length(src: Path, dest: Path, max_sec: float) -> None:
    probe = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(src),
        ],
        text=True,
    ).strip()
    duration = max(0.2, float(probe or "0.2"))
    if duration <= max_sec + 0.12:
        shutil.copyfile(src, dest)
        return
    # Never speed up: that is what made the voice sound mechanical.
    # Keep natural pace and fade if a cue overruns its slot.
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-t",
            f"{max_sec:.3f}",
            "-af",
            "afade=t=out:st={:.3f}:d=0.18".format(max(0.2, max_sec - 0.18)),
            str(dest),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def mix_lesson(lesson_id: str, duration_ms: int, cues: list[dict], tmp: Path, pipeline: KPipeline) -> None:
    duration_sec = max(1.0, duration_ms / 1000)
    bed = tmp / f"{lesson_id}-bed.wav"
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"anullsrc=r={SAMPLE_RATE}:cl=mono",
            "-t",
            f"{duration_sec:.3f}",
            str(bed),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    cue_files: list[tuple[Path, int]] = []
    for index, cue in enumerate(cues):
        raw = tmp / f"{lesson_id}-raw-{index}.wav"
        fitted = tmp / f"{lesson_id}-cue-{index}.wav"
        wav = synthesize(pipeline, cue["text"])
        sf.write(raw, wav, SAMPLE_RATE)
        next_ts = cues[index + 1]["timestamp"] if index + 1 < len(cues) else duration_ms - 350
        max_sec = max(0.9, (next_ts - cue["timestamp"] - 80) / 1000)
        fit_length(raw, fitted, max_sec)
        cue_files.append((fitted, max(0, int(cue["timestamp"]))))
        print(f"  cue {index + 1}/{len(cues)} @ {cue['timestamp']}ms -> {raw.name}")

    inputs: list[str] = ["-y", "-i", str(bed)]
    for path, _delay in cue_files:
        inputs += ["-i", str(path)]
    filters = ";".join(
        f"[{i + 1}]adelay={delay}:all=1[a{i}]" for i, (_path, delay) in enumerate(cue_files)
    )
    mix_map = "[0]" + "".join(f"[a{i}]" for i in range(len(cue_files)))
    filter_complex = f"{filters};{mix_map}amix=inputs={len(cue_files) + 1}:duration=first:dropout_transition=0:normalize=0[mix]"
    mixed = tmp / f"{lesson_id}-mixed.wav"
    subprocess.check_call(
        [
            "ffmpeg",
            *inputs,
            "-filter_complex",
            filter_complex,
            "-map",
            "[mix]",
            "-ac",
            "1",
            "-ar",
            str(SAMPLE_RATE),
            str(mixed),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    normalized = tmp / f"{lesson_id}-norm.wav"
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(mixed),
            "-af",
            "highpass=f=80,lowpass=f=12000,equalizer=f=220:t=q:w=0.8:g=1.5,equalizer=f=3500:t=q:w=1:g=-1.5,loudnorm=I=-16:TP=-1.5:LRA=11",
            str(normalized),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    mp3 = AUDIO_DIR / f"{lesson_id}.mp3"
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        ["ffmpeg", "-y", "-i", str(normalized), "-codec:a", "libmp3lame", "-qscale:a", "3", str(mp3)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print(f"Wrote {mp3}")


def main() -> None:
    if not torch.xpu.is_available():
        raise SystemExit("Intel Arc XPU is not available. Source oneAPI and use the XPU PyTorch venv.")

    device = "xpu"
    print(f"Using {torch.xpu.get_device_name(0)} ({device})")
    pipeline = KPipeline(lang_code="e", repo_id="hexgrad/Kokoro-82M", device=device)

    manifests = sorted(AUDIO_DIR.glob("fundamentos-*.json"))
    if not manifests:
        raise SystemExit(f"No lesson JSON manifests in {AUDIO_DIR}")

    with tempfile.TemporaryDirectory(prefix="kokoro-es-") as tmp_name:
        tmp = Path(tmp_name)
        for manifest_path in manifests:
            manifest = json.loads(manifest_path.read_text())
            cues = manifest.get("cues") or []
            if not cues:
                continue
            print(f"Lesson {manifest['id']}: {len(cues)} Spanish cues")
            mix_lesson(manifest["id"], int(manifest["durationMs"]), cues, tmp, pipeline)
            manifest["engine"] = f"kokoro-es-{VOICE}-arc-a770"
            manifest["language"] = "es"
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
