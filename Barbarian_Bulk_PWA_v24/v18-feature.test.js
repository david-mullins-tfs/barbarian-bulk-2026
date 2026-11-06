const fs=require('fs');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
function ok(x,m){if(!x)throw new Error(m)}
ok(app.includes('placeholder="${ex[2]}-${ex[3]}"'),'rep range placeholder missing');
ok(app.includes('function platesView()'),'plate tab missing');
ok(app.includes('data-plate-ex'),'workout plate shortcut missing');
ok(app.includes('const presets=[20,35,45,167]'),'bar presets wrong');
ok(app.includes('savePlateBar(exercise,start)'),'per-exercise bar memory missing');
ok(html.includes('data-route="plates"'),'plate nav missing');
ok(html.includes('plate-counter.js'),'plate script missing');
ok(sw.includes('barbarian-bulk-v18')&&sw.includes('plate-counter.js'),'service worker missing v18 assets');
console.log('v18 feature tests pass');
