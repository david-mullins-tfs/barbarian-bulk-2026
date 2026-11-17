# ATLAS v37.1 + HESPERIDES v1.1 — Brand slogans and USDA Food Search Preview

## Taglines

- **ATLAS — Lift the World.** Displayed in the Workout hero with **Strength, Measured.** immediately beneath.
- **HESPERIDES — Eat Like a God.** Displayed in the app header and Today hero, with **Nutrition, Measured.** preserved as its descriptive companion.
- App manifest descriptions and versioned HTML/CSS reflect the new language.

## Hesperides v1.1 — USDA Food Search (PREVIEW)

A new **Search USDA Food Database** panel appears in the **Foods** tab. Search by descriptive food name and tap **Review & save** to prefill the manual food editor with the selected USDA entry. The member reviews and saves the information to their personal food library. The saved food is then available through the existing **Plan / Log food** flow.

Results include description, brand (if present), food data type, source record ID, and grams of protein, fat and carbohydrate **per 100 g**. Calorie labels are calculated from those macros using 4/4/9, so they may differ from packaged labels. Incomplete nutrient results are not auto-imported. All imported records retain an USDA source ID. Existing saved foods and meal logs are not changed. Selecting a search result does not count it as eaten.

The app uses the public USDA FoodData Central **DEMO_KEY** for exploratory lookups. Per USDA documentation the demo is limited to **30 requests/hour and 50/day per IP**. Search only runs when explicitly submitted (never on each keystroke), and error messages fall back to manual entry. The app does **not** embed a private API key. For a more dependable production rollout, set up a small authenticated server-side API proxy with a private USDA key held in a server secret—not in GitHub Pages HTML/JS.

We verified the interface and lookup parser using mocked USDA JSON responses, but could not verify a live browser-to-USDA request from this environment. Browser/network restrictions, CORS, USDA availability and demo throttling may affect actual iPhone search. This is a **preview to test in the live app**, not a guarantee of production availability.

Sources:
- https://fdc.nal.usda.gov/api-guide/
- https://fdc.nal.usda.gov/

## Safe rollout

- Hesperides storage key remains **hesperides_nutrition_v1**, and ATLAS storage remains **barbarian_bulk_pwa_v1**. No storage migrations or data resets.
- Hesperides food records are extended only with optional `source` and `sourceId`.
- No existing exercise, workout, history, recovery, macros, meals, member profiles or 12-week program definitions changed.
- The two PWA service workers retain separate cache namespaces and updated version strings.
- Regression tests cover brand strings, USDA results parsing, review/edit/save, nutrition attribution, full meal log preservation, archive and backup isolation.

## Try it

1. Open ATLAS `?v=37.1`: confirm **Lift the World** on Workout and unchanged saved training data.
2. Open Hesperides: confirm **Eat Like a God** and go to **Foods**.
3. Search for **chicken breast** or **Greek yogurt**, review a result marked **per 100 g**, then tap **Review & save**.
4. Verify the grams against your food's packaging, click Save, and use the saved food to plan or log a meal.
5. If USDA is offline, blocked or rate-limited, the manual food form still works. Never delete the installed PWA or clear its data to fix a cache issue.

For broader database coverage, FoodData Central can be paired later with Open Food Facts (packaged products; ODbL attribution/share-alike requirements) or fatsecret Platform (commercial integration requiring OAuth/key, with limited free tier). Select those separately after reviewing license and infrastructure requirements.
