#!/usr/bin/env bash
#
# Extract frames from star trail videos for canvas-based playback
#
# Usage:
#   ./scripts/extract-frames.sh <video-file> [output-dir] [fps] [quality]
#
# Examples:
#   ./scripts/extract-frames.sh startrail1.mp4 ./frames/startrail1
#   ./scripts/extract-frames.sh startrail1.mp4 ./frames/startrail1 15 85
#
# Requires: ffmpeg
# Outputs WebP frames at the given FPS (default: 12) and quality (default: 85)
# Frames are named frame-0001.webp, frame-0002.webp, etc.
# Also generates a manifest.json with frame count and metadata.

set -euo pipefail

VIDEO="${1:?Usage: extract-frames.sh <video> [output-dir] [fps] [quality]}"
OUTDIR="${2:-./frames/$(basename "$VIDEO" | sed 's/\.[^.]*$//')}"
FPS="${3:-12}"
QUALITY="${4:-85}"

if ! command -v ffmpeg &>/dev/null; then
  echo "Error: ffmpeg is required. Install it first."
  exit 1
fi

mkdir -p "$OUTDIR"

echo "Extracting frames from: $VIDEO"
echo "Output: $OUTDIR"
echo "FPS: $FPS, Quality: $QUALITY"
echo ""

# Extract frames as WebP
ffmpeg -i "$VIDEO" \
  -vf "fps=$FPS,scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
  -c:v libwebp -quality "$QUALITY" \
  -loglevel warning -stats \
  "$OUTDIR/frame-%04d.webp"

# Count frames
FRAME_COUNT=$(ls -1 "$OUTDIR"/frame-*.webp 2>/dev/null | wc -l)

# Get video duration
DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$VIDEO" | cut -d. -f1)

# Get resolution of first frame
RESOLUTION=$(identify -format "%wx%h" "$OUTDIR/frame-0001.webp" 2>/dev/null || echo "unknown")

# Total size
TOTAL_SIZE=$(du -sh "$OUTDIR" | cut -f1)

# Generate manifest
cat > "$OUTDIR/manifest.json" <<MANIFEST
{
  "source": "$(basename "$VIDEO")",
  "frames": $FRAME_COUNT,
  "fps": $FPS,
  "duration": $DURATION,
  "resolution": "$RESOLUTION",
  "quality": $QUALITY,
  "pattern": "frame-{NNNN}.webp"
}
MANIFEST

echo ""
echo "── Done ──"
echo "  Frames: $FRAME_COUNT"
echo "  Duration: ${DURATION}s"
echo "  Resolution: $RESOLUTION"
echo "  Total size: $TOTAL_SIZE"
echo "  Manifest: $OUTDIR/manifest.json"
