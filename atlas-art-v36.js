/* ATLAS v36 — image references; no workout or exercise IDs are changed.
   CC0-1.0 source: https://github.com/MarvinNazari/exercise-images
   Source revision: 2786aefa4b36a08faeca8114e0d1eb0af3ef6732
   Images are illustrative references; check machine setup and lifting technique independently. */
(function(root){
  'use strict';
  const SOURCE='https://raw.githubusercontent.com/MarvinNazari/exercise-images/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/';
  const MAP={
  "Front Squat": "front-squat",
  "Smith Machine Squat": "smith-machine-squat",
  "Plate-Loaded Hack Squat": "hack-squat",
  "Plate-Loaded Seated Calf Raise": "seated-calf-raise-machine",
  "Lunges": "dumbbell-lunge",
  "Leg Press": "leg-press",
  "Leg Curls": "leg-curl",
  "Barbell Deadlift": "deadlift",
  "Smith Machine Deadlift": "smith-machine-romanian-deadlift",
  "RDL": "romanian-deadlift",
  "Yes Machine": "hip-abduction-machine",
  "No Machine": "hip-adduction-machine",
  "Smith Machine Bench Press": "smith-machine-bench-press",
  "Incline Bench": "incline-bench-press",
  "DB Bench": "dumbbell-chest-press",
  "DB Fly": "dumbbell-fly",
  "Cable Fly": "cable-crossover",
  "Machine Chest Press": "chest-press-machine",
  "Plate-Loaded Chest Press": "plate-loaded-incline-chest-press",
  "Close-Grip Bench": "close-grip-bench-press",
  "Incline DB Press": "incline-dumbbell-press",
  "Overhead Press": "overhead-press",
  "Seated DB Press": "dumbbell-shoulder-press",
  "Lateral Raise": "lateral-raises",
  "Rear Delt Fly": "rear-delt-fly",
  "Pullups": "pull-up",
  "Assisted Chin-Ups": "assisted-pull-up",
  "Lat Pulldown": "lat-pulldown",
  "Landmine Row": "t-bar-row",
  "Chest-Supported Row": "chest-supported-t-bar-row",
  "Cable Row": "seated-cable-row",
  "EZ Curl": "ez-bar-curl",
  "Incline DB Curl": "incline-dumbbell-curl",
  "Hammer Curl": "hammer-curls",
  "Cable Bent-over Triceps Extension": "cable-overhead-triceps-extension",
  "Triceps Pushdown": "tricep-pushdowns",
  "Incline Press": "incline-bench-press",
  "Seated Shoulder Press": "shoulder-press-machine",
  "Barbell Curl": "barbell-curl",
  "Overhead Cable Triceps Extension": "cable-overhead-triceps-extension",
  "Face Pulls": "face-pulls",
  "Leg Extensions": "leg-extension",
  "Seated Leg Curl": "seated-leg-curl",
  "Walking Lunges": "dumbbell-lunge",
  "Hanging Knee Raises": "hanging-knee-raise",
  "Machine Crunches": "machine-abdominal-crunch",
  "Standing Calf Raise Smith Machine": "smith-machine-calf-raise",
  "Preacher Curl Machine": "machine-preacher-curl",
  "Dip Machine": "seated-dip-machine",
  "Hammer Curls Dumbbell": "hammer-curls",
  "Rear Delt Fly on Bench": "rear-delt-fly",
  "Romanian Deadlift": "romanian-deadlift",
  "Leg Press (Feet Higher)": "leg-press",
  "Leg Extensions (Lighter)": "leg-extension",
  "Standing Calf Press Smith Machine": "smith-machine-calf-raise"
};
  const REVIEW={
  "Smith Machine Deadlift": "Reference shows a Smith Machine Romanian Deadlift; review stance and knee bend.",
  "Lunges": "Reference depicts dumbbell lunges; actual workout equipment can vary.",
  "Leg Curls": "Reference depicts a machine leg curl; confirm the intended machine configuration.",
  "Plate-Loaded Chest Press": "Reference depicts a plate-loaded incline press rather than a flat chest press.",
  "Assisted Chin-Ups": "Reference uses an assisted pull-up; verify supinated chin-up grip for your machine.",
  "Cable Bent-over Triceps Extension": "Reference uses an overhead cable extension; bent-over setup may differ.",
  "Incline Press": "Reference depicts a barbell incline bench press; confirm equipment used in Conan Cut.",
  "Seated Shoulder Press": "Reference depicts a seated shoulder-press machine; confirm dumbbell versus machine.",
  "Walking Lunges": "Reference shows a dumbbell lunge; use alternating steps for walking lunges.",
  "Rear Delt Fly on Bench": "Reference shows a rear-delt fly; the bench-supported position may differ.",
  "Leg Press (Feet Higher)": "Reference is a standard leg press; place feet higher only as prescribed.",
  "Leg Extensions (Lighter)": "Shares the leg extension illustration; 'lighter' is a loading instruction."
};
  function entry(name){const id=MAP[name];return id?{id,review:REVIEW[name]||'',start:SOURCE+'images/'+id+'/start.webp',end:SOURCE+'images/'+id+'/end.webp'}:null;}
  function startUrl(name){return entry(name)?.start||null;}
  function endUrl(name){return entry(name)?.end||null;}
  function isMapped(name){return !!MAP[name];}
  root.AtlasArtwork=Object.freeze({SOURCE,MAP,REVIEW,entry,startUrl,endUrl,isMapped,count:Object.keys(MAP).length,version:'36'});
})(typeof window!=='undefined'?window:globalThis);
