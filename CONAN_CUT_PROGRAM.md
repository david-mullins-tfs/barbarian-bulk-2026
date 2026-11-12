# ATLAS — Winter Specialization: Conan Cut

**Status:** Upcoming (not active until a member explicitly starts it)
**Duration:** 12 weeks
**Goal:** Fat loss and muscle retention with arms/shoulders specialization
**Split:** Monday to Friday (no Sunday session)

## Program draft
| Day | Focus | Exercises | Working sets |
| --- | --- | ---: | ---: |
| Monday | Upper A — Arms + Shoulders | 6 | 17 |
| Tuesday | Lower A — Quad Focus | 4 | 12 |
| Wednesday | Abs & Calves | 4 | 13 |
| Thursday | Upper B — Arms + Shoulders | 6 | 16 |
| Friday | Lower B — Posterior Focus | 5 | 15 |
| **Total** | | **25 slots** | **73 sets** |

The exercise-by-exercise list is in atlas-programs.js and matches the supplied draft. Machine names were expanded where the screenshot truncated them.

## Progression and nutrition

- Double progression: reach the top of prescribed rep ranges, then add 5 lb. Exercise-specific 5–10 lb increments can be refined later.
- Calorie deficit and protein target must be individualized. No bulking calorie surplus or 350–400 g protein goal is imported.
- Confirm equipment for “Incline Press” and “Seated Shoulder Press” before adding equipment-specific loading guidance. New moves use a neutral ATLAS icon, not an inaccurate technique illustration.

## Migration and safety

The existing localStorage key remains barbarian_bulk_pwa_v1. Old Barbarian Bulk log keys such as David|12|Tuesday|Lateral Raise are left intact. Conan Cut logs are namespaced, e.g. conan-cut|David|1|Monday|Incline Press. Notes, skips, one-day swaps, and exercise-order snapshots are similarly separated.

Each member independently selects their active program and week. Starting Conan Cut begins at Week 1 for that member and records its start date. Switching away archives the prior selection but never deletes records. Macro and cardio records remain date-based. First-week Conan Cut working-weight suggestions use Barbarian Bulk history only for exact exercise-name matches.

## Review

This branch builds on the draft Atlas v33 branch. Merge v33 first, then review Conan Cut. Export backups on each device before deploying. Conan Cut remains Upcoming until explicitly started by an individual member.

Run regression test: node conan-cut.test.js
