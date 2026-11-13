// Run from repository root: node recovery-v35.test.js
const assert=require('node:assert/strict');
const Recovery=require('./atlas-recovery.js');
const metadata={
  'Bench':{primary:'Chest',secondary:['Triceps','Front Delts'],type:'compound'},
  'Pec Deck':{primary:'Chest',secondary:['Front Delts'],type:'isolation'},
  'Cable Fly':{primary:'Chest',secondary:[],type:'isolation'},
  'Barbell Curl':{primary:'Biceps',secondary:[],type:'isolation'},
  'Leg Press':{primary:'Quads',secondary:['Glutes'],type:'compound'}
};
const meta=name=>metadata[name];
const plan=[['Bench',4,6,8],['Pec Deck',3,10,15],['Cable Fly',2,12,15],['Barbell Curl',3,8,12],['Leg Press',3,10,12]];
assert.deepEqual(Recovery.groupList(plan,meta),['Chest','Triceps','Shoulders','Biceps','Quads','Glutes']);
assert.equal(Recovery.muscleGroup('Rear Delts'),'Shoulders');
assert.equal(Recovery.muscleGroup('Core'),'Abs');
assert.equal(Recovery.RATINGS.very,'Very Sore');
assert.equal(Recovery.RATINGS.some,'Somewhat Sore');
assert.equal(Recovery.RATINGS.right,'Just Right');
assert.equal(Recovery.RATINGS.long,'Recovered for a While');
const propose=(responses,good=()=>true,room=()=>true)=>Recovery.proposal(plan,responses,meta,good,room);
assert.deepEqual(propose({Chest:'right'}).counts,[4,3,2,3,3]);
assert.deepEqual(propose({Chest:'some'}).counts,[4,3,1,3,3]);
assert.deepEqual(propose({Chest:'very'}).counts,[4,1,1,3,3]);
assert.deepEqual(propose({Chest:'long'}).counts,[4,3,3,3,3]);
assert.deepEqual(propose({Chest:'long'},()=>false).counts,[4,3,2,3,3]);
assert.deepEqual(propose({Chest:'long'},()=>true,()=>false).counts,[4,3,2,3,3]);
assert.deepEqual(propose({Biceps:'very'}).counts,[4,3,2,2,3]);
assert.deepEqual(propose({Quads:'very'}).counts,[4,3,2,3,3]); // no automatic compound removal
assert.match(propose({Quads:'very'}).messages.Quads,/No accessory sets/);
console.log('PASS v35 recovery module: muscle groups, four ratings, conservative set changes, performance gates and no automatic compound cuts.');
