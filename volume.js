(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Volume=factory();})(this,function(){
  function classifyVolume(sets){sets=Number(sets)||0;if(sets<6)return 'MV';if(sets<10)return 'MEV';if(sets<=20)return 'MAV';return 'MRV';}
  function add(out,map,count){Object.entries(map||{}).forEach(([muscle,credit])=>{out[muscle]=(out[muscle]||0)+count*credit;});}
  function programmedVolume(program,muscleMap){const out={};Object.values(program).forEach(day=>day.exercises.forEach(ex=>{if(ex[1]>0)add(out,muscleMap[ex[0]],ex[1]);}));return out;}
  function completedVolume(logs,program,muscleMap,member,week){const out={};Object.entries(program).forEach(([day,info])=>info.exercises.forEach(ex=>{if(ex[1]<=0)return;const log=logs[[member,week,day,ex[0]].join('|')];if(!log)return;const completed=(log.sets||[]).filter(s=>s.reps!==''&&s.reps!=null&&Number(s.reps)>0).length;add(out,muscleMap[ex[0]],completed);}));return out;}
  return {classifyVolume,programmedVolume,completedVolume};
});
