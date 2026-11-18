'use strict';
// Both in-app headers reuse transparent splash artwork; original PWA icons remain untouched.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const atlas=read('index.html'),hesperides=read('hesperides/index.html');
const atlasCss=read('styles.css'),hespCss=read('hesperides/styles.css');
const atlasSW=read('sw.js'),hespSW=read('hesperides/sw.js');
const ah=atlas.match(/<header class="app-header">([\s\S]*?)<\/header>/)?.[1];
const hh=hesperides.match(/<header class="app-header">([\s\S]*?)<\/header>/)?.[1];
assert.ok(ah&&hh,'Both application headers exist');
assert.ok(ah.includes('class="atlas-header-emblem" src="./icons/atlas-launch-cutout.png?v=alpha1"'),'Atlas sculpture is the actual alpha artwork');
assert.ok(hh.includes('class="hesperides-header-emblem" src="./icons/hesperides-launch-cutout.png?v=alpha1"'),'Hesperides apple is the actual alpha artwork');
for(const [name,header] of [['Atlas',ah],['Hesperides',hh]]){
  assert.ok(header.includes('width="44" height="52" alt="" aria-hidden="true"'),name+' image dimensions and decorative semantics');
  assert.ok(!header.includes('icon-192.png'),name+' no square PWA artwork in header');
  assert.ok(header.includes('HELDKRAFT PERFORMANCE RESEARCH'),name+' studio name retained');
  assert.ok(header.includes('id="menuBtn"'),name+' menu retained');
}
assert.ok(ah.includes('ATLAS <span class="header-program">/ Barbarian Bulk</span>'),'Atlas name and program retained');
assert.ok(hh.includes('<strong>HESPERIDES</strong><em>EAT LIKE A GOD.</em>'),'Hesperides name and tagline retained');
assert.ok(atlasCss.includes('.atlas-header-emblem{display:block;width:44px;height:52px')&&atlasCss.includes('background:transparent;border:0;border-radius:0'),'Atlas transparent header CSS');
assert.ok(hespCss.includes('.brand .hesperides-header-emblem{display:block;width:44px;height:52px')&&hespCss.includes('background:transparent;border:0;border-radius:0'),'Hesperides transparent header CSS');
assert.ok(atlasCss.includes('@media(max-width:390px)')&&hespCss.includes('@media(max-width:390px)'),'Responsive narrow iPhone support');
assert.ok(atlas.includes('href="styles.css?v=identity5"')&&hesperides.includes('href="./styles.css?v=identity4"'),'CSS revision URLs');
assert.ok(atlasSW.includes('heldkraft-atlas-v37-10-transparent-header')&&hespSW.includes('heldkraft-hesperides-v1-10-transparent-header'),'Separate cache namespaces updated');
assert.ok(atlasSW.includes('./icons/atlas-launch-cutout.png')&&hespSW.includes('./icons/hesperides-launch-cutout.png'),'Cutout assets precached');
assert.ok(atlas.includes('apple-touch-icon.png?v=icons3')&&hesperides.includes('apple-touch-icon.png?v=icons3'),'Installed icons unchanged');
assert.equal((atlas.match(/class="nav-btn/g)||[]).length,4,'Atlas navigation unchanged');
console.log('PASS: transparent Atlas and Hesperides in-app emblems, mobile layout, caches, unchanged installed icons');
