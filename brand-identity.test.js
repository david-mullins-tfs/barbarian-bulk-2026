// Verify the Heldkraft identity release without touching app data or network.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const atlas = read('index.html');
const hesp = read('hesperides/index.html');
const cssAtlas = read('styles.css');
const cssHesp = read('hesperides/styles.css');
const am = JSON.parse(read('manifest.json'));
const hm = JSON.parse(read('hesperides/manifest.webmanifest'));
const atlasKeys = ['HELDKRAFT PERFORMANCE RESEARCH','ATLAS','Lift the World.','Strength, Measured.'];
const hespKeys = ['HELDKRAFT PERFORMANCE RESEARCH','HESPERIDES','Eat Like a God.','Nutrition, Measured.'];
for (const text of atlasKeys) assert.ok(atlas.includes(text), 'Atlas brand text: '+text);
for (const text of hespKeys) assert.ok(hesp.includes(text), 'Hesperides brand text: '+text);
assert.ok(atlas.includes('id="hkLaunchSplash"'));
assert.ok(hesp.includes('id="hkLaunchSplash"'));
assert.ok(atlas.includes('./icons/atlas-launch.webp?v=2'));
assert.ok(hesp.includes('./icons/hesperides-launch.webp?v=2'));
assert.ok(!atlas.includes('hk-launch-art" aria-hidden="true"><img src="./icons/icon-'));
assert.ok(!hesp.includes('hk-launch-art" aria-hidden="true"><img src="./icons/icon-'));
assert.equal(am.background_color, '#080E17');
assert.equal(hm.background_color, '#09130F');
assert.equal(am.theme_color, '#080E17');
assert.equal(hm.theme_color, '#09130F');
assert.notEqual(am.theme_color,hm.theme_color);
assert.ok(cssAtlas.includes('--panel:#142234'));
assert.ok(cssHesp.includes('--surface:#14241A'));
assert.ok(cssAtlas.includes('--accent:#D2AD70'));
assert.ok(cssHesp.includes('--gold:#E9C77D'));
const pngDimensions = file => {
  const b = fs.readFileSync(path.join(root, file));
  assert.ok(b.length > 20000, 'PNG unexpectedly small: '+file);
  assert.equal(b.subarray(0, 8).toString('hex'),'89504e470d0a1a0a');
  return [b.readUInt32BE(16),b.readUInt32BE(20)];
};
for (const [dir, manifest] of [['icons',am],['hesperides/icons',hm]]) {
  for(const [name,size] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512],['apple-touch-icon.png',180]]) {
    assert.deepEqual(pngDimensions(dir+'/'+name),[size,size]);
  }
  for (const entry of manifest.icons) {
    assert.ok(entry.src.includes('icons3'), 'Cache-busted manifest icon: '+entry.src);
  }
}
assert.ok(atlas.includes('apple-touch-icon.png?v=icons3'));
assert.ok(hesp.includes('apple-touch-icon.png?v=icons3'));
const asw=read('sw.js'),hsw=read('hesperides/sw.js');
assert.ok(asw.includes('heldkraft-atlas-v37-6-midnight-identity'));
assert.ok(hsw.includes('heldkraft-hesperides-v1-7-garden-identity'));
assert.ok(asw.includes('./icons/atlas-launch.webp'));
assert.ok(hsw.includes('./icons/hesperides-launch.webp'));
const builder=read('scripts/build_heldkraft_icons.py');
assert.ok(builder.includes('atlas-launch.webp')&&builder.includes('hesperides-launch.webp'));
assert.ok(!builder.includes('Lift the World.')&&!builder.includes('Eat Like a God.'));
assert.ok(fs.existsSync(path.join(root, 'preview/heldkraft-identity-review.png')));
assert.deepEqual(pngDimensions('preview/heldkraft-identity-review.png'),[1600,1030]);
console.log('PASS: both brand identities, 8 PNG icons, splash art, manifest and cache coherence.');
