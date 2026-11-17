# ATLAS v37 + Hesperides v1

## Apps

ATLAS: https://david-mullins-tfs.github.io/barbarian-bulk-2026/?v=37
Hesperides: https://david-mullins-tfs.github.io/barbarian-bulk-2026/hesperides/

Hesperides is a separate installable, mobile-first nutrition PWA at the /hesperides/ path. It has its own manifest, Home Screen name, service worker, cache namespace, and localStorage key. It remains in the existing GitHub Pages repo to deploy reliably without additional repository settings.

## ATLAS v37

- Bottom navigation: Workout, Exercises, Volume, Progress.
- Searchable Exercise Library with thumbnails and primary muscle and equipment filters. Tap a movement for the existing start/finish views.
- Cardio, Notes, Plate Counter, Program Editor, Program Library, Settings all remain accessible from the menu.
- Macros is removed from the bottom bar; legacy macro records remain accessible in Settings and all records are preserved.
- Settings and menu offer Open Hesperides and Export legacy macro history. Full Atlas backups remain available.

## Hesperides v1

- Adults enter age, weight in pounds, height in feet and inches, BMR physiology coefficient, activity level, 2-7 meals/day, and a goal: Growth, Maintenance or Fat Loss.
- Mifflin-St Jeor BMR and an activity factor estimate maintenance. Growth starts at +250 kcal, Fat Loss subtracts up to 400 kcal (roughly 15% when lower), and Maintenance targets estimated expenditure. Starting protein and fat macros are suggested from body weight, with remaining calories allocated to carbs. Custom macro targets are available.
- Food Library stores user-provided foods with labeled servings and gram values for protein, carbs and fat. A food edit does not rewrite already logged meals.
- Plan a day in advance, including future dates, with automatic per-meal macro targets. Save and reuse full-day templates, or copy yesterday's plan.
- Planned foods are NOT counted as consumed. Log a single planned food, an entire planned meal or something different directly. Edit logs by removing and adding foods. Each day shows consumed vs planned vs target.
- Completed status uses a reasonable tolerance around daily/meal calorie and macro totals rather than rewarding overeating. Users can view older daily logs, backup/restore JSON and migrate historical Atlas macro aggregates.
- Profiles, food libraries, templates and meals stay separate for David, Dan, Jason and Vinjo. All records are on-device only, no cross-phone synchronization.

## Safe nutrition migration

Especially for separately installed iPhone PWAs, use the reliable file path:
1. In ATLAS, select the menu or Settings and Export legacy macros.
2. In Hesperides, choose menu > History & ATLAS import > Import ATLAS archive file.
3. Select the downloaded atlas-macro-archive.json.

A direct same-origin import is also available, but separately installed iOS PWAs may have isolated storage. Importing an ATLAS archive never deletes or modifies the original and keeps its daily aggregate records separate from meal-level food entries.

## Safety, QA and deployment

- ATLAS storage key remains barbarian_bulk_pwa_v1, Hesperides uses hesperides_nutrition_v1.
- ATLAS's 12-week plans, exercise names, notes, volume, recovery and workout weights are untouched.
- Atlas and Hesperides service workers clear only their OWN cache prefixes so they do not invalidate each other.
- Nutrition calculations are adult estimates, not clinical care. Food values must come from actual product labels or another trusted source. No barcode or third-party food database is in v1.
- Before changing devices, export backups from both apps and verify them. Do not delete installed PWAs or clear site data without backups.

Regression test: node hesperides/tests.js
Manual checks: four Atlas tabs, Cardio and Notes menu, Exercise Library filters, Hesperides goals/food/meal planning/consumption/history, data export and import.
