"""
Build docs/media/demo.gif from a folder of screenshots (1.png, 2.png, ...).

Frames come from a Playwright run (see docs/media/README.md). Pillow is the only dependency:

    python3 -m pip install pillow
    python3 scripts/make-demo-gif.py <frames-dir> docs/media/demo.gif
"""

import sys
from pathlib import Path
from PIL import Image

WIDTH = 960
HOLD_MS = [1400, 1400, 1600, 1200, 1800, 1400]  # how long each frame stays, in order

def main(frames_dir: str, out: str) -> None:
    files = sorted(Path(frames_dir).glob('*.png'), key=lambda p: int(p.stem))
    if not files:
        sys.exit(f'No PNG frames in {frames_dir}')
    images = []
    for f in files:
        img = Image.open(f).convert('RGB')
        height = round(img.height * WIDTH / img.width)
        images.append(img.resize((WIDTH, height), Image.LANCZOS).quantize(colors=128))
    durations = [HOLD_MS[i] if i < len(HOLD_MS) else 1500 for i in range(len(images))]
    images[0].save(out, save_all=True, append_images=images[1:], duration=durations, loop=0, optimize=True)
    print(f'wrote {out} ({len(images)} frames)')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit('usage: make-demo-gif.py <frames-dir> <out.gif>')
    main(sys.argv[1], sys.argv[2])
