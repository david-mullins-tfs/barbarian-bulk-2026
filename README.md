# Barbarian Bulk PWA v19

- Editable program by member/day.
- Exercise library with default rep ranges and muscle metadata.
- Substitute exercises without deleting historical logs.
- Tuesday default updated: Overhead Press -> Pec Deck (3 x 10-15).
- Existing v18 features retained.

## v20 notes
- Workout-level notes can be pinned to a specific member/week/day.
- Exercise-level notes can be pinned to an exercise in that workout.
- Set-level notes can be pinned to an individual working set.
- Notes are stored in the existing local backup/export data and survive app updates.
- A highlighted note icon indicates that context has been saved.


## v23
- Phone bottom navigation reduced to Workout, Volume, Macros, Cardio, and Notes.
- Progress, Plate Counter, Program Editor, Settings, and backup tools moved to the hamburger menu.
- Added extra bottom safe-area spacing so workout Finish/Save controls are not covered.
- Bottom navigation is locked to a single five-item row.


## v23 equipment upgrade
- Main squat, bench, and deadlift slots now use 45 lb free-weight barbells. Previous Smith-machine logs remain intact.
- Added Smith Machine Squat/Bench Press/Deadlift as library substitutions.
- Added Plate-Loaded Hack Squat (105 lb starting resistance), Plate-Loaded Seated Calf Raise (0 lb), and Plate-Loaded Chest Press (0 lb).
- Plate Counter now supports machine starting resistance, including 0 and 105 lb presets.
- Calves are now available as a Weekly Volume muscle category through the seated calf raise.


## v24
Warm-up sections start collapsed, with tap-to-expand details. Program Editor includes move-up/move-down controls that preserve unsaved edits until Save Program Changes. Workout cards have clearer visual hierarchy and status borders.


## v25 Heritage theme
- Uses the supplied gold Atlas A artwork as the iPhone/PWA icon (192 and 512 px).
- Applies Heldkraft palette: Iron Black #151B23, Antique Gold #C59A59, Vintage Cream #E8DCC7, Steel Gray #56616D.
- Retains Barbarian Bulk app name and all v24 functionality/data keys.
- Cache version updated to v25. iOS Home Screen icons may require reinstalling the shortcut after exporting a backup; do not delete the app before backing up local data.


## v26: flexible sessions
- Added Front Squat (45-lb bar), Cable Bent-over Triceps Extension, and Landmine Row (45-lb bar) to the library.
- On workout cards, Swap exercise offers **This workout only** or **Rest of program**. One-day swaps use session overrides and do not change the program; permanent swaps update the member's program while retaining earlier weeks.
- Skip today hides an exercise from this session and excludes it from that session's completion/volume; Restore reverses the skip. Existing logs are not deleted.
- Atlas icon's black background has been harmonized with Iron Black.


## v27 — Atlas UI
- Atlas by Heldkraft Performance Research branding and golden-era palette.
- Distinctive exercise cards and compact three-dot exercise action menu.
- Original swap/skip actions retained inside the menu; all data keys unchanged.
- PWA name Atlas; Barbarian Bulk remains the training program.
- Deploy all files at the repository root, not an enclosing folder.
- Export a JSON backup before upgrading. Do not delete the installed iPhone PWA until your data is safely backed up.


## v28 illustrated Atlas workout cards
Original lightweight SVG movement studies for all library exercises are bundled in `exercise-art/` and cached for offline use. Tap an illustration for an exercise information panel. Illustrations are stylized references, not detailed coaching instructions. Existing storage keys, program logic, notes, and progression are unchanged.


## v29: Three-exercise dual-style illustration pilot

Pec Deck, Barbell Bench Press and Barbell Back Squat now use vintage illustrated thumbnails and larger detail views with text descriptions of start/finish positions and setup cues. Other exercises retain the v28 SVG illustrations. The three new images are **visual concept crops**, not independently verified anatomical instruction. This is an opt-in pilot for visual review; do not treat illustrations as technique coaching. The local data key is unchanged.


## v30 movement-position corrections
Expanded detail screens for Pec Deck, Barbell Bench Press and Barbell Back Squat now include paired, explicitly drawn start/finish movement schematics. These schematics are not anatomical coaching illustrations and do not replace equipment instructions or professional guidance. The existing golden-era hero art is unchanged pending visual approval.

## v31 squat artwork pilot

Replaced the Barbell Back Squat stick-figure start/finish illustrations with cropped vintage-engraving artwork from the approved visual concept. The card/hero uses the same rear-view squat illustration. Pec Deck and Bench Press remain unchanged from v30. This is a visual review build; do not treat AI-generated illustrations as verified exercise coaching.
