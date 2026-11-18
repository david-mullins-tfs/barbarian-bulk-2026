# Heldkraft design review: Atlas & Hesperides identity study

This is a **review branch**, not a change to the live production branch.

## Visual direction
- **Atlas**: midnight black (#080E17), deep navy (#142234), antique gold (#D2AD70), bronze and steel-blue details.
- **Hesperides**: garden black (#09130F), deep green (#14241A), champagne gold (#E9C77D), restrained botanical accents.
- Both retain the existing approved high-resolution borderless launch art.
- Both retain **HELDKRAFT PERFORMANCE RESEARCH**, their title, tagline and subtitle on launch.
- The **Home Screen icon contains only the app name**, not tagline or subtitle; no ornate outer border.
- Icons are generated from the *same approved original launch artwork* for image consistency.

## Reproduce icons
The source assets remain: icons/atlas-launch.webp and hesperides/icons/hesperides-launch.webp.
Run:
    python -m pip install Pillow==11.3.0
    python scripts/build_heldkraft_icons.py

The design-branch GitHub Action runs this builder and commits its eight generated PNG files to this **design branch only**. It does not merge or publish to main.

## Preserve all data
No changes were made to JavaScript application logic or persisted data formats. The storage keys remain:
- Atlas: barbarian_bulk_pwa_v1
- Hesperides: hesperides_nutrition_v1

The service workers use isolated, versioned cache names and update independently.

## Rollback
Unmodified baseline commit: 1b5ddb1f029b69adc9c05e8bb7dc8f10cdf86b9e
Preserved backup branch: backup/heldkraft-before-identity-2026-11-17
Current production is main and remains unchanged until this branch is reviewed and merged.

## iPhone warning
A changed PWA icon can remain cached on iOS Home Screen even after the website updates. **Export a verified backup before ever removing a Home Screen installation.** Never clear browser website data or uninstall just to refresh branding.
