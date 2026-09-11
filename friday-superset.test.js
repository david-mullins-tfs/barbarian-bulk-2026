const fs=require('fs');
const app=fs.readFileSync('app.js','utf8');
function assert(c,m){if(!c)throw new Error(m)}
assert(app.includes("['EZ Curl',4,10,12]"),'EZ Curl must be independently logged');
assert(app.includes("['Triceps Pushdown',4,10,12]"),'Triceps Pushdown must be independently logged');
assert(!app.includes("['EZ Curl + Tri Push',4,10,12]"),'combined exercise must be removed');
assert(!app.includes("['W-Bar Superset',0,null,null]"),'W-Bar note must be removed');
assert(app.includes("'EZ Curl':{Biceps:1}"),'EZ Curl volume mapping missing');
assert(app.includes("'Triceps Pushdown':{Triceps:1}"),'pushdown volume mapping missing');
assert(app.includes('SUPERSET A'),'superset indicator missing');
console.log('Friday superset tests passed');
