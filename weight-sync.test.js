const assert = require('assert');
const { propagateWeightChange, normalizeSetWeights } = require('./weight-sync');

function test(description, fn) {
  try { fn(); console.log(`PASS: ${description}`); }
  catch (e) { console.error(`FAIL: ${description}`); throw e; }
}

test('changing set 1 propagates weight through all following sets', () => {
  const sets = [
    {weight:'185', reps:'8'},
    {weight:'185', reps:'8'},
    {weight:'185', reps:'7'},
    {weight:'185', reps:'6'}
  ];
  assert.deepStrictEqual(propagateWeightChange(sets, 0, '180').map(s => s.weight), ['180','180','180','180']);
});

test('changing a later set overrides that set and every set after it', () => {
  const sets = [
    {weight:'185', reps:'8'},
    {weight:'185', reps:'8'},
    {weight:'185', reps:'7'},
    {weight:'185', reps:'6'}
  ];
  assert.deepStrictEqual(propagateWeightChange(sets, 2, '180').map(s => s.weight), ['185','185','180','180']);
});

test('propagation does not alter reps or earlier weights', () => {
  const sets = [
    {weight:'185', reps:'8'},
    {weight:'185', reps:'7'},
    {weight:'185', reps:'6'}
  ];
  const result = propagateWeightChange(sets, 1, '175');
  assert.deepStrictEqual(result, [
    {weight:'185', reps:'8'},
    {weight:'175', reps:'7'},
    {weight:'175', reps:'6'}
  ]);
});

test('blank weight clears the changed set and following sets', () => {
  const sets = [
    {weight:'185', reps:'8'},
    {weight:'185', reps:'7'},
    {weight:'185', reps:'6'}
  ];
  assert.deepStrictEqual(propagateWeightChange(sets, 1, '').map(s => s.weight), ['185','','']);
});

test('existing logs with a first-set weight fill blank later set weights', () => {
  const sets = [
    {weight:'185', reps:'8'},
    {weight:'', reps:'7'},
    {weight:'', reps:'6'}
  ];
  assert.deepStrictEqual(normalizeSetWeights(sets).map(s => s.weight), ['185','185','185']);
});

test('existing logs preserve intentionally different later weights', () => {
  const sets = [
    {weight:'185', reps:'8'},
    {weight:'180', reps:'7'},
    {weight:'180', reps:'6'}
  ];
  assert.deepStrictEqual(normalizeSetWeights(sets).map(s => s.weight), ['185','180','180']);
});
