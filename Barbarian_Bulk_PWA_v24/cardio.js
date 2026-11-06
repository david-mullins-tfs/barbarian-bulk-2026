(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Cardio=api;})(this,function(){
  const DEFAULT_ACTIVITY='Walking';
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function blankEntry(){return {activity:DEFAULT_ACTIVITY,duration:'',distance:'',intensity:'Moderate',calories:''};}
  function totalMinutes(entries){return (entries||[]).reduce((sum,x)=>sum+num(x.duration),0);}
  function weekSummary(days,dates){
    const rows=(dates||[]).map(d=>days[d]).filter(Boolean);
    return {sessions:rows.length,minutes:totalMinutes(rows),distance:Math.round(rows.reduce((s,x)=>s+num(x.distance),0)*10)/10,calories:Math.round(rows.reduce((s,x)=>s+num(x.calories),0))};
  }
  function recentHistory(days,limit=7){return Object.entries(days||{}).filter(([,x])=>x).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,limit).map(([date,entry])=>({date,...entry}));}
  return {blankEntry,totalMinutes,weekSummary,recentHistory};
});
