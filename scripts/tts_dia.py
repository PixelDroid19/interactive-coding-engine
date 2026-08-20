#!/usr/bin/env python3
"""Generate a single narration clip with Nari Labs Dia when a CUDA GPU is available.

Dia 1.6B currently targets English dialogue and GPU inference:
https://github.com/nari-labs/dia

This machine has no CUDA device and Dia is English-only.
Spanish lessons use Piper (es_MX-claude-high) instead.
To try Dia: USE_DIA=1 npm run audio:generate
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    try:
        import torch
    except ImportError:
        print("Dia: torch is not installed", file=sys.stderr)
        return 1

    if not torch.cuda.is_available():
        print("Dia: CUDA GPU not available. Use espeak-ng fallback.", file=sys.stderr)
        return 1

    try:
        from transformers import AutoProcessor, DiaForConditionalGeneration
    except ImportError:
        print("Dia: install transformers from git to use nari-labs/Dia-1.6B-0626", file=sys.stderr)
        return 1

    checkpoint = "nari-labs/Dia-1.6B-0626"
    text = args.text.strip()
    if not text.startswith("[S1]"):
        text = f"[S1] {text}"
    if not text.endswith("[S1]") and not text.endswith("[S2]"):
        text = f"{text} [S1]"

    processor = AutoProcessor.from_pretrained(checkpoint)
    model = DiaForConditionalGeneration.from_pretrained(checkpoint).to("cuda")
    inputs = processor(text=[text], padding=True, return_tensors="pt").to("cuda")
    outputs = model.generate(
        **inputs,
        max_new_tokens=3072,
        guidance_scale=3.0,
        temperature=1.8,
        top_p=0.90,
        top_k=45,
    )
    decoded = processor.batch_decode(outputs)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    processor.save_audio(decoded, str(out_path))
    print(f"Dia wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
