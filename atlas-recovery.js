(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.AtlasRecovery=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RATINGS={
    very:'Very Sore',
    some:'Somewhat Sore',
    right:'Just Right',
    long:'Recovered for a While'
  };
  const TRACKED=new Set(['Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings','Glutes','Calves','Abs','Adductors','Abductors']);
  function muscleGroup(muscle){
    if(!muscle)return null;
    const name=String(muscle);
    if(['Delts','Front Delts','Side Delts','Rear Delts'].includes(name))return 'Shoulders';
    if(name==='Core')return 'Abs';
    return TRACKED.has(name)?name:null;
  }
  function groupList(exercises,metadata){
    const all=[];
    for(const ex of exercises){
      if(!ex||!ex[1])continue;
      const meta=metadata(ex[0]);if(!meta)continue;
      for(const raw of [meta.primary,...(meta.secondary||[])]){
        const name=muscleGroup(raw);
        if(name&&!all.includes(name))all.push(name);
      }
    }
    return all;
  }
  function proposal(exercises,answers,metadata,goodPerformance,extraAllowance){
    const counts=exercises.map(ex=>Number(ex[1])||0);
    const messages={};
    for(const group of groupList(exercises,metadata)){
      const rating=answers[group]||'right';
      if(!Object.prototype.hasOwnProperty.call(RATINGS,rating))continue;
      const indices=exercises.map((ex,i)=>({
        i,ex,meta:metadata(ex[0]),group:muscleGroup(metadata(ex[0])?.primary)
      })).filter(item=>item.group===group&&Number(item.ex[1])>0);
      const accessory=indices.filter(item=>item.meta?.type==='isolation'&&counts[item.i]>1).reverse();
      const baseline=indices.reduce((sum,item)=>sum+Number(item.ex[1]),0);
      if(rating==='very'||rating==='some'){
        let needed=rating==='very'?Math.max(1,Math.ceil(baseline*0.30)):1,removed=0;
        for(const item of accessory){
          const count=Math.min(needed,Math.max(0,counts[item.i]-1));
          counts[item.i]-=count;needed-=count;removed+=count;
          if(!needed)break;
        }
        messages[group]=removed
          ? 'Suggested -'+removed+' accessory set'+(removed===1?'':'s')+'. Compounds stay at programmed sets.'
          : 'No accessory sets can be reduced safely. Consider postponing or adjusting effort rather than forcing a sore muscle.';
      }else if(rating==='long'){
        const candidate=accessory.find(item=>!goodPerformance||goodPerformance(item.ex[0],group));
        if(candidate&&(!extraAllowance||extraAllowance(group,candidate.ex[0]))){
          counts[candidate.i]+=1;
          messages[group]='Suggested +1 accessory set, based on prior performance and the weekly cap.';
        }else messages[group]='No extra set suggested: prior performance or weekly recovery limit does not support an increase.';
      }else messages[group]='Standard working sets retained.';
    }
    return {counts,messages};
  }
  return {RATINGS,muscleGroup,groupList,proposal};
});
