"""Embed TrustMark watermarks into a batch of PNGs.

Called by scripts/watermark-photos.mjs with a JSON job file. Batched deliberately: loading the
model costs a few seconds, so doing it once for the whole archive rather than once per frame is
the difference between a minute and an hour.

Why TrustMark rather than a hand-rolled DCT watermark: it is Adobe's, published at ICCV 2025,
and it is on the C2PA approved soft-binding list, which means the identifier it carries is the
standard way to recover provenance after metadata has been stripped. It is also trained to
survive screenshotting, which is the only honest answer to "stop people screenshotting my
photographs" — you cannot stop the screenshot, but the copy still carries the mark.

Usage:  trustmark_embed.py jobs.json results.json
where jobs.json is [{"in": path, "out": path, "id": "SK1A2B3C"}, ...]
"""

import json
import math
import sys

import numpy as np
from PIL import Image

from trustmark import TrustMark

# Variant Q is the default and the one measured in the paper at 42-45 dB PSNR under severe
# degradation. BCH_4 spends ~30 of the 100 payload bits on error correction, which is what buys
# recovery after a screenshot; that leaves ~66 bits, about 9 ASCII characters.
MODEL_VARIANT = "Q"
MAX_PAYLOAD_CHARS = 9


def psnr(a: Image.Image, b: Image.Image) -> float:
    x = np.asarray(a.convert("RGB"), dtype=np.float64)
    y = np.asarray(b.convert("RGB"), dtype=np.float64)
    mse = float(np.mean((x - y) ** 2))
    return float("inf") if mse == 0 else 10 * math.log10(255.0**2 / mse)


def main(jobs_path: str, results_path: str) -> int:
    jobs = json.loads(open(jobs_path).read())
    if not jobs:
        open(results_path, "w").write("[]")
        return 0

    over = [j["id"] for j in jobs if len(j["id"]) > MAX_PAYLOAD_CHARS]
    if over:
        print(f"error: ids longer than {MAX_PAYLOAD_CHARS} chars: {over[:5]}", file=sys.stderr)
        return 2

    tm = TrustMark(verbose=False, model_type=MODEL_VARIANT, encoding_type=TrustMark.Encoding.BCH_4)

    results = []
    for i, job in enumerate(jobs, 1):
        cover = Image.open(job["in"]).convert("RGB")
        stego = tm.encode(cover, job["id"], MODE="text")
        stego.save(job["out"], format="PNG", compress_level=6)

        # Verify by reading it back out of the pixels we just wrote, rather than trusting the
        # encoder. A watermark nobody has decoded is a watermark you do not have.
        recovered, present, _ = tm.decode(Image.open(job["out"]).convert("RGB"), MODE="text")
        quality = psnr(cover, stego)

        results.append(
            {
                "id": job["id"],
                "out": job["out"],
                "verified": bool(present and recovered.rstrip("\x00") == job["id"]),
                "psnr": round(quality, 2),
                "width": stego.width,
                "height": stego.height,
            }
        )
        print(f"  [{i}/{len(jobs)}] {job['id']}  {quality:.1f} dB", flush=True)

    open(results_path, "w").write(json.dumps(results, indent=2))
    bad = [r for r in results if not r["verified"]]
    if bad:
        print(f"error: {len(bad)} watermarks did not verify", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
