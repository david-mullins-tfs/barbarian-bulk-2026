const fs=require('fs');
const app=fs.readFileSync(__dirname+'/app.js','utf8');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const sw=fs.readFileSync(__dirname+'/sw.js','utf8');
function assert(x,m){if(!x)throw new Error(m)}
assert(html.includes('data-route="notes"'),'Notes nav missing');
assert(app.includes('function notesView()'),'notesView missing');
assert(app.includes('id="noteSearch"'),'note search missing');
assert(app.includes('id="noteMember"'),'member filter missing');
assert(app.includes('id="noteWeek"'),'week filter missing');
assert(app.includes('id="noteScope"'),'scope filter missing');
assert(app.includes('id="noteDay"'),'day filter missing');
assert(app.includes('id="noteExercise"'),'exercise filter missing');
assert(app.includes('data-open-note-result'),'note result navigation missing');
assert(sw.includes('barbarian-bulk-v21'),'service worker not bumped');
console.log('v21 note search/filter tests passed');
