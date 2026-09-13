(function(global){
  function round5(n){return Math.max(0,Math.round(Number(n||0)/5)*5)}
  function mainRamp(weight){
    const w=Number(weight)||0;if(w<=0)return [];
    return [[.30,10,60],[.50,8,90],[.70,5,120],[.85,2,150]].map(([p,reps,rest])=>({weight:round5(w*p),reps,rest}));
  }
  function secondaryRamp(weight){
    const w=Number(weight)||0;if(w<=0)return [];
    return [[.50,8,60],[.75,3,120]].map(([p,reps,rest])=>({weight:round5(w*p),reps,rest}));
  }
  const MAIN={Monday:'Squat',Tuesday:'Bench',Thursday:'Deadlift',Friday:'Close-Grip Bench'};
  const SECONDARY=new Set(['Lunges','Leg Press','Incline Bench','Overhead Press','RDL','Chest-Supported Row','Seated DB Press']);
  function kindFor(day,exercise){
    if(MAIN[day]===exercise)return 'main';
    if(exercise==='Assisted Chin-Ups')return 'assisted';
    if(exercise==='Pullups')return 'bodyweight';
    if(SECONDARY.has(exercise))return 'secondary';
    return 'none';
  }
  const api={round5,mainRamp,secondaryRamp,kindFor};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.BarbarianWarmup=api;
})(typeof window!=='undefined'?window:globalThis);
