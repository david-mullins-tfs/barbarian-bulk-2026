const fs = require('fs');
const assert = require('assert');
const app = fs.readFileSync(__dirname + '/app.js','utf8');
function test(name, fn){try{fn();console.log('PASS',name)}catch(e){console.error('FAIL',name,'-',e.message);process.exitCode=1}}
test('David Sunday specialization is defined',()=>{
  assert.match(app,/const DAVID_SUNDAY=/);
  assert.match(app,/Incline DB Press.*3,8,12/);
  assert.match(app,/DB Fly.*2,12,15/);
  assert.match(app,/Incline DB Curl.*3,8,12/);
  assert.match(app,/Hammer Curl.*2,10,15/);
});
test('David gets Sunday in the member-specific day list',()=>{
  assert.match(app,/function daysFor\(member\)\{return Object\.keys\(programFor\(member\)\);\}/);
  assert.match(app,/days=daysFor\(m\)/);
});
test('David Sunday is included in member-specific volume planning',()=>{
  assert.match(app,/plan=programFor\(m\),planned=Volume\.programmedVolume\(plan/);
});
