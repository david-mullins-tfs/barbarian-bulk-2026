# Atlas / Hesperides: Remove baked-in black from launch artwork

## User-reported issue
On iPhone, the new navy and forest green launch screens show large hard-edged black rectangles behind Atlas and the gold apple. This is because the original high-resolution WebP assets contain solid black pixels. CSS mix-blend-mode: lighten did not eliminate the visible boundaries in the actual iOS splash rendering.

## Corrective change
- Keep the original source WebP files exactly as they were.
- Generate new **real RGBA PNG files** with transparent black/near-black backgrounds:
  - icons/atlas-launch-cutout.png
  - hesperides/icons/hesperides-launch-cutout.png
- Use those transparent images directly in launch HTML with a plain normal blend.
- Retain the navy/steel and forest-green app-matched gradients, emblem, title, taglines and subtitles.
- Version the image URLs separately to prevent iOS cached old images from displaying.
- Update independent Atlas and Hesperides service-worker cache namespaces and precache the new PNGs.
- Do **not** change any installed Home Screen icon assets, storage keys, workout logic, nutrition math, or meal picker functionality.

## Testing / review
The branch workflow generates alpha PNG cutouts, validates transparency and that the full-resolution gold RGB remains intact, generates the before/after visual QA sheet, and runs the existing Hesperides integration and meal-picker tests. Inspect the visual review at preview/heldkraft-transparent-splash.png before releasing.

## Rollback
Backup branch: backup/heldkraft-pre-transparent-splash-2026-11-18
Baseline production SHA: 968af118d895bb04b60df5b8257a6e94b81bbf63

The branch is review-only until approved/tested. Preserve installed PWAs and their local data.
