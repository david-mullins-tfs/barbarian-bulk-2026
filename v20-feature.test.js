const fs=require('fs');
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
function ok(x,m){if(!x)throw new Error(m)}
ok(app.includes("noteButton('workout'"),'workout notes missing');
ok(app.includes("noteButton('exercise'"),'exercise notes missing');
ok(app.includes("noteButton('set'"),'set notes missing');
ok(app.includes('function openNoteDialog'),'note editor missing');
ok(app.includes('state.notes=state.notes||{}'),'note state migration missing');
ok(html.includes('id="noteDialog"'),'note dialog missing');
ok(sw.includes('barbarian-bulk-v20'),'v20 cache missing');
ok(app.includes('placeholder="${ex[2]}-${ex[3]}"'),'rep placeholder regression');
ok(app.includes("['Pec Deck',3,10,15]"),'Pec Deck program regression');
console.log('v20 feature tests pass');
