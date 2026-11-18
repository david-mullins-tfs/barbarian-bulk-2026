// Run from repository root: node hesperides/meal-picker.test.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const nodes={},listeners={},errors=[],urls=[];
const element=()=>({innerHTML:'',value:'',textContent:'',dataset:{},open:false,classList:{add(){},remove(){},toggle(){}},
  addEventListener(){},setAttribute(){},removeAttribute(){},showModal(){this.open=true},close(){this.open=false},
  focus(){},remove(){}});
const document={getElementById(id){return nodes[id]||(nodes[id]=element())},querySelectorAll(){return []},
  addEventListener(name,fn){listeners[name]=fn},createElement:element,body:{appendChild(){}}};
const egg={fdcId:991,description:'SCRAMBLED EGGS',dataType:'Survey (FNDDS)',
  foodNutrients:[{nutrientId:1003,unitName:'G',value:13},{nutrientId:1004,unitName:'G',value:11},{nutrientId:1005,unitName:'G',value:1.1}],
  foodPortions:[{id:3,amount:1,gramWeight:61,portionDescription:'1 large egg'},
    {id:4,amount:1,gramWeight:220,portionDescription:'1 cup'}]};
const fakeFetch=async url=>{
  urls.push(url);
  return {ok:true,status:200,json:async()=>url.includes('/food/991?')?egg:{foods:[egg],totalHits:1}};
};
const window={addEventListener(){},scrollTo(){}};
const context=vm.createContext({window,document,localStorage,fetch:fakeFetch,navigator:{},console,
  setTimeout:()=>0,clearTimeout(){},confirm:()=>true,prompt:()=>null,alert:x=>errors.push(x),
  Blob:function(){},URL:{createObjectURL:()=> 'blob:mock',revokeObjectURL(){}}});
for(const file of ['core.js','portions.js','state.js','ui.js','picker-ui.js','food-db.js','app.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context,{filename:file});
const S=window.HesperidesStore,A=window.HesperidesApp,P=window.HesperidesPortions;
const click=(action,params={})=>{
  const button={dataset:{action,...params}};
  listeners.click({target:{closest:selector=>selector==='[data-action]'?button:null},preventDefault(){}});
};
const fields=x=>Object.entries(x).forEach(([key,val])=>{nodes[key]=Object.assign(element(),{value:String(val)});});
async function main(){
  click('view',{view:'planner'});
  click('add-food',{type:'planned',meal:'0'});
  assert.ok(nodes.modal.open);
  assert.ok(nodes.modal.innerHTML.includes('Search & add food'));
  assert.ok(nodes.modal.innerHTML.includes('data-tab-id="usda"'));
  fields({pickerQuery:'scrambled eggs'});
  // Wait for the actual search to settle; arbitrary microtask counts can race.
  await nodes.pickerUsdaForm.onsubmit({preventDefault(){}});
  assert.ok(nodes.pickerResults.innerHTML.includes('SCRAMBLED EGGS'));
  click('picker-select',{source:'usda',resultIndex:'0'});
  for(let i=0;i<10;i++)await Promise.resolve();
  assert.ok(nodes.modal.innerHTML.includes('1 large egg (61 g)'));
  assert.ok(nodes.modal.innerHTML.includes('1 cup (220 g)'));
  fields({pickerUnit:'measure:usda3',pickerQuantity:4});
  click('picker-add',{kind:'planned'});
  assert.equal(S.foodList().length,1);
  assert.equal(S.day(A.date).consumed.length,0);
  assert.equal(S.day(A.date).planned[0].portionGrams,244);
  assert.equal(S.day(A.date).planned[0].servings,2.44);
  assert.equal(S.recentFoods()[0].id,S.foodList()[0].id);
  click('add-food',{type:'consumed',meal:'0'});
  assert.ok(nodes.pickerResults.innerHTML.includes('SCRAMBLED EGGS'));
  click('picker-select',{source:'local',foodId:S.foodList()[0].id});
  fields({pickerUnit:'g',pickerQuantity:244});
  click('picker-add',{kind:'consumed'});
  assert.equal(S.foodList().length,1);
  assert.equal(S.day(A.date).consumed[0].portionLabel,'244 g');
  click('add-food',{type:'planned',meal:'1'});
  click('picker-favorite',{foodId:S.foodList()[0].id});
  click('picker-tab',{tabId:'favorites'});
  assert.equal(S.favoriteFoods().length,1);
  assert.ok(nodes.pickerResults.innerHTML.includes('SCRAMBLED EGGS'));
  click('picker-tab',{tabId:'custom'});
  fields({pickName:'Milk',pickServing:'1 cup',pickGrams:240,pickProtein:8,pickCarbs:12,pickFat:5});
  click('picker-custom-next');
  fields({pickerUnit:'g',pickerQuantity:120});
  click('picker-add',{kind:'planned'});
  assert.equal(S.foodList().length,2);
  assert.equal(S.day(A.date).planned[1].servings,0.5);
  assert.equal(P.options({serving:'1 cup',protein:1}).length,1); // unknown cup weight cannot become grams
  assert.equal(P.resolve({serving:'100 g',gramWeight:100},'g',244).servings,2.44);
  const archive=S.exportJson();
  S.selectMember('Dan');
  assert.equal(S.foodList().length,0);
  assert.equal(S.favoriteFoods().length,0);
  S.importBackup(archive);
  S.selectMember('David');
  assert.equal(S.day(A.date).planned.length,2);
  assert.equal(S.day(A.date).consumed.length,1);
  assert.equal(urls.filter(url=>url.includes('/foods/search')).length,1);
  assert.equal(urls.filter(url=>url.includes('/food/991?')).length,1);
  assert.equal(errors.length,0);
  console.log('PASS: direct USDA lookup; known egg/cup weights; grams; Recent, Favorites, Custom; plan versus consumed; backup and member isolation.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
