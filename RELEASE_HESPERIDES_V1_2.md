# HESPERIDES v1.2 — Search directly in a meal

## Current food source

Retain USDA FoodData Central as a limited public DEMO_KEY preview, alongside My Foods and manually entered foods. **No FatSecret integration or third-party credentials are added.**

## Meal-level picker

Tap **+ Plan food** or **+ Log food** on any meal in Today or Plan. The new modal offers **Recent · Favorites · My Foods · USDA Search · Custom**. Search USDA explicitly (no request per keystroke). Pick a food to see **quantity, serving unit and recalculated protein, carbs, fat and calories**. Tap **Add to Plan** or **Log as Eaten**. The USDA food is automatically saved to your personal Food Library and Recently Used. Duplicates with the same USDA ID are avoided. Favorite any saved food.

For a never-before-used custom food, use the **Custom** tab, enter its label, then add it directly to the meal. It is saved automatically.

## Serving sizes

- **Grams default** when an accurate food-specific weight is available. Ounces convert by the standard mass conversion of 28.349523125 g per oz.
- USDA details may provide measured portions such as a specific egg, cup or tablespoon with a verified **gramWeight**. Only those measures are offered; Hesperides never guesses volume-to-weight conversions or assumes equal amounts across different units.
- e.g. where USDA says **one egg weighs 61 g**, 4 eggs are 244 g; a **1 cup = 220 g** record means 2 cups are 440 g—these are not interchangeable. Sample portions are illustrative and actual USDA results vary.
- Custom foods can optionally specify a gram weight per serving; otherwise the picker offers native servings only.
- Existing food entries with original serving sizes retain historical nutrient snapshots and remain unchanged. New entries preserve a display-friendly portion label as well as the quantity-based nutrient snapshot.

## Data and safety

Hesperides still stores data under `hesperides_nutrition_v1`. ATLAS is unchanged and uses `barbarian_bulk_pwa_v1`. Four members remain isolated; planned foods never count as eaten. Original meal templates, logs, historical archives and backups are preserved. New records add optional source, serving-weight, Recent/Favorite and portion metadata.

USDA's DEMO_KEY is only a limited trial: **30 requests/hour and 50 requests/day per IP**, and fetching more serving descriptions may consume an extra call. A live browser request was not independently verified; users should fall back to My Foods or Custom if USDA is unavailable.

## App icon concepts

The proposed matching icon artwork (Atlas carrying a globe; Hesperides golden apple) was prepared separately for **visual review**. Existing Home Screen icons are not changed in v1.2. On iOS, changing a PWA's icon may require a new Home Screen installation; never delete an existing PWA or clear website data without a verified backup.

## Verification

Run `node hesperides/tests.js` and `node hesperides/meal-picker.test.js`. Also inspect a real iPhone with stored nutrition data before relying on live USDA search and changing PWA icons.
