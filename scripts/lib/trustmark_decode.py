"""Read TrustMark identifiers back out of images.

This is the half that makes the watermark worth having. Embedding is a claim; decoding is the
evidence. Point it at a file someone else published and it tells you which of your photographs
it is, if any.

Usage:  trustmark_decode.py out.json image [image ...]
"""

import json
import sys

from PIL import Image

from trustmark import TrustMark


def main(out_path: str, paths: list[str]) -> int:
    tm = TrustMark(verbose=False, model_type="Q", encoding_type=TrustMark.Encoding.BCH_4)

    found = []
    for p in paths:
        try:
            img = Image.open(p).convert("RGB")
        except Exception as e:
            found.append({"path": p, "error": str(e)})
            continue
        # ROTATION lets it recover from images that were turned, which happens when a frame is
        # re-shared through an app that rewrites orientation.
        secret, present, _ = tm.decode(img, MODE="text", ROTATION=True)
        found.append(
            {
                "path": p,
                "id": secret.rstrip("\x00").strip() if present else None,
                "present": bool(present),
                "size": f"{img.width}x{img.height}",
            }
        )
        print(f"  {'FOUND' if present else '  -  '}  {p}", flush=True)

    open(out_path, "w").write(json.dumps(found, indent=2))
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2:]))
