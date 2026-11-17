/* HESPERIDES v1.1 — experimental USDA FoodData Central search.
   USDA FoodData Central data is CC0/public domain. No private API credentials are shipped.
   The publicly documented DEMO_KEY is rate-limited and may be unavailable. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.HesperidesFoodDB=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const BASE='https://api.nal.usda.gov/fdc/v1/foods/search';
  const KEY='DEMO_KEY';
  const round=n=>Math.round(n*10)/10;
  function nutrient(food,id,aliases){
    for(const entry of Array.isArray(food?.foodNutrients)?food.foodNutrients:[]){
      const num=Number(entry.nutrientId||entry.nutrient?.id);
      const label=String(entry.nutrientName||entry.nutrient?.name||'').toLowerCase().trim();
      if(num!==id&&!aliases.some(name=>label===name))continue;
      const value=Number(entry.value??entry.amount);
      const unit=String(entry.unitName||entry.nutrient?.unitName||'g').toLowerCase();
      if(Number.isFinite(value)&&value>=0&&unit==='g')return round(value);
    }
    return null;
  }
  function measures(raw){
    const result=[],keys=new Set();
    const push=(label,grams,id)=>{
      label=String(label||'').trim().replace(/\s+/g,' ');
      const n=Number(grams);
      if(!label||!Number.isFinite(n)||n<=0||n>10000)return;
      const key=label.toLowerCase()+':'+Math.round(n*100)/100;
      if(keys.has(key))return;keys.add(key);
      result.push({id:String(id||result.length),label:label.slice(0,70)+' ('+Math.round(n*10)/10+' g)',grams:n});
    };
    const amount=Number(raw?.servingSize),unit=String(raw?.servingSizeUnit||'').toLowerCase().trim();
    if(Number.isFinite(amount)&&amount>0&&['g','gr','gram','grams'].includes(unit)&&raw?.householdServingFullText){
      push(raw.householdServingFullText,amount,'label');
    }
    const portions=[...(Array.isArray(raw?.foodPortions)?raw.foodPortions:[]),
      ...(Array.isArray(raw?.foodMeasures)?raw.foodMeasures:[])];
    for(const [i,p] of portions.entries()){
      const gram=Number(p.gramWeight),count=Number(p.amount)||1;
      const unitName=typeof p.measureUnit==='object'?p.measureUnit?.name:p.measureUnit;
      const label=p.portionDescription||p.disseminationText
        ||[count,unitName||p.modifier||''].join(' ').trim();
      if(label&&gram>0)push(label,gram,'usda'+(p.id||i));
    }
    return result.slice(0,18);
  }
  const detailCache=new Map();
  async function details(foodId,fetcher){
    const id=Number(foodId);
    if(!Number.isInteger(id)||id<=0)throw Error('Invalid USDA food ID.');
    if(detailCache.has(id))return detailCache.get(id);
    const request=fetcher||fetch;
    const url='https://api.nal.usda.gov/fdc/v1/food/'+id+'?api_key='+KEY;
    let response;
    try{response=await request(url,{method:'GET',headers:{Accept:'application/json'}});}
    catch(e){throw Error('USDA serving details unavailable; grams and ounces still work.');}
    if(!response.ok)throw Error('USDA serving details unavailable ('+response.status+'). Grams and ounces still work.');
    let food;
    try{food=await response.json();}catch(e){throw Error('USDA serving details could not be read.');}
    const result=measures(food);
    detailCache.set(id,result);
    return result;
  }
  function normalize(raw){
    if(!raw||!Number.isInteger(Number(raw.fdcId)))return null;
    const protein=nutrient(raw,1003,['protein']);
    const fat=nutrient(raw,1004,['total lipid (fat)','total fat']);
    const carbs=nutrient(raw,1005,['carbohydrate, by difference','carbohydrate']);
    if([protein,fat,carbs].some(x=>x===null))return null;
    const description=String(raw.description||'').trim();
    if(!description)return null;
    const brand=String(raw.brandOwner||raw.brandName||'').trim();
    const name=(description+(brand?' — '+brand:'')).slice(0,100);
    return {id:String(raw.fdcId),name,brand,description,type:String(raw.dataType||'USDA'),
      serving:'100 g',gramWeight:100,servingOptions:measures(raw),protein,carbs,fat,
      calories:Math.round(protein*4+carbs*4+fat*9),
      source:'USDA FoodData Central',
      sourceUrl:'https://fdc.nal.usda.gov/food-details/'+String(raw.fdcId)+'/nutrients'};
  }
  async function search(query,fetcher){
    const q=String(query||'').trim();
    if(q.length<2)throw Error('Enter at least 2 letters to search USDA foods.');
    if(q.length>80)throw Error('Search phrases must be 80 characters or fewer.');
    const request=fetcher||fetch;
    const url=BASE+'?api_key='+KEY+'&query='+encodeURIComponent(q)+'&pageSize=25';
    let response;
    try{response=await request(url,{method:'GET',headers:{'Accept':'application/json'},cache:'no-store'});}
    catch(e){throw Error('Could not reach USDA. Check your connection or enter food manually.');}
    if(response.status===429)throw Error('USDA demo search limit reached. Try again later or enter food manually.');
    if(!response.ok)throw Error('USDA search is temporarily unavailable ('+response.status+'). You can enter food manually.');
    let obj;
    try{obj=await response.json();}catch(e){throw Error('The USDA response could not be read. Please use manual food entry.');}
    const raw=Array.isArray(obj.foods)?obj.foods:[];
    const results=raw.map(normalize).filter(Boolean);
    return {results,found:raw.length,total:Number(obj.totalHits)||raw.length,query:q};
  }
  return {normalize,nutrient,search,measures,details,BASE,version:'1.2'};
});
