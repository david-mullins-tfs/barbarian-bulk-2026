(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.HesperidesCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const MEMBERS=['David','Dan','Jason','Vinjo'];
  const GOALS={growth:'Growth',maintenance:'Maintenance',fat_loss:'Fat Loss'};
  const ACTIVITY={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,very_active:1.9};
  const NUMBER=v=>Number(v)||0;
  function calories(m){return Math.round(NUMBER(m.protein)*4+NUMBER(m.carbs)*4+NUMBER(m.fat)*9);}
  function sanitizeMacros(m){return {protein:Math.max(0,NUMBER(m?.protein)),carbs:Math.max(0,NUMBER(m?.carbs)),fat:Math.max(0,NUMBER(m?.fat))};}
  function add(a,b){return {protein:NUMBER(a.protein)+NUMBER(b.protein),carbs:NUMBER(a.carbs)+NUMBER(b.carbs),fat:NUMBER(a.fat)+NUMBER(b.fat)};}
  function estimate(profile){
    const age=Number(profile.age),weight=Number(profile.weightLb),height=Number(profile.heightCm);
    if(!Number.isFinite(age)||age<18||age>100)throw Error('Enter an age between 18 and 100.');
    if(!Number.isFinite(weight)||weight<60||weight>650)throw Error('Enter a realistic weight in pounds.');
    if(!Number.isFinite(height)||height<120||height>230)throw Error('Enter a realistic height in centimeters.');
    if(!['male','female'].includes(profile.sex))throw Error('Choose a physiology option for the BMR estimate.');
    if(!Object.hasOwn(ACTIVITY,profile.activity))throw Error('Choose an activity level.');
    if(!Object.hasOwn(GOALS,profile.goal))throw Error('Choose a nutrition goal.');
    if(!Number.isInteger(Number(profile.mealCount))||profile.mealCount<2||profile.mealCount>7)throw Error('Choose 2–7 meals each day.');
    const kg=weight/2.2046226218,bmr=10*kg+6.25*height-5*age+(profile.sex==='male'?5:-161);
    const maintenance=Math.round(bmr*ACTIVITY[profile.activity]/10)*10;
    const change=profile.goal==='growth'?250:profile.goal==='fat_loss'?-Math.min(400,Math.round(maintenance*0.15/10)*10):0;
    const targetCalories=Math.round((maintenance+change)/10)*10;
    const protein=Math.round(weight*(profile.goal==='fat_loss'?0.9:profile.goal==='growth'?0.8:0.75));
    const fat=Math.round(weight*0.3);
    const carbs=Math.max(0,Math.round((targetCalories-protein*4-fat*9)/4));
    return {bmr:Math.round(bmr),maintenance,targetCalories,adjustment:change,protein,fat,carbs,
      actualCalories:calories({protein,fat,carbs}),method:'Mifflin–St Jeor estimate'};
  }
  function equalMealTargets(target,count){
    if(!Number.isInteger(Number(count))||Number(count)<2||Number(count)>7)throw Error('Meal count must be from 2 to 7.');
    return Array.from({length:Number(count)},()=>({
      protein:Math.round(NUMBER(target.protein)/count),
      carbs:Math.round(NUMBER(target.carbs)/count),
      fat:Math.round(NUMBER(target.fat)/count),
      calories:Math.round(calories(target)/count)
    }));
  }
  function portions(items){
    return (items||[]).reduce((result,item)=>{
      const count=NUMBER(item.servings);
      if(!(count>0))return result;
      const snapshot=sanitizeMacros(item);
      return add(result,{protein:snapshot.protein*count,carbs:snapshot.carbs*count,fat:snapshot.fat*count});
    },{protein:0,carbs:0,fat:0});
  }
  function totalsFor(items,mealIndex){
    const filtered=mealIndex==null?items:(items||[]).filter(x=>Number(x.mealIndex)===Number(mealIndex));
    const values=portions(filtered);
    return {...values,calories:calories(values)};
  }
  function assessment(actual,target){
    const m=sanitizeMacros(target),got=sanitizeMacros(actual),goalCal=calories(m),ateCal=calories(got);
    if(!goalCal||!m.protein)return {complete:false,label:'Set targets',calories:ateCal,goalCalories:goalCal};
    const lower=0.90,upper=1.10,within=(used,goal)=>goal===0?used<=5:used>=goal*lower&&used<=goal*upper;
    const inRange=(got.protein>=m.protein*0.95&&got.protein<=m.protein*1.20)
      &&within(got.carbs,m.carbs)&&within(got.fat,m.fat)
      &&(ateCal>=goalCal*0.93&&ateCal<=goalCal*1.07);
    const above=ateCal>goalCal*1.07||(m.carbs===0?got.carbs>5:got.carbs>m.carbs*upper)
      ||(m.fat===0?got.fat>5:got.fat>m.fat*upper)||got.protein>m.protein*1.20;
    return {complete:inRange,label:inRange?'Complete':above?'Above target':'In progress',calories:ateCal,goalCalories:goalCal};
  }
  function copyPlan(items,newId){
    return (items||[]).map(item=>({
      id:newId(),foodId:item.foodId,name:item.name,serving:item.serving,
      protein:Math.max(0,NUMBER(item.protein)),carbs:Math.max(0,NUMBER(item.carbs)),fat:Math.max(0,NUMBER(item.fat)),
      servings:Math.max(0.01,NUMBER(item.servings)),mealIndex:Number(item.mealIndex)||0
    }));
  }
  function importLegacy(state,source){
    const nutrition=source?.nutrition||{};
    let count=0;
    state.legacy ||= {};
    for(const member of MEMBERS){
      const entry=nutrition[member];
      if(!entry||typeof entry!=='object')continue;
      const prev=state.legacy[member]||{days:{},targets:{},history:[]};
      const days={...(prev.days||{})};
      for(const [date,day] of Object.entries(entry.days||{})){
        if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!day||typeof day!=='object')continue;
        if(!Object.hasOwn(days,date)){days[date]={
          protein:NUMBER(day.protein),carbs:NUMBER(day.carbs),fat:NUMBER(day.fat),
          weight:NUMBER(day.weight),dayType:day.dayType||'training',
          targetSnapshot:day.targetSnapshot||null
        };count++;}
      }
      state.legacy[member]={days,targets:entry.targets||prev.targets||{},history:Array.isArray(entry.history)?entry.history:prev.history||[]};
    }
    return count;
  }
  return {MEMBERS,GOALS,ACTIVITY,calories,sanitizeMacros,add,estimate,equalMealTargets,
    portions,totalsFor,assessment,copyPlan,importLegacy};
});
