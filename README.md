# Barbarian Bulk - Phone-First PWA

A simple installable Progressive Web App for the 12-week Barbarian Bulk workout plan.

## Included
- Members: David, Dan, Jason, Vinjo
- 12 weeks
- Monday / Tuesday / Thursday / Friday workouts
- Set-by-set weight and reps logging
- Top weight, total reps, and volume indicators
- Double progression: after every target set reaches the top of its rep range, the next session preloads +5 lb and returns the rep target to the bottom of the range
- Local device storage
- JSON export/import backup
- Offline caching after first load

## Run locally
A service worker needs HTTP/HTTPS, so open through a local web server rather than `file://`.

Example with Python:

    python3 -m http.server 8080

Then visit `http://localhost:8080/barbarian-bulk-pwa/`.

## Install on a phone
Host the folder on any HTTPS static host such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages. Open the URL on the phone and use the browser's **Add to Home Screen / Install App** option.

## Data model
The app is intentionally backend-free for the first version. Each phone keeps its own logs in local storage. Use Export Backup to move or archive data. A shared multi-user backend can be added later if the group needs synchronized results across phones.

## Cardio
Manual cardio logging by member/date with activity, duration, optional distance, intensity, and optional calories. The Cardio tab shows a last-7-days summary and recent history.

## v9 warm-up ramps
Main compounds automatically suggest a 30/50/70/85% warm-up ramp with escalating rests of 1:00, 1:30, 2:00, and 2:30. Secondary compounds use two acclimation sets. Warm-ups are suggestions only and are excluded from progression and weekly volume.
