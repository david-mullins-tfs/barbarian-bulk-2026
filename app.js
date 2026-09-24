const PROGRAM = {
  'Monday': {
    focus:'Squat Focus', exercises:[
      ['Squat',4,6,8],['Lunges',3,10,12],['Leg Press',3,10,12],['Leg Curls',3,12,15]
    ]
  },
  'Tuesday': {
    focus:'Bench Focus', exercises:[
      ['Bench',4,6,8],['Incline Bench',3,8,10],['Pec Deck',3,10,15],['Pullups',3,6,9],['Lateral Raise',2,12,15]
    ]
  },
  'Thursday': {
    focus:'Deadlift Focus', exercises:[
      ['Deadlift',3,5,7],['RDL',3,8,10],['Leg Curls',3,12,15],['Yes Machine',3,12,15],['No Machine',3,12,15]
    ]
  },
  'Friday': {
    focus:'Upper Volume Day', exercises:[
      ['Close-Grip Bench',3,8,10],['Chest-Supported Row',3,10,12],['Seated DB Press',3,10,12],['Assisted Chin-Ups',3,8,12],['Triceps Pushdown',2,10,12],['EZ Curl',2,10,12]
    ]
  }
};
const DAVID_SUNDAY={
  'Sunday': {focus:'Chest + Biceps Specialization', exercises:[['Incline DB Press',3,8,12],['DB Fly',2,12,15],['Incline DB Curl',3,8,12],['Hammer Curl',2,10,15]]}
};
function baseProgramFor(member){return member==='David'?Object.assign({},PROGRAM,DAVID_SUNDAY):PROGRAM;}
function cloneExercises(exercises){return exercises.map(x=>[...x]);}
function migratePrograms(){
  state.programs=state.programs||{};
  for(const member of MEMBERS){
    if(!state.programs[member]) state.programs[member]={};
    for(const day of Object.keys(baseProgramFor(member))){
      if(!Array.isArray(state.programs[member][day])) state.programs[member][day]=cloneExercises(baseProgramFor(member)[day].exercises);
    }
  }
}
function programFor(member){
  migratePrograms();
  const base=baseProgramFor(member);
  const out={};
  for(const day of Object.keys(base)){
    const saved=state.programs[member]?.[day]||base[day].exercises;
    out[day]={focus:base[day].focus,exercises:cloneExercises(saved)};
  }
  return out;
}
function daysFor(member){return Object.keys(programFor(member));}
function muscleMapFromLibrary(){
  const map={};
  const lib=window.BarbarianExercises?.LIBRARY||{};
  for(const [name,m] of Object.entries(lib)) map[name]=Object.fromEntries([[m.primary,1],...(m.secondary||[]).map(x=>[x,.5])]);
  return map;
}
const MUSCLE_MAP=muscleMapFromLibrary();
const DAYS=Object.keys(PROGRAM), MEMBERS=['David','Dan','Jason','Vinjo'], WEEKS=12, INCREMENT=5;
const KEY='barbarian_bulk_pwa_v1';
let state=loadState();
state.notes=state.notes||{};
migratePrograms();
let route='home'; let editing=null; let plateTarget=135; let plateStart=45;

function loadState(){
  try{const raw=localStorage.getItem(KEY); if(raw) return JSON.parse(raw);}catch(e){}
  return {member:'David',week:1,logs:{},nutrition:{},cardio:{},programs:{},notes:{}};
}
function saveState(){localStorage.setItem(KEY,JSON.stringify(state));}
function nutritionState(member){state.nutrition=state.nutrition||{};return state.nutrition[member]||(state.nutrition[member]={targets:{protein:150,fat:75,carbs:370,restCarbOffset:40},days:{},history:[]});}
function todayKey(){return new Date().toISOString().slice(0,10)}
function key(member,week,day,exercise){return [member,week,day,exercise].join('|')}
function noteKey(scope,member,week,day,exercise,setIndex){return ['note',scope,member,week,day,exercise||'',setIndex==null?'':setIndex].join('|')}
function getNote(scope,member,week,day,exercise,setIndex){return (state.notes||{})[noteKey(scope,member,week,day,exercise,setIndex)]||''}
function hasNote(scope,member,week,day,exercise,setIndex){return !!getNote(scope,member,week,day,exercise,setIndex).trim()}
function noteButton(scope,label,member,week,day,exercise,setIndex,compact=false){const active=hasNote(scope,member,week,day,exercise,setIndex);return `<button class="note-btn ${active?'has-note':''} ${compact?'compact':''}" data-note-scope="${scope}" data-note-label="${esc(label)}" data-note-exercise="${esc(exercise||'')}" data-note-set="${setIndex==null?'':setIndex}" aria-label="${active?'Edit':'Add'} ${esc(label)} note">📝${compact?'':active?' Note ✓':' Note'}</button>`}
function getLog(member,week,day,exercise){return state.logs[key(member,week,day,exercise)] || null}
function targetText(ex){return ex[3]==null?'Each':`${ex[2]}–${ex[3]}`}
function sessionRows(member,week,day,exercise){
  const plan=programFor(member);
  const ex=plan[day]?.exercises.find(x=>x[0]===exercise); if(!ex) return null;
  const existing=getLog(member,week,day,exercise);
  if(existing){
    const normalized={...existing,sets:window.BarbarianWeightSync?window.BarbarianWeightSync.normalizeSetWeights(existing.sets||[]):(existing.sets||[])};
    return normalized;
  }
  let weight=0;
  const prev=week>1?getLog(member,week-1,day,exercise):null;
  if(prev){
    const complete=ex[2]!=null && prev.sets.length===ex[1] && prev.sets.every(s=>Number(s.reps)>=ex[3]);
    weight=exercise==='Assisted Chin-Ups' ? Math.max(0,(Number(prev.workingWeight)||0)-(complete?INCREMENT:0)) : (Number(prev.workingWeight)||0)+(complete?INCREMENT:0);
  }
  if(prev && !weight) weight=Number(prev.workingWeight)||0;
  return {workingWeight:weight,sets:Array.from({length:ex[1]},()=>({weight:weight,reps:''})),saved:false};
}
function metrics(log,ex){
  if(!log) return {top:0,reps:0,volume:0,ready:false};
  const vals=log.sets.filter(s=>s.weight!==''||s.reps!=='');
  const weights=vals.map(s=>Number(s.weight)||0), reps=vals.map(s=>Number(s.reps)||0);
  const repsTotal=reps.reduce((a,b)=>a+b,0), volume=vals.reduce((a,s)=>a+(Number(s.weight)||0)*(Number(s.reps)||0),0);
  const ready=ex[3]!=null && log.sets.length===ex[1] && log.sets.every(s=>Number(s.reps)>=ex[3]);
  return {top:Math.max(0,...weights),reps:repsTotal,volume,ready};
}
function dayComplete(member,week,day){
  return programFor(member)[day].exercises.every(ex=>{const l=getLog(member,week,day,ex[0]); return ex[1]===0 ? true : !!l && l.sets.length===ex[1] && l.sets.every(s=>s.reps!=='');});
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}
function render(){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
  const app=document.getElementById('app'); if(route==='home') app.innerHTML=homeView(); else if(route==='progress') app.innerHTML=progressView(); else if(route==='volume') app.innerHTML=volumeView(); else if(route==='macros') app.innerHTML=macrosView(); else if(route==='cardio') app.innerHTML=cardioView(); else if(route==='plates') app.innerHTML=platesView(); else if(route==='program') app.innerHTML=programEditorView(); else app.innerHTML=settingsView(); bind();}

function homeView(){
  if(editing) return workoutView(editing.week,editing.day);
  const m=state.member,w=state.week, days=daysFor(m), pct=Math.round((days.filter(d=>dayComplete(m,w,d)).length/days.length)*100);
  return `<section class="hero"><h2>${esc(m)} · Week ${w}</h2><p>Double progression: hit the top of every target set, then the next session moves up ${INCREMENT} lb and returns to the bottom of the range.</p>
    <div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Week</label><select id="weekSelect" class="select">${Array.from({length:WEEKS},(_,i)=>`<option value="${i+1}" ${i+1===w?'selected':''}>Week ${i+1}</option>`).join('')}</select></div></div>
    <div style="margin-top:15px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px"><span>Week completion</span><b>${pct}%</b></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div>
  </section><div class="section-title">Training days</div><div class="day-grid">${days.map(day=>dayCard(m,w,day)).join('')}</div>
  <div class="section-title">Program notes</div><div class="info">Choose a starting weight. Keep that weight until all target sets reach the top of the range. Then add 5 lb next session and start the rep target back at the bottom.</div>`;
}
function dayCard(m,w,day){const plan=programFor(m),done=dayComplete(m,w,day), n=plan[day].exercises.length;return `<button class="day-card" data-open-day="${day}" style="text-align:left"><div class="day-top"><div><div class="day-name">${day}</div><div class="focus">${plan[day].focus} · ${n} exercises</div></div><div class="done-dot ${done?'done':''}"></div></div><div class="action-row" style="margin-top:12px"><span class="secondary" style="display:flex;align-items:center;justify-content:center">${done?'Review':'Start workout'}</span></div></button>`}

function workoutView(week,day){
  const m=state.member, info=programFor(m)[day];
  return `<div class="workout-head"><div><button class="back" data-back>← Back</button><h2 style="margin-top:14px">${day} · Week ${week}</h2><p>${esc(info.focus)}</p></div>${noteButton('workout',day+' workout',m,week,day)}</div>
    ${info.exercises.map(ex=>exerciseCard(m,week,day,ex)).join('')}
    <div class="action-row" style="margin:18px 0 6px"><button class="primary" data-finish-workout>Save ${day}</button></div>`;
}

function warmupView(day,ex,workingWeight){
  if(!window.BarbarianWarmup)return '';
  const kind=window.BarbarianWarmup.kindFor(day,ex[0]);
  if(kind==='none')return '';
  if(kind==='assisted')return `<div class="warmup-block"><div class="warmup-title">Suggested warm-up</div><div class="warmup-row"><div><b>Easy acclimation set</b><span>5–8 controlled reps · use comfortable assistance</span></div><button class="secondary warmup-rest" data-warmup-rest="90" data-warmup-label="${esc(ex[0])} warm-up">▶ Rest 1:30</button></div><div class="warmup-foot">Warm-up sets do not count toward Weekly Volume or double progression.</div></div>`;
  if(kind==='bodyweight')return `<div class="warmup-block"><div class="warmup-title">Suggested warm-up</div><div class="warmup-row"><div><b>1 easy set</b><span>5–8 controlled reps · stop well short of fatigue</span></div><button class="secondary warmup-rest" data-warmup-rest="90" data-warmup-label="${esc(ex[0])} warm-up">▶ Rest 1:30</button></div><div class="warmup-foot">Warm-up sets do not count toward Weekly Volume or double progression.</div></div>`;
  const w=Number(workingWeight)||0;
  if(!w)return `<div class="warmup-block"><div class="warmup-title">Suggested warm-up</div><div class="warmup-empty">Enter your working weight in Set 1 to calculate the warm-up ramp.</div></div>`;
  const ramp=kind==='main'?window.BarbarianWarmup.mainRamp(w):window.BarbarianWarmup.secondaryRamp(w);
  return `<div class="warmup-block"><div class="warmup-title">Suggested warm-up · ${kind==='main'?'full ramp':'acclimation'}</div>${ramp.map((x,i)=>`<div class="warmup-row"><div><b>${x.weight} lb × ${x.reps}</b><span>Warm-up ${i+1} · rest ${window.BarbarianRest.formatTime(x.rest)}</span></div><button class="secondary warmup-rest" data-warmup-rest="${x.rest}" data-warmup-label="${esc(ex[0])} warm-up ${i+1}">▶ Rest ${window.BarbarianRest.formatTime(x.rest)}</button></div>`).join('')}<div class="warmup-foot">Based on ${w} lb working weight. Warm-ups are suggestions and do not count toward Weekly Volume or double progression.</div></div>`;
}

function exerciseCard(m,w,day,ex){
  if(ex[1]===0) return `<article class="exercise"><div class="exercise-head"><div><div class="exercise-name">${esc(ex[0])}</div><div class="range">Each</div></div></div><p class="muted" style="margin:12px 0 0">Accessory/superset note from the original program.</p></article>`;
  const log=sessionRows(m,w,day,ex[0]); const mt=metrics(log,ex); const suggested=log.workingWeight||0; const isSaved=getLog(m,w,day,ex[0]);
  const superset=(day==='Friday' && (ex[0]==='EZ Curl'||ex[0]==='Triceps Pushdown'))?'<span class="superset-badge">SUPERSET A</span>':'';
  return `<article class="exercise" data-exercise="${esc(ex[0])}"><div class="exercise-head"><div><div class="exercise-name">${esc(ex[0])}</div><div class="range">${targetText(ex)} reps · ${isSaved?'saved':'ready to log'} ${superset}</div></div><button class="plate-quick" data-plate-ex="${esc(ex[0])}" data-plate-weight="${suggested||''}" aria-label="Plate count for ${esc(ex[0])}">🧮 ${suggested?suggested+' lb':'Plates'}</button>${mt.ready?(ex[0]==='Assisted Chin-Ups'?'<span class="add-badge">REDUCE 5 LB ASSISTANCE</span>':'<span class="add-badge">ADD 5 LB NEXT</span>'):'<span class="keep-badge">KEEP WEIGHT</span>'}</div>
    <div class="warmup-slot">${warmupView(day,ex,suggested)}</div>
    <div class="set-table header"><div>Set</div><div>Weight</div><div>Reps</div><div>Note</div><div></div></div>
    ${log.sets.map((s,i)=>`<div class="set-table"><div class="set-num">${i+1}</div><input class="mini-input set-weight" inputmode="decimal" type="number" min="0" step="5" value="${s.weight??''}" aria-label="${ex[0]} set ${i+1} weight"><input class="mini-input set-reps" inputmode="numeric" type="number" min="0" step="1" placeholder="${ex[2]}-${ex[3]}" value="${s.reps??''}" aria-label="${ex[0]} set ${i+1} reps">${noteButton('set',ex[0]+' set '+(i+1),m,w,day,ex[0],i,true)}<div class="set-status ${ex[3]!=null && Number(s.reps)>=ex[3]?'good':'bad'}">${ex[3]!=null&&Number(s.reps)>=ex[3]?'✓':'•'}</div></div>`).join('')}
    <div class="metrics"><div class="metric"><div class="label">Top weight</div><div class="value top-val">${mt.top||'—'}</div></div><div class="metric"><div class="label">Total reps</div><div class="value reps-val">${mt.reps||'—'}</div></div><div class="metric"><div class="label">Volume</div><div class="value volume-val">${mt.volume?Math.round(mt.volume):'—'}</div></div></div>
    <div class="rest-controls"><div><div class="rest-label">Rest timer</div><div class="rest-note">Default 2:30 · adjust in 30-second steps</div></div><button class="secondary rest-start" data-rest-start="${esc(ex[0])}">▶ Start Rest</button></div>
    <div class="action-row" style="margin-top:10px"><button class="secondary" data-save-ex="${esc(ex[0])}">${isSaved?'Update':'Save exercise'}</button>${noteButton('exercise',ex[0],m,w,day,ex[0])}</div>
  </article>`;
}

function progressView(){const m=state.member,days=daysFor(m),plan=programFor(m);const exercises=[...new Map(days.flatMap(d=>plan[d].exercises).map(x=>[x[0],x])).values()].filter(x=>x[1]);
return `<section class="hero"><h2>${esc(m)} · Progress</h2><p>Track working weight, total reps and volume across the 12-week plan.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">View week</label><select id="weekSelect" class="select">${Array.from({length:WEEKS},(_,i)=>`<option value="${i+1}" ${i+1===state.week?'selected':''}>Week ${i+1}</option>`).join('')}</select></div></div></section>
<div class="section-title">Working weight by week</div><div class="progress-list">${exercises.map(ex=>progressItem(m,ex)).join('')}</div>`}
function progressItem(m,ex){const values=[];for(let w=1;w<=WEEKS;w++){let found=null;for(const d of daysFor(m)){const l=getLog(m,w,d,ex[0]);if(l){const mt=metrics(l,ex);found=mt.top||l.workingWeight||0;break}}values.push(found||0)}const best=Math.max(0,...values);return `<article class="progress-item"><div class="top"><div class="exercise-name">${esc(ex[0])}</div><div class="muted">Best ${best||'—'} lb</div></div><div class="mini-grid">${values.map((v,i)=>`<div class="week-chip ${i+1===state.week?'active':''}"><div class="w">W${i+1}</div><div class="v">${v||'—'}</div></div>`).join('')}</div></article>`}


function volumeView(){const m=state.member,w=state.week,plan=programFor(m),planned=Volume.programmedVolume(plan,MUSCLE_MAP),done=Volume.completedVolume(state.logs,plan,MUSCLE_MAP,m,w);const shoulderParts=['Delts','Front Delts','Side Delts','Rear Delts'];const shoulderProgram=shoulderParts.reduce((n,x)=>n+(planned[x]||0),0);const shoulderDone=shoulderParts.reduce((n,x)=>n+(done[x]||0),0);const muscles=Object.keys(planned).sort((a,b)=>planned[b]-planned[a]);return `<section class="hero"><h2>${esc(m)} · Weekly Volume</h2><p>Weighted sets: prime mover 1.0 · secondary muscle 0.5 · isolation target 1.0.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Week</label><select id="weekSelect" class="select">${Array.from({length:WEEKS},(_,i)=>`<option value="${i+1}" ${i+1===w?'selected':''}>Week ${i+1}</option>`).join('')}</select></div></div></section><div class="info">MV &lt;6 · MEV 6–&lt;10 · MAV 10–20 · MRV &gt;20 weighted sets/week. These are guideposts, not individual recovery limits.</div><div class="section-title">Programmed vs completed</div><div class="volume-card volume-row"><b>Shoulders — Total</b><div class="volume-number">${shoulderProgram.toFixed(1)}</div><div class="volume-number">${shoulderDone.toFixed(1)}</div><div class="volume-status ${Volume.classifyVolume(shoulderProgram)}">${Volume.classifyVolume(shoulderProgram)}</div></div><div class="info">Shoulder total combines general delts plus front, side, and rear-delt weighted credits. Individual rows remain below for detail.</div><div class="volume-card volume-row volume-head"><div>Muscle</div><div>Program</div><div>Done</div><div>Zone</div></div>${muscles.map(x=>`<div class="volume-card volume-row"><b>${x}</b><div class="volume-number">${planned[x].toFixed(1)}</div><div class="volume-number">${(done[x]||0).toFixed(1)}</div><div class="volume-status ${Volume.classifyVolume(planned[x])}">${Volume.classifyVolume(planned[x])}</div></div>`).join('')}`;}

function macrosView(){
  const m=state.member,n=nutritionState(m),date=document.getElementById('macroDate')?.value||todayKey(),d=n.days[date]||{protein:'',fat:'',carbs:'',weight:'',dayType:'training'},base=n.targets, snapshot=d.targetSnapshot||base;
  const goal={protein:Number(snapshot.protein)||0,fat:Number(snapshot.fat)||0,carbs:Math.max(0,(Number(snapshot.carbs)||0)-(d.dayType==='rest'?(Number(snapshot.restCarbOffset)||0):0))};
  const used={protein:Number(d.protein)||0,fat:Number(d.fat)||0,carbs:Number(d.carbs)||0}, rem=Nutrition.remaining(goal,used), trend=Nutrition.weightTrend(Object.entries(n.days).map(([date,x])=>({date,weight:x.weight}))), rec=Nutrition.recommendation(trend.rate,trend.days);
  const hist=n.history.slice(-6).reverse(), dayLabel=date===todayKey()?'Today':date;
  const recent=Object.entries(n.days).filter(([k,v])=>v&&(['protein','fat','carbs','weight'].some(key=>String(v[key]??'').trim()!==''))).sort(([a],[b])=>b.localeCompare(a)).slice(0,10);
  return `<section class="hero"><h2>${esc(m)} · Macros</h2><p>Calories are calculated from macro grams: protein/carbs × 4, fat × 9.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Date</label><input id="macroDate" class="input" type="date" max="${todayKey()}" value="${date}"></div><div><label class="field-label">Day type</label><select id="dayType" class="select"><option value="training" ${d.dayType!=='rest'?'selected':''}>Training day</option><option value="rest" ${d.dayType==='rest'?'selected':''}>Rest day</option></select></div></div></section>
  <div class="section-title">${esc(dayLabel)} · Targets</div><article class="macro-card"><div class="macro-grid"><div><label class="field-label">Protein g</label><input id="targetProtein" class="input" type="number" value="${snapshot.protein}"></div><div><label class="field-label">Fat g</label><input id="targetFat" class="input" type="number" value="${snapshot.fat}"></div><div><label class="field-label">Carbs g</label><input id="targetCarbs" class="input" type="number" value="${snapshot.carbs}"></div><div><label class="field-label">Rest carb reduction</label><input id="restOffset" class="input" type="number" value="${snapshot.restCarbOffset||40}"></div><div><label class="field-label">Calories</label><div class="macro-big">${Nutrition.calories(goal)}</div></div></div><div class="action-row" style="margin-top:12px"><button class="secondary" id="saveTargets">Save targets for this day</button></div></article>
  <div class="section-title">${esc(dayLabel)} · Log</div><article class="macro-card"><div class="macro-grid"><div><label class="field-label">Protein eaten</label><input id="usedProtein" class="input" type="number" value="${d.protein}"></div><div><label class="field-label">Fat eaten</label><input id="usedFat" class="input" type="number" value="${d.fat}"></div><div><label class="field-label">Carbs eaten</label><input id="usedCarbs" class="input" type="number" value="${d.carbs}"></div><div><label class="field-label">Morning weight lb</label><input id="scaleWeight" class="input" type="number" step="0.1" value="${d.weight}"></div></div><table class="macro-table"><tr><th>Macro</th><th>Goal</th><th>Used</th><th>Left</th></tr><tr><td>Protein</td><td>${goal.protein}g</td><td>${used.protein}g</td><td>${rem.protein}g</td></tr><tr><td>Fat</td><td>${goal.fat}g</td><td>${used.fat}g</td><td>${rem.fat}g</td></tr><tr><td>Carbs</td><td>${goal.carbs}g</td><td>${used.carbs}g</td><td>${rem.carbs}g</td></tr><tr><td><b>Calories</b></td><td><b>${Nutrition.calories(goal)}</b></td><td><b>${Nutrition.calories(used)}</b></td><td><b>${rem.calories}</b></td></tr></table><div class="action-row" style="margin-top:12px"><button class="primary" id="saveMacros">Save ${esc(dayLabel)}</button></div></article>
  <div class="section-title">Recent macro days</div><article class="macro-card">${recent.length?recent.map(([k,v])=>`<button class="history-row macro-history-btn" data-macro-date="${k}"><b>${k}</b><span>${v.dayType==='rest'?'Rest':'Training'}</span><span>${v.protein||0}P</span><span>${v.fat||0}F</span><span>${v.carbs||0}C</span></button>`).join(''):'<div class="muted">No macro days logged yet.</div>'}</article>
  <div class="section-title">Scale trend</div><article class="macro-card"><div class="macro-grid"><div><div class="field-label">7-day average</div><div class="macro-big">${trend.currentAvg?trend.currentAvg.toFixed(1):'—'}</div></div><div><div class="field-label">Weekly change</div><div class="macro-big">${trend.days>=14?(trend.rate>=0?'+':'')+trend.rate.toFixed(2):'—'}</div></div></div><div class="recommend"><b>${rec.label}</b><div class="muted" style="margin-top:4px">${rec.detail}</div></div>${rec.action==='increase'?'<div class="action-row" style="margin-top:10px"><button class="secondary" data-adjust="25">Apply +25g carbs</button><button class="secondary" data-adjust="38">Apply +38g carbs</button></div>':rec.action==='decrease'?'<div class="action-row" style="margin-top:10px"><button class="secondary" data-adjust="-30">Apply -30g carbs</button><button class="secondary" data-adjust="-40">Apply -40g carbs</button></div>':''}</article>
  <div class="section-title">Target history</div><article class="macro-card">${hist.length?hist.map(h=>`<div class="history-row"><b>${h.date}</b><span>${h.protein}P</span><span>${h.fat}F</span><span>${h.carbs}C</span><span>${Nutrition.calories(h)}</span></div>`).join(''):'<div class="muted">Adjustments will appear here.</div>'}</article>`;
}

function saveMacroDay(){const n=nutritionState(state.member),date=document.getElementById('macroDate')?.value||todayKey(),old=n.days[date]||{},snapshot=old.targetSnapshot||{...n.targets};n.days[date]={...old,protein:document.getElementById('usedProtein').value,fat:document.getElementById('usedFat').value,carbs:document.getElementById('usedCarbs').value,weight:document.getElementById('scaleWeight').value,dayType:document.getElementById('dayType').value,targetSnapshot:snapshot};saveState();toast(`Macros saved for ${date}`);render()}
function saveMacroTargets(){const n=nutritionState(state.member),date=document.getElementById('macroDate')?.value||todayKey(),newTargets={protein:Number(document.getElementById('targetProtein').value)||0,fat:Number(document.getElementById('targetFat').value)||0,carbs:Number(document.getElementById('targetCarbs').value)||0,restCarbOffset:Number(document.getElementById('restOffset').value)||0};n.days[date]=Object.assign(n.days[date]||{}, {targetSnapshot:{...newTargets}});n.targets={...newTargets};saveState();toast(`Targets saved for ${date}`);render()}
function applyMacroAdjustment(delta){const n=nutritionState(state.member),t=n.targets;n.history.push({date:todayKey(),protein:t.protein,fat:t.fat,carbs:t.carbs,note:`Carbs ${delta>0?'+':''}${delta}g`});t.carbs=Math.max(0,Number(t.carbs)+delta);saveState();toast('Macro target adjusted');render()}


function cardioState(member){state.cardio=state.cardio||{};return state.cardio[member]||(state.cardio[member]={days:{}});}
function cardioDatesForLast7(){const out=[];const base=new Date();for(let i=0;i<7;i++){const d=new Date(base);d.setDate(base.getDate()-i);out.push(d.toISOString().slice(0,10));}return out;}
function cardioView(){
  const m=state.member,c=cardioState(m),date=todayKey(),today=c.days[date]||Cardio.blankEntry(),summary=Cardio.weekSummary(c.days,cardioDatesForLast7()),history=Cardio.recentHistory(c.days,7);
  return `<section class="hero"><h2>${esc(m)} · Cardio</h2><p>Log cardio sessions without changing your lifting or macro targets.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Date</label><input id="cardioDate" class="input" type="date" value="${date}"></div></div></section>
  <div class="section-title">Log cardio</div><article class="macro-card"><div class="macro-grid"><div><label class="field-label">Activity</label><select id="cardioActivity" class="select">${['Walking','Treadmill','Incline treadmill','Running','Cycling','Stairmaster','Elliptical','Rowing','Other'].map(x=>`<option ${x===today.activity?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Intensity</label><select id="cardioIntensity" class="select">${['Easy','Moderate','Hard'].map(x=>`<option ${x===today.intensity?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Duration min</label><input id="cardioDuration" class="input" type="number" min="0" step="1" value="${today.duration||''}"></div><div><label class="field-label">Distance</label><input id="cardioDistance" class="input" type="number" min="0" step="0.1" value="${today.distance||''}" placeholder="optional"></div><div><label class="field-label">Calories</label><input id="cardioCalories" class="input" type="number" min="0" step="1" value="${today.calories||''}" placeholder="optional"></div></div><div class="action-row" style="margin-top:12px"><button class="primary" id="saveCardio">Save cardio</button><button class="secondary" id="clearCardio">Clear day</button></div></article>
  <div class="section-title">Last 7 days</div><div class="macro-grid"><article class="macro-card"><div class="field-label">Sessions</div><div class="macro-big">${summary.sessions}</div></article><article class="macro-card"><div class="field-label">Minutes</div><div class="macro-big">${summary.minutes}</div></article><article class="macro-card"><div class="field-label">Distance</div><div class="macro-big">${summary.distance||'—'}</div></article></div>
  <div class="section-title">Cardio history</div><article class="macro-card">${history.length?history.map(x=>`<div class="history-row"><b>${x.date}</b><span>${esc(x.activity||'—')}</span><span>${x.duration||0} min</span><span>${x.distance?x.distance+' mi':'—'}</span><span>${x.calories?x.calories+' cal':'—'}</span></div>`).join(''):'<div class="muted">No cardio logged yet.</div>'}</article>`;
}
function cardioDateValues(){return {date:document.getElementById('cardioDate').value||todayKey(),activity:document.getElementById('cardioActivity').value,intensity:document.getElementById('cardioIntensity').value,duration:document.getElementById('cardioDuration').value,distance:document.getElementById('cardioDistance').value,calories:document.getElementById('cardioCalories').value};}
function saveCardio(){const c=cardioState(state.member),x=cardioDateValues();if(!x.duration){toast('Enter cardio duration');return;}c.days[x.date]={activity:x.activity,intensity:x.intensity,duration:x.duration,distance:x.distance,calories:x.calories};saveState();toast('Cardio saved');render()}
function clearCardio(){const c=cardioState(state.member),date=document.getElementById('cardioDate').value||todayKey();delete c.days[date];saveState();toast('Cardio cleared');render()}

function plateBarFor(exercise){state.plateBars=state.plateBars||{};return Number(state.plateBars[exercise])||45;}
function savePlateBar(exercise,start){if(!exercise)return;state.plateBars=state.plateBars||{};state.plateBars[exercise]=Number(start)||45;saveState();}
function plateBreakdown(target,start){
  const exact=window.BarbarianPlates.platesPerSide(target,start); const result=exact?{total:Number(target),plates:exact}:window.BarbarianPlates.closestLoad(target,start);
  if(!result)return '<div class="empty">No load available.</div>';
  const counts={};result.plates.forEach(x=>counts[x]=(counts[x]||0)+1);
  const rows=Object.entries(counts).sort((a,b)=>Number(b[0])-Number(a[0])).map(([p,n])=>`<div class="plate-chip"><b>${n} × ${p} lb</b><span>per side</span></div>`).join('');
  const note=exact?'':`<div class="info" style="margin-top:10px">Exact load unavailable. Closest load: <b>${result.total} lb</b>.</div>`;
  return `<div class="plate-total">${result.total} <span>lb total</span></div><div class="plate-side-title">Per side</div><div class="plate-stack">${rows||'<div class="plate-chip"><b>No plates</b><span>starting weight only</span></div>'}</div><div class="muted plate-math">${start} lb starting weight + ${Math.max(0,result.total-start)} lb plates = ${result.total} lb</div>${note}`;
}
function plateControls(target,start,exercise='',modal=false){
  const presets=[20,35,45,167];
  return `<div class="plate-controls"><label class="field-label">Bar / starting weight</label><div class="bar-presets">${presets.map(x=>`<button class="${Number(start)===x?'active':''}" data-bar-preset="${x}">${x}${x===167?' Leg Press':''}</button>`).join('')}<button class="${!presets.includes(Number(start))?'active':''}" data-bar-custom>Custom</button></div><div class="custom-bar ${presets.includes(Number(start))?'hidden':''}"><label class="field-label">Custom starting weight</label><input class="input" id="customBarWeight${modal?'Modal':''}" type="number" step="0.5" min="0" value="${start}"></div><label class="field-label" style="margin-top:14px">Target weight</label><div class="plate-target-row"><button class="secondary" data-plate-step="-5">−5</button><input class="input plate-target-input" type="number" min="0" step="5" value="${target}"><button class="secondary" data-plate-step="5">+5</button></div><input class="plate-slider" type="range" min="${Math.max(0,Number(start))}" max="1000" step="5" value="${Math.max(Number(start),Number(target)||Number(start))}"><div class="plate-result">${plateBreakdown(target,start)}</div></div>`;
}
function platesView(){return `<section class="hero"><h2>Plate Counter</h2><p>Select the bar or machine starting weight, then choose your target. Plate counts are shown per side.</p></section><article class="macro-card">${plateControls(plateTarget,plateStart)}</article><div class="info" style="margin-top:12px">Available plates: 45 · 25 · 10 · 5 · 2.5 lb. Custom starting weights are supported.</div>`;}
function openPlateDialog(exercise,target){const dlg=document.getElementById('plateDialog');const start=plateBarFor(exercise);dlg.dataset.exercise=exercise;dlg.innerHTML=`<div class="plate-dialog-head"><div><div class="field-label">${esc(exercise)}</div><h3>Plate Counter</h3></div><button class="icon-btn" data-close-plates>×</button></div>${plateControls(Number(target)||start,start,exercise,true)}`;bindPlateControls(dlg,exercise,true);dlg.querySelector('[data-close-plates]').onclick=()=>dlg.close();dlg.showModal();}
function bindPlateControls(root,exercise='',modal=false){
  const target=root.querySelector('.plate-target-input'), slider=root.querySelector('.plate-slider'), result=root.querySelector('.plate-result'); let start=Number(root.querySelector('[data-bar-preset].active')?.dataset.barPreset)||Number(root.querySelector('.custom-bar input')?.value)||45;
  const redraw=()=>{let t=Number(target.value)||start;if(t<start)t=start;target.value=t;slider.min=start;slider.value=t;result.innerHTML=plateBreakdown(t,start);if(!modal){plateTarget=t;plateStart=start;}if(exercise)savePlateBar(exercise,start);};
  root.querySelectorAll('[data-bar-preset]').forEach(b=>b.onclick=()=>{start=Number(b.dataset.barPreset);root.querySelectorAll('.bar-presets button').forEach(x=>x.classList.remove('active'));b.classList.add('active');root.querySelector('.custom-bar').classList.add('hidden');redraw();});
  const custom=root.querySelector('[data-bar-custom]');custom.onclick=()=>{root.querySelectorAll('.bar-presets button').forEach(x=>x.classList.remove('active'));custom.classList.add('active');root.querySelector('.custom-bar').classList.remove('hidden');start=Number(root.querySelector('.custom-bar input').value)||45;redraw();};
  const ci=root.querySelector('.custom-bar input');ci.oninput=()=>{start=Number(ci.value)||0;redraw();};
  target.oninput=redraw;slider.oninput=()=>{target.value=slider.value;redraw();};root.querySelectorAll('[data-plate-step]').forEach(b=>b.onclick=()=>{target.value=Math.max(start,(Number(target.value)||start)+Number(b.dataset.plateStep));redraw();});
}

function settingsView(){return `<section class="hero"><h2>Settings & backups</h2><p>This PWA stores workout entries on the device in local storage. Export a backup before changing phones.</p></section><div class="section-title">Program</div><article class="progress-item"><div class="top"><div><div class="exercise-name">Customize the program</div><div class="muted">Choose exercises, sets, and rep ranges by member and day.</div></div><button class="secondary" data-route="program">Edit Program</button></div></article><div class="section-title">Group</div><div class="progress-list"><article class="progress-item"><div class="top"><div><div class="exercise-name">Members</div><div class="muted">David · Dan · Jason · Vinjo</div></div><div>4</div></div></article><article class="progress-item"><div class="top"><div><div class="exercise-name">Plan</div><div class="muted">12 weeks · Monday, Tuesday, Thursday, Friday${state.member==='David'?' · Sunday specialization':''}</div></div><div>12</div></div></article></div><div class="section-title">Double progression</div><div class="info">When every target set reaches the top of its rep range, the next session automatically suggests +5 lb. Assisted Chin-Ups instead reduce assistance by 5 lb.</div><div class="action-row" style="margin-top:14px"><button class="primary" data-action="export">Export backup</button><button class="secondary" data-action="import">Import backup</button></div>`}

function bind(){
  const m=document.getElementById('memberSelect'); if(m)m.onchange=()=>{state.member=m.value;saveState();editing=null;render()};
  const w=document.getElementById('weekSelect'); if(w)w.onchange=()=>{state.week=Number(w.value);editing=null;render()};
  const ed=document.getElementById('editorDay'); if(ed)ed.onchange=()=>{state.editorDay=ed.value;render()};
  const sp=document.querySelector('[data-save-program]'); if(sp)sp.onclick=saveProgramChanges;
  document.querySelectorAll('.editor-exercise').forEach(sel=>sel.onchange=()=>{const row=sel.closest('.program-slot');const meta=window.BarbarianExercises.metadata(sel.value);if(!row||!meta)return;row.querySelector('.editor-min').value=meta.min;row.querySelector('.editor-max').value=meta.max;const info=row.querySelector('.muted');if(info)info.textContent=`${meta.type} · ${meta.equipment} · ${meta.primary}${meta.secondary.length?' + '+meta.secondary.join(', '):''}`;});
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{route=b.dataset.route;editing=null;render()});
  document.querySelectorAll('[data-open-day]').forEach(b=>b.onclick=()=>{editing={week:state.week,day:b.dataset.openDay};render()});
  document.querySelectorAll('[data-save-ex]').forEach(b=>b.onclick=()=>saveExercise(b.dataset.saveEx));
  document.querySelectorAll('[data-rest-start]').forEach(b=>b.onclick=()=>startRestTimer(b.dataset.restStart));
  document.querySelectorAll('[data-plate-ex]').forEach(b=>b.onclick=()=>openPlateDialog(b.dataset.plateEx,b.dataset.plateWeight));
  const pc=document.querySelector('.plate-controls');if(pc&&route==='plates')bindPlateControls(document.getElementById('app'));
  document.querySelectorAll('[data-warmup-rest]').forEach(b=>b.onclick=()=>startRestTimer(b.dataset.warmupLabel,Number(b.dataset.warmupRest)));
  renderRestTimerControls();
  const back=document.querySelector('[data-back]');if(back)back.onclick=()=>{editing=null;render()};
  const fin=document.querySelector('[data-finish-workout]');if(fin)fin.onclick=()=>{persistAllVisibleExercises();editing=null;toast('Workout saved');render()};
  document.querySelectorAll('.set-reps,.set-weight').forEach(inp=>{
    const handler=e=>{
      if(e.target.classList.contains('set-weight')) syncFollowingWeights(e.target);
      refreshCardMetrics(e);
    };
    inp.addEventListener('input',handler);
    inp.addEventListener('change',handler);
    inp.addEventListener('blur',handler);
  });
  document.querySelectorAll('[data-note-scope]').forEach(b=>b.onclick=()=>openNoteDialog(b));
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
  const md=document.getElementById('macroDate');if(md)md.onchange=()=>render(); const sm=document.getElementById('saveMacros');if(sm)sm.onclick=saveMacroDay; const st=document.getElementById('saveTargets');if(st)st.onclick=saveMacroTargets; const dt=document.getElementById('dayType');if(dt)dt.onchange=()=>{const n=nutritionState(state.member),date=md?.value||todayKey();n.days[date]=Object.assign(n.days[date]||{}, {dayType:dt.value,targetSnapshot:n.days[date]?.targetSnapshot||{...n.targets}});saveState();render()}; document.querySelectorAll('[data-macro-date]').forEach(b=>b.onclick=()=>{const md=document.getElementById('macroDate');if(md){md.value=b.dataset.macroDate;render()}}); document.querySelectorAll('[data-adjust]').forEach(b=>b.onclick=()=>applyMacroAdjustment(Number(b.dataset.adjust)));  const sc=document.getElementById('saveCardio');if(sc)sc.onclick=saveCardio; const cc=document.getElementById('clearCardio');if(cc)cc.onclick=clearCardio; const cd=document.getElementById('cardioDate');if(cd)cd.onchange=()=>{const c=cardioState(state.member),x=c.days[cd.value]||Cardio.blankEntry();['cardioActivity','cardioIntensity','cardioDuration','cardioDistance','cardioCalories'].forEach(id=>{const el=document.getElementById(id);if(id==='cardioActivity')el.value=x.activity||'Walking'; if(id==='cardioIntensity')el.value=x.intensity||'Moderate'; if(id==='cardioDuration')el.value=x.duration||''; if(id==='cardioDistance')el.value=x.distance||''; if(id==='cardioCalories')el.value=x.calories||'';});}; 
}

function openNoteDialog(button){
  const scope=button.dataset.noteScope, exercise=button.dataset.noteExercise||'', rawSet=button.dataset.noteSet;
  const setIndex=rawSet===''?null:Number(rawSet), dlg=document.getElementById('noteDialog');
  const label=button.dataset.noteLabel||'Note', existing=getNote(scope,state.member,state.week,editing?.day||'',exercise,setIndex);
  dlg.innerHTML=`<div class="note-dialog-head"><div><div class="field-label">${esc(scope)} note</div><h3>${esc(label)}</h3></div><button class="icon-btn" data-note-close aria-label="Close note">×</button></div><textarea id="noteText" class="note-textarea" maxlength="1000" placeholder="Add context for this ${esc(scope)}…">${esc(existing)}</textarea><div class="action-row" style="margin-top:12px"><button class="primary" data-note-save>Save note</button><button class="secondary" data-note-clear>Clear note</button></div>`;
  dlg.querySelector('[data-note-close]').onclick=()=>dlg.close();
  dlg.querySelector('[data-note-save]').onclick=()=>{const value=dlg.querySelector('#noteText').value.trim();state.notes=state.notes||{};const k=noteKey(scope,state.member,state.week,editing?.day||'',exercise,setIndex);if(value)state.notes[k]=value;else delete state.notes[k];saveState();dlg.close();toast('Note saved');render();};
  dlg.querySelector('[data-note-clear]').onclick=()=>{state.notes=state.notes||{};delete state.notes[noteKey(scope,state.member,state.week,editing?.day||'',exercise,setIndex)];saveState();dlg.close();toast('Note cleared');render();};
  dlg.showModal(); setTimeout(()=>dlg.querySelector('#noteText')?.focus(),50);
}

function syncFollowingWeights(input){
  const card=input.closest('.exercise');
  if(!card || !window.BarbarianWeightSync)return;
  const rows=[...card.querySelectorAll('.set-table:not(.header)')];
  const row=input.closest('.set-table');
  const index=rows.indexOf(row);
  if(index<0)return;
  const value=input.value;
  const next=window.BarbarianWeightSync.propagateWeightChange(rows.map(r=>({weight:r.querySelector('.set-weight').value,reps:r.querySelector('.set-reps').value})),index,value);
  next.forEach((set,i)=>{
    const el=rows[i].querySelector('.set-weight');
    if(el && el.value!==set.weight) el.value=set.weight;
  });
}

function readCard(card){const name=card.dataset.exercise;const ex=[...daysFor(state.member).flatMap(d=>programFor(state.member)[d].exercises)].find(x=>x[0]===name);const sets=[...card.querySelectorAll('.set-table:not(.header)')].map(r=>({weight:r.querySelector('.set-weight').value, reps:r.querySelector('.set-reps').value}));const ww=sets.find(s=>s.weight!=='')?.weight||'';return {workingWeight:Number(ww)||0,sets,saved:true};}
function persistAllVisibleExercises(){document.querySelectorAll('[data-save-ex]').forEach(b=>{const card=b.closest('.exercise');if(card){const name=card.dataset.exercise;const log=readCard(card);state.logs[key(state.member,state.week,editing.day,name)]=log;}});saveState()}
function saveExercise(name){const card=document.querySelector(`[data-exercise="${CSS.escape(name)}"]`);if(!card)return;state.logs[key(state.member,state.week,editing.day,name)]=readCard(card);saveState();toast(`${name} saved`);render();}
function refreshCardMetrics(e){const card=e.target.closest('.exercise');if(!card)return;const ex=programFor(state.member)[editing.day].exercises.find(x=>x[0]===card.dataset.exercise);const sets=[...card.querySelectorAll('.set-table:not(.header)')].map(r=>({weight:r.querySelector('.set-weight').value,reps:r.querySelector('.set-reps').value}));const mt=metrics({sets},ex);card.querySelector('.top-val').textContent=mt.top||'—';card.querySelector('.reps-val').textContent=mt.reps||'—';card.querySelector('.volume-val').textContent=mt.volume?Math.round(mt.volume):'—';if(e.target.classList.contains('set-weight')){const quick=card.querySelector('[data-plate-ex]');if(quick){const ww0=sets.find(s=>s.weight!=='')?.weight||0;quick.dataset.plateWeight=ww0;quick.textContent=`🧮 ${ww0?ww0+' lb':'Plates'}`;}const slot=card.querySelector('.warmup-slot');if(slot){const ww=sets.find(s=>s.weight!=='')?.weight||0;slot.innerHTML=warmupView(editing.day,ex,ww);slot.querySelectorAll('[data-warmup-rest]').forEach(b=>b.onclick=()=>startRestTimer(b.dataset.warmupLabel,Number(b.dataset.warmupRest)));}}}
function startRestTimer(exercise,seconds){ if(window.BarbarianRestTimer) window.BarbarianRestTimer.start(exercise, seconds||window.BarbarianRest.DEFAULT_SECONDS); }

function exerciseOptions(selected){
  const lib=window.BarbarianExercises?.all?.()||[];
  const groups={};
  for(const item of lib)(groups[item.category] ||= []).push(item);
  return Object.entries(groups).map(([cat,items])=>`<optgroup label="${esc(cat)}">${items.map(item=>`<option value="${esc(item.name)}" ${item.name===selected?'selected':''}>${esc(item.name)} · ${item.min}–${item.max}</option>`).join('')}</optgroup>`).join('');
}
function programEditorView(){
  const m=state.member, plan=programFor(m), day=state.editorDay||daysFor(m)[0], info=plan[day];
  return `<section class="hero"><h2>Edit Program</h2><p>Each exercise carries its own default rep range, muscle mapping, equipment, and progression style. Exercise history is never deleted when you substitute a movement.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Day</label><select id="editorDay" class="select">${daysFor(m).map(d=>`<option ${d===day?'selected':''}>${d}</option>`).join('')}</select></div></div></section><div class="info">Replacing an exercise changes the current program only. Previous exercise logs remain in your history. A replacement uses its own default rep range and any previous weight history for that exact exercise.</div><div class="program-editor-list">${info.exercises.map((ex,i)=>{const meta=window.BarbarianExercises.metadata(ex[0]);const last=findLastExerciseWeight(m,ex[0]);return `<article class="progress-item program-slot" data-slot="${i}"><div class="field-label">Exercise ${i+1}</div><select class="select editor-exercise">${exerciseOptions(ex[0])}</select><div class="editor-grid"><div><label class="field-label">Sets</label><input class="input editor-sets" type="number" min=1 max=10 value="${ex[1]}"></div><div><label class="field-label">Min reps</label><input class="input editor-min" type="number" min=1 max=50 value="${ex[2]}"></div><div><label class="field-label">Max reps</label><input class="input editor-max" type="number" min=1 max=50 value="${ex[3]}"></div></div><div class="muted" style="margin-top:8px">${meta?`${esc(meta.type)} · ${esc(meta.equipment)} · ${esc(meta.primary)}${meta.secondary.length?' + '+esc(meta.secondary.join(', ')):''}`:'Custom exercise'}${last?` · Last logged ${last} lb`:''}</div></article>`}).join('')}</div><div class="action-row" style="margin-top:14px"><button class="primary" data-save-program>Save Program Changes</button><button class="secondary" data-route="settings">Cancel</button></div><div class="section-title">Exercise Library</div><article class="macro-card">${(window.BarbarianExercises?.all?.()||[]).map(x=>`<div class="history-row"><b>${esc(x.name)}</b><span>${esc(x.category)}</span><span>${x.min}–${x.max}</span><span>${esc(x.equipment)}</span></div>`).join('')}</article>`;
}
function findLastExerciseWeight(member,exercise){
  let best=null;
  for(const k of Object.keys(state.logs||{})){ if(!k.startsWith(member+'|')) continue; if(!k.endsWith('|'+exercise)) continue; const l=state.logs[k]; if(l?.workingWeight) best=Number(l.workingWeight); }
  return best||0;
}
function saveProgramChanges(){
  const m=state.member,day=document.getElementById('editorDay')?.value; if(!day)return;
  const rows=[...document.querySelectorAll('.program-slot')];
  state.programs=state.programs||{}; state.programs[m]=state.programs[m]||{};
  state.programs[m][day]=rows.map(row=>{const name=row.querySelector('.editor-exercise').value; const sets=Math.max(1,Number(row.querySelector('.editor-sets').value)||1); const min=Math.max(1,Number(row.querySelector('.editor-min').value)||1); const max=Math.max(min,Number(row.querySelector('.editor-max').value)||min); return [name,sets,min,max];});
  saveState(); toast(`${m} ${day} program saved`); route='home'; state.editorDay=day; render();
}
function action(a){if(a==='close')document.getElementById('menuDialog').close(); if(a==='export')exportData(); if(a==='import'){document.getElementById('importInput').click();document.getElementById('menuDialog').close()} if(a==='reset'){if(confirm('Reset all local workout data on this device?')){state={member:'David',week:1,logs:{},nutrition:{},cardio:{},programs:{},notes:{}};migratePrograms();saveState();render();toast('Local data reset')}}}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='barbarian-bulk-backup.json';a.click();URL.revokeObjectURL(url);toast('Backup exported')}
document.getElementById('importInput').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.logs||!x.member)throw new Error();state=x;migratePrograms();saveState();route='home';editing=null;render();toast('Backup imported')}catch(err){alert('That file is not a valid Barbarian Bulk backup.')}};r.readAsText(f);});
function renderRestTimerControls(){
  const dock=document.getElementById('restTimerDock'); if(!dock || !window.BarbarianRestTimer)return;
  const t=window.BarbarianRestTimer.state; const active=t.running||t.paused||t.remaining>0;
  dock.classList.toggle('show',active);
  if(!active){dock.innerHTML='';return;}
  const left=t.running?window.BarbarianRest.remainingSeconds(t.endAt):t.remaining;
  const action=t.running?'Pause':'Resume';
  dock.innerHTML=`<div class="rest-dock-head"><div><div class="rest-dock-title">REST · ${esc(t.label||'Between sets')}</div><div class="rest-dock-time">${window.BarbarianRest.formatTime(left)}</div></div><button class="icon-btn rest-reset" aria-label="Reset rest timer">↺</button></div><div class="rest-dock-actions"><button class="secondary" data-rest-adjust="-30">−30 sec</button><button class="secondary" data-rest-toggle>${action}</button><button class="secondary" data-rest-adjust="30">+30 sec</button></div>`;
  dock.querySelector('.rest-reset').onclick=()=>window.BarbarianRestTimer.reset();
  dock.querySelector('[data-rest-toggle]').onclick=()=>t.running?window.BarbarianRestTimer.pause():window.BarbarianRestTimer.resume();
  dock.querySelectorAll('[data-rest-adjust]').forEach(b=>b.onclick=()=>window.BarbarianRestTimer.adjust(Number(b.dataset.restAdjust)));
}

window.BarbarianRestTimer = new window.BarbarianRest.RestTimer();
window.BarbarianRestTimer.onTick = () => renderRestTimerControls();
window.BarbarianRestTimer.onFinish = (label) => { renderRestTimerControls(); toast(`Rest complete${label ? `: ${label}` : ''}`); };

document.getElementById('menuBtn').onclick=()=>document.getElementById('menuDialog').showModal();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
