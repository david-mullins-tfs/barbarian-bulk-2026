(function(root){
  'use strict';
  const C=root.HesperidesCore;
  if(!C)throw Error('HesperidesCore required before state.js');
  const KEY='hesperides_nutrition_v1';
  const fresh=()=>({schema:1,member:'David',profiles:{},foods:{},days:{},templates:{},legacy:{}});
  let data;
  try{data=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
  if(!data||typeof data!=='object'||data.schema!==1)data=fresh();
  for(const key of ['profiles','foods','days','templates','legacy'])if(!data[key]||typeof data[key]!=='object')data[key]={};
  if(!C.MEMBERS.includes(data.member))data.member='David';
  const id=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
  const deep=x=>JSON.parse(JSON.stringify(x));
  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify(data));return true;}
    catch(e){alert('Hesperides could not save. Your device storage may be full. Export a backup before leaving.');return false;}
  }
  function current(){return data.member;}
  function selectMember(name){if(!C.MEMBERS.includes(name))throw Error('Unknown member');data.member=name;persist();}
  function profile(member=current()){
    if(!data.profiles[member])data.profiles[member]={age:'',weightLb:'',heightCm:'',sex:'male',activity:'moderate',goal:'maintenance',mealCount:4,target:null,estimate:null};
    return data.profiles[member];
  }
  function foodList(member=current()){return data.foods[member]||(data.foods[member]=[]);}
  function templates(member=current()){return data.templates[member]||(data.templates[member]=[]);}
  function day(date,member=current(),create=false){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))throw Error('Invalid calendar date');
    const days=data.days[member]||(data.days[member]={});
    if(!days[date]&&create){
      const p=profile(member);
      days[date]={date,mealCount:p.mealCount||4,targetSnapshot:p.target?deep(p.target):null,planned:[],consumed:[]};
    }
    return days[date]||null;
  }
  function dayData(date,member=current()){
    const currentDay=day(date,member,false),p=profile(member);
    return currentDay||{date,mealCount:p.mealCount||4,targetSnapshot:p.target?deep(p.target):null,planned:[],consumed:[]};
  }
  function targetFor(date,member=current()){return dayData(date,member).targetSnapshot||profile(member).target||null;}
  function saveProfile(input){
    const estimate=C.estimate(input),p=profile();
    Object.assign(p,{age:Number(input.age),weightLb:Number(input.weightLb),heightCm:Number(input.heightCm),sex:input.sex,
      activity:input.activity,goal:input.goal,mealCount:Number(input.mealCount),
      estimate,target:{protein:estimate.protein,carbs:estimate.carbs,fat:estimate.fat},
      lastCalculated:new Date().toISOString()});
    persist();return estimate;
  }
  function saveCustomTarget({protein,carbs,fat}){
    const p=profile(),value={protein:Number(protein),carbs:Number(carbs),fat:Number(fat)};
    if(!Object.values(value).every(x=>Number.isFinite(x)&&x>=0)||C.calories(value)<500||C.calories(value)>7500)
      throw Error('Enter valid positive daily macros and an appropriate calorie total.');
    p.target=value;p.lastAdjusted=new Date().toISOString();persist();return value;
  }
  function saveMealCount(date,count){
    const n=Number(count),d=day(date,current(),true);
    if(!Number.isInteger(n)||n<2||n>7)throw Error('Choose 2–7 meals.');
    const max=Math.max(0,...d.planned.map(x=>Number(x.mealIndex)||0),...d.consumed.map(x=>Number(x.mealIndex)||0));
    if(max>=n)throw Error('Move or remove foods from higher-numbered meals first.');
    d.mealCount=n;persist();
  }
  function saveFood(food){
    const list=foodList(),name=String(food.name||'').trim(),serving=String(food.serving||'').trim();
    const macros={protein:Number(food.protein),carbs:Number(food.carbs),fat:Number(food.fat)};
    if(!name||name.length>100||!serving||serving.length>80)throw Error('Enter a food name and serving description.');
    if(!Object.values(macros).every(x=>Number.isFinite(x)&&x>=0&&x<=500))throw Error('Macros must be 0–500 g per serving.');
    const existing=food.id?list.find(x=>x.id===food.id):null;
    if(food.id&&!existing)throw Error('Food no longer exists');
    const entry={id:existing?.id||id(),name,serving,...macros};
    if(existing)Object.assign(existing,entry);else list.push(entry);
    persist();return entry;
  }
  function removeFood(foodId){
    const list=foodList(),i=list.findIndex(x=>x.id===foodId);
    if(i<0)return false;
    list.splice(i,1);persist();return true;
  }
  function addEntry(date,mealIndex,foodId,servings,kind='planned'){
    if(!['planned','consumed'].includes(kind))throw Error('Unknown food list');
    const food=foodList().find(x=>x.id===foodId);
    const d=day(date,current(),true),n=Number(mealIndex),amount=Number(servings);
    if(!food)throw Error('Choose a food from the library.');
    if(!Number.isInteger(n)||n<0||n>=d.mealCount)throw Error('Choose a valid meal.');
    if(!Number.isFinite(amount)||amount<=0||amount>100)throw Error('Enter 0.01–100 servings.');
    const entry={id:id(),foodId:food.id,name:food.name,serving:food.serving,
      protein:food.protein,carbs:food.carbs,fat:food.fat,servings:amount,mealIndex:n};
    d[kind].push(entry);persist();return entry;
  }
  function removeEntry(date,kind,itemId){
    const d=day(date),items=d?.[kind];
    if(!items)return false;
    const index=items.findIndex(x=>x.id===itemId);
    if(index<0)return false;
    items.splice(index,1);persist();return true;
  }
  function logPlanned(date,itemId){
    const d=day(date),item=d?.planned?.find(x=>x.id===itemId);
    if(!item)throw Error('Planned food not found.');
    if(d.consumed.some(x=>x.planId===itemId))return false;
    d.consumed.push({...deep(item),id:id(),planId:itemId});persist();return true;
  }
  function logMeal(date,index){
    const d=day(date);
    if(!d)return 0;
    const current=new Set(d.consumed.map(x=>x.planId).filter(Boolean)),foods=d.planned.filter(x=>x.mealIndex===index&&!current.has(x.id));
    foods.forEach(x=>d.consumed.push({...deep(x),id:id(),planId:x.id}));
    if(foods.length)persist();return foods.length;
  }
  function saveTemplate(date,name){
    const d=day(date),text=String(name||'').trim();
    if(!d?.planned?.length)throw Error('Plan some foods before saving a meal template.');
    if(!text||text.length>80)throw Error('Name this meal plan.');
    const t={id:id(),name:text,mealCount:d.mealCount,items:d.planned.map(({id,planId,...rest})=>deep(rest)),created:new Date().toISOString()};
    templates().push(t);persist();return t;
  }
  function deleteTemplate(templateId){
    const list=templates(),i=list.findIndex(x=>x.id===templateId);
    if(i<0)return false;list.splice(i,1);persist();return true;
  }
  function replacePlan(date,sourceItems,mealCount){
    const d=day(date,current(),true);
    if(!Array.isArray(sourceItems))throw Error('No meal plan provided.');
    const copied=C.copyPlan(sourceItems,id);
    const count=Number(mealCount)||d.mealCount;
    if(count<2||count>7||copied.some(x=>x.mealIndex>=count))throw Error('Meal template does not fit the chosen meal count.');
    d.planned=copied;d.mealCount=count;persist();return copied.length;
  }
  function applyTemplate(date,templateId){
    const t=templates().find(x=>x.id===templateId);
    if(!t)throw Error('Template not found.');
    return replacePlan(date,t.items,t.mealCount);
  }
  function importAtlas(obj){
    if(!obj||typeof obj!=='object'||!obj.nutrition)throw Error('No ATLAS nutrition history found in this backup.');
    const n=C.importLegacy(data,obj);persist();return n;
  }
  function importFromSameOrigin(){
    let obj;try{obj=JSON.parse(localStorage.getItem('barbarian_bulk_pwa_v1')||'null');}catch(e){}
    if(!obj?.nutrition)throw Error('ATLAS history is not on this device. Export it from ATLAS Settings and import the file here.');
    return importAtlas(obj);
  }
  function legacy(member=current()){return data.legacy[member]||null;}
  function exportJson(){return JSON.stringify(data,null,2);}
  function importBackup(raw){
    const next=typeof raw==='string'?JSON.parse(raw):raw;
    if(!next||next.schema!==1||!next.profiles||!next.days||!next.foods||!next.templates)
      throw Error('Not a Hesperides v1 backup.');
    data=deep(next);
    if(!C.MEMBERS.includes(data.member))data.member='David';
    data.legacy ||= {};persist();
  }
  function dates(member=current()){return Object.keys(data.days[member]||{}).sort().reverse();}
  function record(){return data;}
  persist();
  root.HesperidesStore={KEY,current,selectMember,profile,foodList,templates,day,dayData,targetFor,
    saveProfile,saveCustomTarget,saveMealCount,saveFood,removeFood,addEntry,removeEntry,logPlanned,logMeal,
    saveTemplate,deleteTemplate,replacePlan,applyTemplate,importAtlas,importFromSameOrigin,legacy,
    exportJson,importBackup,dates,record};
})(typeof window!=='undefined'?window:globalThis);
