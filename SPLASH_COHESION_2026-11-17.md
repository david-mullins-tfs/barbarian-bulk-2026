# Heldkraft — Seamless splash-to-app background study

**Review branch**: design/heldkraft-seamless-splash-2026-11-17. Do not merge until visually reviewed.

The approved Atlas sculpture and Hesperides apple assets, Home Screen icons and tagline hierarchy remain unchanged.

## Problem
Previous splash CSS used pure black as the underlying color. That was darker than the actual app background:
- Atlas #080E17 with steel-blue highlights
- Hesperides #09130F with forest-green highlights

## Targeted solution
The splash now uses the exact corresponding app color at top and bottom with a subtle central atmospheric gradient (steel blue for Atlas, garden green for Hesperides). The already-approved gold artwork is blended with CSS lighten mode, so its encoded black backdrop disappears into the app-matched color while the original gold highlight values are preserved.

This is not a redesign and does not touch:
- Training or meal picker business logic
- Saved user data/storage formats
- Existing iPhone icons or manifest fields
- The original WebP assets

Both service workers have new, separate cache versions to refresh existing launch HTML on devices.

## Comparison & tests
The static QA graphic at preview/heldkraft-seamless-splash.png shows current black versus proposed matched splash next to representative app surfaces. It is a modeled preview built from the real WebP images, not a physical iPhone screenshot.

Run in repo root:
python -m pip install Pillow==11.3.0
python scripts/build_splash_cohesion_review.py
node splash-cohesion.test.js
node hesperides/tests.js
node hesperides/meal-picker.test.js

## Rollback
Production base commit before this study: 8e2dcea8a0e9f7b510abd0761d58246b7cc5d4ee
Immutable reference branch: backup/heldkraft-pre-splash-cohesion-2026-11-17
The branch backup/heldkraft-before-identity-2026-11-17 also preserves the earlier legacy appearance.

No changes to main until approved.
