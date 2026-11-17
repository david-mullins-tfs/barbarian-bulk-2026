// Run: node hesperides/tests.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=__dirname;
const legacy={member:'David',week:8,logs:{'David|8|Monday|Barbell Back Squat':{workingWeight:205}},
  nutrition:{David:{targets:{protein:180,fat:75,carbs:290},days:{
    '2026-10-15':{protein:175,carbs:260,fat:70},'2026-10-16':{protein:180,carbs:265,fat:75}}}}};
const memory=new Map([['barbarian_bulk_pwa_v1',JSON.stringify(legacy)]]);
const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const nodes={};
const make=()=>({innerHTML:'',textContent:'',value:'',dataset:{},classList:{add(){},remove(){},toggle(){}},
  setAttribute(){},removeAttribute(){},addEventListener(){},showModal(){},close(){},focus(){},remove(){}});
const listeners={};
const document={getElementById(id){return nodes[id]||(nodes[id]=make());},querySelectorAll(){return [];},
  addEventListener(k,fn){listeners[k]=fn;},createElement:make,body:{appendChild(){}}};
const errors=[];
const window={addEventListener(){},scrollTo(){}};
const context=vm.createContext({window,document,localStorage,navigator:{},console,
  Blob:function(){},URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},
  alert:x=>errors.push(x),confirm:()=>true,prompt:()=> 'Reusable day',
  setTimeout:()=>0,clearTimeout(){}});
for(const file of ['core.js','state.js','ui.js','food-db.js','app.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const C=window.HesperidesCore,S=window.HesperidesStore,A=window.HesperidesApp;
const click=(action,attributes={})=>{
  const btn={dataset:{action,...attributes}};
  listeners.click({target:{closest(selector){return selector==='[data-action]'?btn:null;}},preventDefault(){}});
};
const fill=values=>Object.entries(values).forEach(([id,v])=>{nodes[id]=Object.assign(make(),{value:String(v)});});
assert.equal(A.view,'today');assert.equal(S.profile().target,null);
assert.ok(nodes.app.innerHTML.includes('Eat Like a God.'));
const DB=window.HesperidesFoodDB;
assert.ok(DB);
const usda=DB.normalize({fdcId:345,description:'CHICKEN BREAST',dataType:'Foundation',foodNutrients:[
  {nutrientId:1003,unitName:'G',value:31},{nutrientId:1004,unitName:'G',value:3.6},{nutrientId:1005,unitName:'G',value:0}
]});
assert.equal(usda.protein,31);assert.equal(usda.carbs,0);assert.equal(usda.serving,'100 g');
assert.equal(DB.normalize({fdcId:345,description:'MISSING',foodNutrients:[{nutrientId:1003,value:31,unitName:'G'}]}),null);
click('view',{view:'goals'});
fill({age:38,weightLb:185,heightFt:5,heightIn:10,sex:'male',activity:'moderate',goal:'fat_loss',goalMeals:5});
click('calculate-goals');
assert.equal(S.profile().mealCount,5);
assert.ok(S.profile().estimate.targetCalories<S.profile().estimate.maintenance);
click('view',{view:'foods'});
fill({foodName:'Test yogurt',foodServing:'170 g cup',foodProtein:17,foodCarbs:6,foodFat:0});
click('save-food');
assert.equal(S.foodList().length,1);
A.usda.results=[usda];
click('use-usda',{index:'0'});
assert.equal(nodes.foodName.value,'CHICKEN BREAST');
assert.equal(nodes.foodServing.value,'100 g');
assert.equal(nodes.foodProtein.value,'31');
click('save-food');
assert.equal(S.foodList().length,2);
assert.equal(S.foodList()[1].source,'USDA FoodData Central');
assert.equal(S.foodList()[1].sourceId,'345');
click('view',{view:'planner'});
assert.ok(nodes.app.innerHTML.includes('Meal 5'));
S.addEntry(A.date,0,S.foodList()[0].id,2,'planned');
assert.equal(S.day(A.date).consumed.length,0);
assert.equal(C.totalsFor(S.day(A.date).planned).calories,184);
click('log-meal',{meal:'0'});
assert.equal(S.day(A.date).consumed.length,1);
click('log-meal',{meal:'0'});
assert.equal(S.day(A.date).consumed.length,1);
assert.equal(C.totalsFor(S.day(A.date).consumed).protein,34);
click('save-template');
S.applyTemplate('2026-12-01',S.templates()[0].id);
assert.equal(S.day('2026-12-01').planned.length,1);
assert.equal(S.day('2026-12-01').consumed.length,0);
assert.equal(C.assessment({protein:140,carbs:0,fat:70},{protein:140,carbs:0,fat:70}).complete,true);
assert.equal(C.assessment({protein:0,carbs:0,fat:0},{protein:140,carbs:180,fat:70}).complete,false);
assert.equal(S.importFromSameOrigin(),2);
assert.equal(S.importFromSameOrigin(),0);
assert.equal(S.legacy('David').days['2026-10-15'].protein,175);
assert.deepEqual(JSON.parse(memory.get('barbarian_bulk_pwa_v1')),legacy);
click('view',{view:'history'});
assert.ok(nodes.app.innerHTML.includes('Archived ATLAS macros'));
S.selectMember('Dan');
assert.equal(S.day(A.date),null);
assert.equal(S.foodList().length,0);
const backup=S.exportJson();S.importBackup(backup);
assert.equal(S.current(),'Dan');S.selectMember('David');
assert.equal(S.day(A.date).consumed.length,1);
assert.equal(errors.length,0);
const atlasIndex=fs.readFileSync(path.resolve(root,'../index.html'),'utf8');
const atlasApp=fs.readFileSync(path.resolve(root,'../app.js'),'utf8');
const atlasSw=fs.readFileSync(path.resolve(root,'../sw.js'),'utf8');
const ourSw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert.equal((atlasIndex.match(/class="nav-btn/g)||[]).length,4);
assert.ok(atlasIndex.includes('data-route="exercises"'));
assert.ok(atlasIndex.includes('route-cardio')&&atlasIndex.includes('route-notes'));
assert.ok(!atlasIndex.includes('data-route="macros" class="nav-btn"'));
assert.ok(atlasApp.includes('function exportMacroArchive()'));
assert.ok(atlasApp.includes('LIFT THE WORLD.'));
assert.ok(atlasApp.includes("const KEY='barbarian_bulk_pwa_v1'"));
assert.ok(atlasSw.includes("key.startsWith('heldkraft-atlas-')"));
assert.ok(ourSw.includes("k.startsWith('heldkraft-hesperides-')"));
assert.ok(ourSw.includes("'./food-db.js'"));
const hespIndex=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(hespIndex.includes('EAT LIKE A GOD.'));
assert.ok(hespIndex.indexOf('food-db.js?v=1.1')<hespIndex.indexOf('app.js?v=1.1'));
console.log('PASS ATLAS v37.1 and Hesperides v1.1: taglines, USDA lookup preparation, calories, meal plans, migration, backups and cache isolation.');
