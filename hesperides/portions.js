/* HESPERIDES — accurate serving conversion without generic food-density assumptions.
 * Household measures are available only with a verified per-food gram weight. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.HesperidesPortions=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const round=(x,d=2)=>Math.round(x*10**d)/10**d;
  function baseGrams(food){
    const n=Number(food?.gramWeight);
    if(Number.isFinite(n)&&n>0)return n;
    const serving=String(food?.serving||'').trim();
    const match=serving.match(/(?:^|[ (])(\d+(?:\.\d+)?)\s*g(?:rams?)?(?:$|[ ),])/i);
    return match?Number(match[1]):0;
  }
  function options(food){
    const grams=baseGrams(food),result=[];
    if(grams){
      result.push({id:'g',label:'Grams (g)',gramsPerUnit:1});
      result.push({id:'oz',label:'Ounces (oz)',gramsPerUnit:28.349523125});
      if(Math.abs(grams-100)>.01||!/^\s*100\s*g\s*$/i.test(String(food?.serving||''))){
        result.push({id:'serving',label:String(food?.serving||'Serving').slice(0,75),gramsPerUnit:grams});
      }
      for(const [i,entry] of (Array.isArray(food?.servingOptions)?food.servingOptions:[]).entries()){
        const n=Number(entry.grams),label=String(entry.label||'').trim();
        if(!(n>0)||n>10000||!label||label.length>75)continue;
        const code='measure:'+String(entry.id||i).replace(/[^a-z0-9:-]/gi,'').slice(0,45);
        if(result.some(x=>x.label.toLowerCase()===label.toLowerCase()||x.id===code))continue;
        result.push({id:code,label,gramsPerUnit:n});
      }
    }else result.push({id:'serving',label:String(food?.serving||'Serving').slice(0,75),gramsPerUnit:0});
    return result;
  }
  function resolve(food,optionId,quantity){
    const n=Number(quantity);
    if(!Number.isFinite(n)||n<=0||n>10000)throw Error('Enter a positive portion quantity (max 10,000).');
    const available=options(food),chosen=available.find(x=>x.id===optionId);
    if(!chosen)throw Error('Select an available serving for this food.');
    const base=baseGrams(food);
    const grams=chosen.gramsPerUnit?n*chosen.gramsPerUnit:null;
    if(grams!==null&&grams>10000)throw Error('The selected quantity exceeds 10 kg.');
    const servings=grams!==null?grams/base:n;
    if(!Number.isFinite(servings)||servings<=0||servings>10000)throw Error('Invalid serving quantity.');
    const original=String(food?.serving||'Serving').trim();
    const label=chosen.id==='g'?round(n,2)+' g':chosen.id==='oz'?round(n,2)+' oz':round(n,2)+' × '+chosen.label;
    const result={servings:round(servings,7),portionAmount:n,portionUnit:chosen.id,portionLabel:label,
      portionGrams:grams!==null?round(grams,2):null,originalServing:original};
    return result;
  }
  function macros(food,selection){
    const s=Number(selection.servings);
    return {protein:round(Number(food.protein)*s,1),carbs:round(Number(food.carbs)*s,1),fat:round(Number(food.fat)*s,1),
      calories:Math.round((Number(food.protein)*4+Number(food.carbs)*4+Number(food.fat)*9)*s)};
  }
  return {baseGrams,options,resolve,macros};
});
