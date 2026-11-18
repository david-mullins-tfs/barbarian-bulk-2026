# Atlas in-app header emblem — parity with Hesperides

Hesperides already displays its 40px golden apple icon alongside the app name in the fixed header. Atlas was missing its equivalent, as shown in the user's iPhone comparison.

This change adds the **existing approved Atlas icon** (icons/icon-192.png) to the Atlas app header in a 40px area. The image uses decorative alt text because the word ATLAS immediately follows. Matching Hesperides' existing treatment makes both apps feel part of the same family without changing either art asset or color palette.

Responsive CSS keeps the icon, Heldkraft label, ATLAS / Barbarian Bulk title, and menu button readable on narrow iPhones; the original four tabs remain intact. The Atlas stylesheet and service-worker cache namespace are versioned to refresh installed PWAs.

No changes to Hesperides, splash screens, persistent data keys, workout business logic, or icon PNG files.

Rollback: backup/heldkraft-before-atlas-header-icon-2026-11-18 (baseline production SHA 3c2742513835fc51f245e7b33ea05f002270ad1c). Preview and tests on review branch before main deployment.
