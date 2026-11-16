# Atlas v36 — Exercise Gallery and Illustration Refresh

**Status:** Live-release candidate, authorized for deployment and iterative real-time review.

## Coverage

All 58 Exercise Library names have image routes:
- **3 original ATLAS engravings retained:** Barbell Back Squat, Barbell Bench Press, Pec Deck.
- **55 updated exercise references** are mapped to 46 distinct exercise illustrations from [Open Exercise Illustrations](https://github.com/MarvinNazari/exercise-images), licensed **CC0-1.0**. Source pinned to immutable commit `2786aefa4b36a08faeca8114e0d1eb0af3ef6732`.
- For new references Atlas displays warm antique-gold-tinted images on its iron-black UI, and a start/finish comparison in the Exercise Detail dialog.
- A searchable **Exercise Gallery** is accessible from Home and the hamburger menu. A `!` marker flags images that need equipment/variation confirmation.
- Legacy stick SVG files remain in the repository only as backward-compatible historical assets; the main exercise-card and gallery routes use the new images.

## Review flags

The initial open-source illustrated references may not exactly depict local equipment for: Smith Machine Deadlift, Lunges, Leg Curls, Plate-Loaded Chest Press, Assisted Chin-Ups, Cable Bent-over Triceps Extension, Incline Press, Seated Shoulder Press, Walking Lunges, Rear Delt Fly on Bench, Leg Press (Feet Higher), and Leg Extensions (Lighter).

These mappings are flagged in `atlas-art-v36.js` and the Exercise Gallery. Review the illustration at your equipment and describe any mismatch by exercise name. We can replace individual references in a targeted follow-up without changing training logs.

## Offline behavior and dependencies

The new reference art is **served from the pinned GitHub raw image repository**, rather than embedded as 55 new binary assets. This enables a complete first pass through the connected GitHub code tools, but **requires internet access the first time each image is viewed**. The v36 service worker caches reference images after they are requested by the app. Previously viewed images can then remain available offline while stored in the browser cache. An image that hasn't been fetched yet may show a neutral ATLAS fallback if offline.

The original three engraved images and other PWA assets remain local in the app's repository.

## Safety and data integrity

The original illustrations are AI-generated and have not been professionally verified for exercise technique. They are visual references, not coaching diagrams. Machine hardware, grip, paths, limb position and body type may differ. Follow qualified instruction and actual equipment guidance.

No exercise names, metadata, volume algorithms, progression rules, program definitions, saved user weights or notes are changed by this release. The localStorage key remains `barbarian_bulk_pwa_v1`; Barbarian Bulk and Conan Cut training histories stay intact.

## Verification and live review

Run `node artwork-v36.test.js` from repository root. The integration simulation separately confirmed that 58 gallery cards render, 3 original illustrations remain present, start/finish details show for new movements, and saved logs/notes are preserved.

On iPhone, open Atlas with `?v=36`, choose **Exercise Gallery**, and tap a movement to compare start and finish. Send any inaccurate movements by name. Do not uninstall the iPhone PWA or clear Safari website data.
