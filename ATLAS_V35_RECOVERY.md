# Atlas v35 — Recovery-Based Volume Autoregulation

## Workflow

When a member starts a workout without previously logged reps, Atlas displays a muscle-group recovery check-in before exposing working-set inputs. Ratings are **Very Sore, Somewhat Sore, Just Right, Recovered for a While**. The check-in covers significant primary and secondary groups (front/side/rear delts are grouped as Shoulders). A member can choose **Use original sets instead**.

After all responses are provided, Atlas presents a review screen with proposed set counts by exercise. Counts can be overridden before the member applies them; the 12-week program template is never modified by recovery choices.

## Conservative suggested rules

- **Very Sore:** Aim to reduce roughly 30% of primary-target working sets, cutting accessory/isolation work first. Never remove the only working set, and never automatically cut a compound.
- **Somewhat Sore:** Reduce one eligible accessory set, if available.
- **Just Right:** Keep programmed volume unchanged.
- **Recovered for a While:** Suggest up to one added accessory set if prior performance supports it, and no extra set has already been added for the same primary muscle group that week.
- **Conan Cut:** Require two successful prior same-day exercise logs before suggesting an extra set. Bulk requires one. No automatic additions without the logged performance history.
- **Overrides:** A member may manually adjust compound sets, but total extra sets are capped at one per primary muscle group each week, and an individual exercise can receive at most one extra set.

No automatic adjustment treats sharp pain, swelling, unusual weakness or suspected injury as ordinary soreness; users are advised to postpone the movement and seek appropriate assessment.

## Data protection

- Existing storage key **barbarian_bulk_pwa_v1** is unchanged.
- Recovery records use keys containing program ID, member, week and day: recovery|conan-cut|David|3|Monday.
- Previous saved workouts with actual logged reps are not interrupted by a new check-in. Existing log sets are never truncated by a recovery adjustment.
- The original program plan is preserved; only effective working-set counts for that session change.
- Double progression is blocked after reduced-volume sessions, even when all reduced sets reach the top of their ranges.
- Export and import backup include recovery state automatically.
- The Volume screen shows original planned, recovery-adjusted, and completed weighted sets, plus a weekly recovery-feedback summary.

## Validation

Run `node recovery-v35.test.js` from the repo root for core proposal tests.

Runtime simulation checks against the full app source passed for:
- Existing Bulk histories, notes, and session-specific reduction.
- Conservative lower-body compounds and chest isolation set reductions.
- No improper automatic load increase after reduced sets.
- Two-week performance gate for Conan Cut, and one-extra-set-per-muscle/week cap.
- Member, week, and program isolation; archived records retained.

## Deployment and smoke test

1. Export a JSON backup before an app upgrade if possible. Do not delete the installed PWA or clear Safari site data.
2. Open the Workout tab and start an **unlogged** day; select a response for each muscle group and review the suggested sets.
3. Choose **Apply these sets** and verify exercise set inputs reflect the review screen. Repeat once with **Use original sets instead**.
4. Check Volume for planned/adjusted/completed columns and recovery feedback.
5. Open an already logged workout: it should open normally with no forced check-in.
6. Switch a second member and alternate program: their recovery records should be independent.

The new service worker cache name is **heldkraft-atlas-v35-recovery-checkin**, and versioned page assets use **?v=35**. The offline fallback maps versioned script/style URLs to their pre-cached unversioned equivalents.
