const assert=require('assert');
const P=require('./plate-counter.js');
assert.deepStrictEqual(P.platesPerSide(135,45),[45]);
assert.deepStrictEqual(P.platesPerSide(185,45),[45,25]);
assert.deepStrictEqual(P.platesPerSide(257,167),[45]);
assert.deepStrictEqual(P.platesPerSide(105,35),[25,10]);
assert.strictEqual(P.platesPerSide(136,45),null);
assert.strictEqual(P.closestLoad(136,45).total,135);
console.log('plate tests pass');
