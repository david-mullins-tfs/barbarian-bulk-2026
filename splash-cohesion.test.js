'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const A=fs.readFileSync('index.html','utf8'),H=fs.readFileSync('hesperides/index.html','utf8');
for(const [name,html,bg,mid,caption,art,cache] of [
  ["Atlas",A,"#080E17","#101C2A","Strength, Measured.","atlas-launch.webp","heldkraft-atlas-v37-7-seamless-splash"],
  ["Hesperides",H,"#09130F","#102218","Nutrition, Measured.","hesperides-launch.webp","heldkraft-hesperides-v1-8-seamless-splash"]
]){
  assert.ok(html.includes("id=\"hkLaunchSplash\""),name+" splash exists");
  assert.ok(html.includes("Cohesive launch refinement"),name+" themed gradient override");
  assert.ok(html.includes(mid),name+" atmospheric color");
  assert.ok(html.includes(bg),name+" app-matched base");
  assert.ok(html.includes("mix-blend-mode:lighten"),name+" image black backdrop lifted without bleaching gold");
  assert.ok(html.includes(art),name+" approved art retained");
  assert.ok(html.includes(caption),name+" subtitle retained");
  assert.ok(html.includes("HELDKRAFT PERFORMANCE RESEARCH"),name+" studio retained");
  const sw=fs.readFileSync(name==="Atlas"?"sw.js":"hesperides/sw.js","utf8");
  assert.ok(sw.includes(cache),name+" cache bump");
}
const png=fs.readFileSync('preview/heldkraft-seamless-splash.png');
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assert.equal(png.readUInt32BE(16),1740);
assert.equal(png.readUInt32BE(20),1170);
console.log("PASS: splash backgrounds match app palettes, approved art, cache updates, QA preview");
