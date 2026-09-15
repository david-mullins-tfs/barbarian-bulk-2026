const fs = require('fs');
const assert = require('assert');
const app = fs.readFileSync(__dirname + '/app.js','utf8');
function test(name, fn){try{fn();console.log('PASS',name)}catch(e){console.error('FAIL',name,'-',e.message);process.exitCode=1}}

test('Macros has a selectable historical date',()=>{
  assert.match(app,/id="macroDate" class="input" type="date"/);
  assert.match(app,/max="\$\{todayKey\(\)\}"/);
});

test('Saving macros uses the selected date instead of always today',()=>{
  assert.match(app,/date=document\.getElementById\('macroDate'\)\?\.value\|\|todayKey\(\)/);
  assert.match(app,/n\.days\[date\]=/);
});

test('Past macro entries retain a target snapshot',()=>{
  assert.match(app,/targetSnapshot/);
  assert.match(app,/snapshot=d\.targetSnapshot\|\|base/);
});

test('Recent macro days can be selected for editing',()=>{
  assert.match(app,/data-macro-date/);
  assert.match(app,/document\.querySelectorAll\('\[data-macro-date\]'\)/);
});
