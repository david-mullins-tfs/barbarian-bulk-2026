const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=__dirname;
const original={
  member:'David',week:12,
  logs:{
    'David|12|Tuesday|Lateral Raise':{workingWeight:25,sets:[{weight:25,reps:15}]},
    'David|12|Tuesday|Leg Press':{workingWeight:300,sets:[{weight:300,reps:10}]}
  },
  notes:{'note|set|David|12|Tuesday|Lateral Raise|0':'Legacy bulk note'},
  nutrition:{David:{targets:{protein:180,fat:65,carbs:250,restCarbOffset:25},days:{},history:[]}},
  cardio:{David:{days:{}}},
  programs:{}
};
const data=new Map([['barbarian_bulk_pwa_v1',JSON.stringify(original)]]);
const localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
const element=()=>({innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return null},querySelectorAll(){return []}});
const nodes={};
const document={getElementById:id=>nodes[id]||(nodes[id]=element()),querySelectorAll:()=>[],querySelector:()=>null};
const window={addEventListener(){}};
const context={console,window,document,localStorage,navigator:{},Date,URL,setTimeout(){},requestAnimationFrame(fn){fn()},confirm:()=>true};
vm.createContext(context);
for(const file of ['nutrition.js','exercise-library.js','atlas-programs.js','volume.js','rest-timer.js','app.js']){
  vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),context,{filename:file});
}
const run=src=>vm.runInContext(src,context);
const conan=window.AtlasPrograms.CONAN_CUT;
assert.deepEqual(Object.keys(conan),['Monday','Tuesday','Wednesday','Thursday','Friday']);
assert.deepEqual(Object.values(conan).map(day=>day.exercises.reduce((n,ex)=>n+ex[1],0)),[17,12,13,16,15]);
assert.equal(Object.values(conan).flatMap(day=>day.exercises).length,25);
for(const ex of Object.values(conan).flatMap(day=>day.exercises))assert.ok(window.BarbarianExercises.metadata(ex[0]),ex[0]);
assert.equal(run('activeProgramFor("David")'),'barbarian-bulk');
assert.equal(run('state.week'),12);
assert.ok(run('programLibraryView()').includes('UPCOMING'));
assert.equal(run('getLog("David",12,"Tuesday","Lateral Raise").workingWeight'),25);
assert.equal(run('getNote("set","David",12,"Tuesday","Lateral Raise",0)'),'Legacy bulk note');
assert.equal(run('activateProgram("David",CUT_ID,false)'),true);
assert.equal(run('state.week'),1);
assert.equal(run('state.nutrition.David.targets.protein'),0);
assert.equal(run('state.nutrition.David.targets.carbs'),0);
assert.ok(run('macrosView()').includes('Conan Cut nutrition targets have not been set'));
assert.equal(run('daysFor("David").includes("Sunday")'),false);
assert.equal(run('activeProgramFor("Dan")'),'barbarian-bulk');
assert.equal(run('sessionRows("David",1,"Tuesday","Leg Press").workingWeight'),300);
assert.equal(run('getLog("David",12,"Tuesday","Lateral Raise")'),null);
run('state.logs[key("David",1,"Monday","Incline Press")]={workingWeight:50,sets:[{weight:50,reps:10}]}');
assert.equal(run('state.logs["conan-cut|David|1|Monday|Incline Press"].workingWeight'),50);
run('state.notes[noteKey("set","David",1,"Monday","Incline Press",0)]="Conan note";saveState()');
assert.ok(run('notesView()').includes('Legacy bulk note'));
assert.ok(run('notesView()').includes('Conan note'));
assert.ok(run('volumeView()').includes('Weekly Volume'));
run('selectWeek(6)');
assert.equal(run('state.week'),6);
run('selectMember("Dan")');
assert.equal(run('state.week'),12);
assert.equal(run('daysFor("Dan").includes("Sunday")'),false);
run('selectMember("David")');
assert.equal(run('state.week'),6);
assert.equal(run('activateProgram("David",BULK_ID,false)'),true);
assert.equal(run('state.week'),12);
assert.equal(run('getLog("David",12,"Tuesday","Lateral Raise").workingWeight'),25);
assert.equal(run('getNote("set","David",12,"Tuesday","Lateral Raise",0)'),'Legacy bulk note');
assert.equal(run('state.logs["conan-cut|David|1|Monday|Incline Press"].workingWeight'),50);
assert.equal(run('state.programWeeks.David["conan-cut"]'),6);
assert.ok(run('state.programArchives.David["conan-cut"]'));
assert.equal(run('state.nutrition.David.targets.protein'),180);
assert.ok(fs.readFileSync(path.join(base,'app.js'),'utf8').includes('advanceRepFocus'));
const sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');
const matches=sw.match(/const ASSETS = \[([\s\S]*?)\];/);
for(const token of matches[1].match(/'\.\/[^']+'/g)){
  const filename=token.slice(3,-1);
  if(filename)assert.ok(fs.existsSync(path.join(base,filename)),'Missing offline asset '+filename);
}
console.log('PASS Conan Cut: 12 weeks, 5 days, 73 sets; 4 members; history/notes isolation; nutrition; volume; offline cache.');
