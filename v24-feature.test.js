const fs=require('fs'), assert=require('assert');
const js=fs.readFileSync(__dirname+'/app.js','utf8'),css=fs.readFileSync(__dirname+'/styles.css','utf8');
assert(js.includes('warmup-disclosure'));assert(js.includes("const wasOpen=!!slot.querySelector('details')?.open"));
assert(js.includes('data-move="up"'));assert(js.includes('data-move="down"'));assert(js.includes("list.insertBefore(row,rows[i-1])"));assert(js.includes("list.insertBefore(rows[i+1],row)"));
assert(js.includes('exercise-${status}'));assert(css.includes('.exercise.exercise-complete'));
assert(fs.readFileSync(__dirname+'/sw.js','utf8').includes('barbarian-bulk-v24'));
console.log('PASS v24 UI and reorder feature checks');
