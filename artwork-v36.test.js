// ATLAS v36 artwork regression: node artwork-v36.test.js
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sandbox={window:{}};
vm.runInNewContext(read('atlas-art-v36.js'),sandbox,{filename:'atlas-art-v36.js'});
const art=sandbox.window.AtlasArtwork;
const app=read('app.js'),lib=read('exercise-library.js'),index=read('index.html'),sw=read('sw.js');
const names=[...lib.matchAll(/^\s*'([^']+)': \{category:/gm)].map(m=>m[1]);
const pilots=new Set(['Pec Deck','Barbell Bench Press','Barbell Back Squat']);
assert.equal(names.length,58);
assert.equal(art.count,55);
assert.equal([...new Set(Object.values(art.MAP))].length,46);
assert.equal(names.filter(x=>pilots.has(x)).length,3);
assert.ok(names.every(name=>pilots.has(name)||art.isMapped(name)));
for(const name of names.filter(n=>!pilots.has(n))){
  const item=art.entry(name);
  assert.ok(item);
  assert.ok(item.start.startsWith('https://raw.githubusercontent.com/MarvinNazari/exercise-images/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/images/'));
  assert.ok(item.start.endsWith('/start.webp'));
  assert.ok(item.end.endsWith('/end.webp'));
}
assert.equal(art.REVIEW['Smith Machine Deadlift'].includes('Romanian'),true);
assert.ok(app.includes('function artworkGalleryView()'));
assert.ok(app.includes('START POSITION'));
assert.ok(app.includes('FINISH POSITION'));
assert.ok(app.includes('function bindArtFallback('));
assert.ok(app.includes("const KEY='barbarian_bulk_pwa_v1'"));
assert.ok(index.includes('data-action="route-artwork"'));
assert.ok(index.indexOf('atlas-art-v36.js?v=36')<index.indexOf('app.js?v=36'));
assert.ok(index.includes('styles.css?v=36'));
assert.ok(sw.includes('heldkraft-atlas-v36-art-gallery'));
assert.ok(sw.includes("'./atlas-art-v36.js'"));
assert.ok(sw.includes('sameOrigin || approvedIllustration'));
new Function(app);
new Function(sw);
console.log('PASS ATLAS v36: 58 of 58 mapped; three original pilots intact; versioned app, offline caching, and unchanged data key.');
