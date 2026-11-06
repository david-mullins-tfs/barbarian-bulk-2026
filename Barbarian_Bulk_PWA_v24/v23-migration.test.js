const fs=require('fs'),assert=require('assert'); const a=fs.readFileSync('app.js','utf8');
assert(a.includes("'Squat':'Smith Machine Squat'"));
assert(a.includes("'Bench':'Smith Machine Bench Press'"));
assert(a.includes("'Deadlift':'Smith Machine Deadlift'"));
assert(a.includes("parts[3]=historySwaps[old]"));
assert(a.includes("parts[5]=historySwaps[parts[5]]"));
assert(a.includes("activePreset?Number(activePreset.dataset.barPreset)"));
console.log('v23 migration tests passed');
