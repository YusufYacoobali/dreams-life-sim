# Shared review snapshots

These immutable images replace duplicated base64 data in historical review HTML. Filenames identify the original embedded source's SHA-256. The encoding uses lossless WebP when smaller, with exact decoded RGBA comparisons and preserved colour profiles; otherwise it keeps the original image. Current app artwork is separate and remains PNG.

Keep this directory with the review pages. Run `python tools/compact-review-html.py` after generating another HTML review to share its images without embedding copies in the HTML.
