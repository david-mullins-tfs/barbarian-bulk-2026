# Atlas and Hesperides transparent in-app header emblems

Both headers now reuse the **existing real alpha PNG splash artwork** rather than the square Home Screen icon. The gold Atlas sculpture and gold apple have no embedded app names, no box, and no opaque background. The HTML headings and menu buttons remain unchanged.

## What changed
- Atlas uses `icons/atlas-launch-cutout.png?v=alpha1` in the existing Atlas header emblem slot.
- Hesperides uses `hesperides/icons/hesperides-launch-cutout.png?v=alpha1` in its brand header.
- 44x52px emblems fit the header; screens at 390px wide or less use 38x46px. CSS forces a fully transparent container with no border or radius.
- Stylesheet URL versions and app-specific service-worker cache IDs were incremented so installed PWAs refresh both headers independently.
- Home Screen icon PNGs, launch/splash art, manifests, and saved workout/nutrition data formats are untouched.

## Check
Run `node atlas-header-icon.test.js`, `node hesperides/tests.js`, and `node hesperides/meal-picker.test.js`. GitHub Actions runs these for the review branch and pull requests.

## Rollback
Production baseline before either header adjustment: `3c2742513835fc51f245e7b33ea05f002270ad1c`. Backup branch `backup/heldkraft-before-atlas-header-icon-2026-11-18`. Earlier review branch `fix/atlas-matching-header-icon-2026-11-18` remains available.

Do not remove installed Home Screen PWAs or clear iPhone website data to refresh these changes: locally stored training and nutrition records must be preserved.
