(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Nutrition=api;})(this,function(){
  const num=v=>Number(v)||0;
  function calories(m){return Math.round(num(m.protein)*4+num(m.carbs)*4+num(m.fat)*9)}
  function remaining(goal,used){const r={protein:num(goal.protein)-num(used.protein),fat:num(goal.fat)-num(used.fat),carbs:num(goal.carbs)-num(used.carbs)};r.calories=calories(goal)-calories(used);return r}
  function recommendation(rate,days){rate=num(rate);if(days<14)return {action:'wait',label:'KEEP TRACKING',detail:'Collect about 2 weeks of consistent scale readings before adjusting.'};if(rate>=0.4&&rate<=0.7)return {action:'stay',label:'STAY',detail:`Current trend: +${rate.toFixed(2)} lb/week.`};if(rate<0.4)return {action:'increase',label:'CONSIDER +100–150 KCAL',detail:'Suggested change: add about 25–38 g carbs/day.'};return {action:'decrease',label:'CONSIDER REDUCING CARBS',detail:'Suggested change: reduce carbs by 30–40 g/day.'}}
  function weightTrend(entries){
    const rows=(entries||[]).filter(x=>Number(x.weight)>0).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-14);
    const avg=a=>a.length?a.reduce((s,x)=>s+Number(x.weight),0)/a.length:0;
    const current=rows.slice(-7), previous=rows.slice(-14,-7);
    const currentAvg=avg(current), previousAvg=avg(previous);
    const rate=current.length&&previous.length?currentAvg-previousAvg:0;
    return {days:rows.length,currentAvg,previousAvg,rate};
  }
  return {calories,remaining,recommendation,weightTrend};
});
