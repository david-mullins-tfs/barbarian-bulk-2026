const PROGRAM = {
  'Monday': {
    focus:'Squat Focus', exercises:[
      ['Barbell Back Squat',4,6,8],['Lunges',3,10,12],['Leg Press',3,10,12],['Leg Curls',3,12,15]
    ]
  },
  'Tuesday': {
    focus:'Bench Focus', exercises:[
      ['Barbell Bench Press',4,6,8],['Incline Bench',3,8,10],['Pec Deck',3,10,15],['Pullups',3,6,9],['Lateral Raise',2,12,15]
    ]
  },
  'Thursday': {
    focus:'Deadlift Focus', exercises:[
      ['Barbell Deadlift',3,5,7],['RDL',3,8,10],['Leg Curls',3,12,15],['Yes Machine',3,12,15],['No Machine',3,12,15]
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
const {BULK_ID,CUT_ID,CONAN_CUT,DETAILS:PROGRAM_DETAILS,NO_ART:CONAN_NO_ART}=window.AtlasPrograms;
function activeProgramFor(member){return state.activePrograms?.[member]===CUT_ID?CUT_ID:BULK_ID;}
function baseProgramFor(member,programId=BULK_ID){return programId===CUT_ID?CONAN_CUT:member==='David'?Object.assign({},PROGRAM,DAVID_SUNDAY):PROGRAM;}
function programScopeKey(member,...parts){const id=activeProgramFor(member);return (id===BULK_ID?[member,...parts]:[id,member,...parts]).join('|');}
function snapshotId(member,week,day){return programScopeKey(member,week,day);}
function migrateProgramLibrary(){
  state.activePrograms ||= {};
  state.programWeeks ||= {};
  state.programStarts ||= {};
  state.programArchives ||= {};
  state.programVariants ||= {};
  for(const member of MEMBERS){
    state.programWeeks[member] ||= {};
    if(!state.programWeeks[member][BULK_ID])state.programWeeks[member][BULK_ID]=Number(state.week)||1;
  }
  state.week=programWeekFor(state.member);
}
function programWeekFor(member){const id=activeProgramFor(member);return Math.max(1,Math.min(WEEKS,Number(state.programWeeks?.[member]?.[id])||1));}
function selectMember(member){
  if(!MEMBERS.includes(member))return;
  state.programWeeks ||= {};state.programWeeks[state.member] ||= {};
  state.programWeeks[state.member][activeProgramFor(state.member)]=state.week;
  state.member=member;state.week=programWeekFor(member);state.editorWeek=state.week;state.editorDay=daysFor(member)[0];
  editing=null;saveState();render();
}
function selectWeek(week){state.week=Math.max(1,Math.min(WEEKS,Number(week)||1));state.programWeeks ||= {};state.programWeeks[state.member] ||= {};state.programWeeks[state.member][activeProgramFor(state.member)]=state.week;saveState();editing=null;render();}
function activateProgram(member,id,needConfirmation=true){
  if(!MEMBERS.includes(member)||!PROGRAM_DETAILS[id])return false;
  const previous=activeProgramFor(member);if(id===previous)return false;
  if(needConfirmation&&!confirm(`Switch ${member} to ${PROGRAM_DETAILS[id].name}? Existing workouts, notes, nutrition and cardio will be preserved.`))return false;
  state.programWeeks ||= {};state.programWeeks[member] ||= {};state.programStarts ||= {};state.programStarts[member] ||= {};state.programArchives ||= {};state.programArchives[member] ||= {};
  if(member===state.member)state.programWeeks[member][previous]=state.week;
  // Keep each program's nutrition targets separate while preserving dated macro history.
  const nutrition=nutritionState(member);
  state.programNutritionTargets ||= {};state.programNutritionTargets[member] ||= {};
  state.programNutritionTargets[member][previous]={...nutrition.targets};
  const defaults=id===CUT_ID?{protein:0,fat:0,carbs:0,restCarbOffset:0}:{protein:150,fat:75,carbs:370,restCarbOffset:40};
  nutrition.targets={...(state.programNutritionTargets[member][id]||defaults)};
  state.programWeeks[member][id] ||= 1;
  state.activePrograms ||= {};state.activePrograms[member]=id;
  if(!state.programStarts[member][id])state.programStarts[member][id]=todayKey();
  state.programArchives[member][previous]=todayKey();delete state.programArchives[member][id];
  if(member===state.member){state.week=programWeekFor(member);state.editorWeek=state.week;state.editorDay=daysFor(member)[0];editing=null;}
  saveState();return true;
}

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
function migrateEquipmentUpgrade(){
  if(state.equipmentUpgradeV23)return;
  const swaps={Monday:['Squat','Barbell Back Squat'],Tuesday:['Bench','Barbell Bench Press'],Thursday:['Deadlift','Barbell Deadlift']};
  state.programs=state.programs||{};
  for(const member of MEMBERS){
    const mp=state.programs[member]||{};
    for(const [day,[oldName,newName]] of Object.entries(swaps)){
      const rows=mp[day];
      if(Array.isArray(rows)&&rows[0]&&rows[0][0]===oldName) rows[0][0]=newName;
    }
  }
  const historySwaps={'Squat':'Smith Machine Squat','Bench':'Smith Machine Bench Press','Deadlift':'Smith Machine Deadlift'};
  const migratedLogs={};
  for(const [k,v] of Object.entries(state.logs||{})){
    const parts=k.split('|'); const old=parts[3];
    if(historySwaps[old]) parts[3]=historySwaps[old];
    const nk=parts.join('|'); migratedLogs[nk]=migratedLogs[nk]||v;
  }
  state.logs=migratedLogs;
  const migratedNotes={};
  for(const [k,v] of Object.entries(state.notes||{})){
    const parts=k.split('|');
    if(parts[0]==='note' && historySwaps[parts[5]]) parts[5]=historySwaps[parts[5]];
    const nk=parts.join('|'); migratedNotes[nk]=migratedNotes[nk]||v;
  }
  state.notes=migratedNotes;
  state.equipmentUpgradeV23=true;
}
function sessionId(member,week,day,index){return programScopeKey(member,week,day,index);}
function planForSession(member,week){
  const plan=programFor(member);
  const snapshots=state.programSnapshots||{};
  for(const day of Object.keys(plan)){
    const snapshot=snapshots[snapshotId(member,week,day)];
    if(snapshot)plan[day].exercises=cloneExercises(snapshot);
    plan[day].exercises=plan[day].exercises.map((ex,i)=>{
      const replacement=state.sessionSwaps?.[sessionId(member,week,day,i)];
      return replacement? [...replacement]:ex;
    });
  }
  return plan;
}
function isSkipped(member,week,day,index){return !!state.skippedExercises?.[sessionId(member,week,day,index)]}
function snapshotCurrentPrograms(member){
  state.programSnapshots ||= {};
  const plan=programFor(member);
  for(let w=1;w<=state.week;w++)for(const day of Object.keys(plan)){
    const k=[member,w,day].join('|');
    if(!state.programSnapshots[k])state.programSnapshots[k]=cloneExercises(plan[day].exercises);
  }
}
function programFor(member){
  migratePrograms();
  const programId=activeProgramFor(member),base=baseProgramFor(member,programId);
  const out={};
  for(const day of Object.keys(base)){
    const saved=programId===CUT_ID?state.programVariants?.[[member,programId].join('|')]?.[day]||base[day].exercises:state.programs[member]?.[day]||base[day].exercises;
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
migrateEquipmentUpgrade();
migrateProgramLibrary();
saveState();
let route='home'; let editing=null; let plateTarget=135; let plateStart=45;

function loadState(){
  try{const raw=localStorage.getItem(KEY); if(raw) return JSON.parse(raw);}catch(e){}
  return {member:'David',week:1,logs:{},nutrition:{},cardio:{},programs:{},notes:{}};
}
function saveState(){localStorage.setItem(KEY,JSON.stringify(state));}
function nutritionState(member){state.nutrition=state.nutrition||{};return state.nutrition[member]||(state.nutrition[member]={targets:{protein:150,fat:75,carbs:370,restCarbOffset:40},days:{},history:[]});}
function todayKey(){return new Date().toISOString().slice(0,10)}
function key(member,week,day,exercise){return programScopeKey(member,week,day,exercise)}
function noteKey(scope,member,week,day,exercise,setIndex){const id=activeProgramFor(member);return ['note',scope,...(id===BULK_ID?[]:[id]),member,week,day,exercise||'',setIndex==null?'':setIndex].join('|')}
function getNote(scope,member,week,day,exercise,setIndex){return (state.notes||{})[noteKey(scope,member,week,day,exercise,setIndex)]||''}
function hasNote(scope,member,week,day,exercise,setIndex){return !!getNote(scope,member,week,day,exercise,setIndex).trim()}
function noteButton(scope,label,member,week,day,exercise,setIndex,compact=false){const active=hasNote(scope,member,week,day,exercise,setIndex);return `<button class="note-btn ${active?'has-note':''} ${compact?'compact':''}" data-note-scope="${scope}" data-note-label="${esc(label)}" data-note-exercise="${esc(exercise||'')}" data-note-set="${setIndex==null?'':setIndex}" aria-label="${active?'Edit':'Add'} ${esc(label)} note">📝${compact?'':active?' Note ✓':' Note'}</button>`}
function getLog(member,week,day,exercise){return state.logs[key(member,week,day,exercise)] || null}
function targetText(ex){return ex[3]==null?'Each':`${ex[2]}–${ex[3]}`}
function sessionRows(member,week,day,exercise){
  const plan=planForSession(member,week);
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
  if(!prev && week===1 && activeProgramFor(member)===CUT_ID)weight=lastBulkWorkingWeight(member,exercise);
  return {workingWeight:weight,sets:Array.from({length:ex[1]},()=>({weight:weight,reps:''})),saved:false};
}
function lastBulkWorkingWeight(member,exercise){
  let found=0,foundWeek=0;
  for(const [k,log] of Object.entries(state.logs||{})){
    const parts=k.split('|');
    if(parts.length!==4||parts[0]!==member||parts[3]!==exercise)continue;
    const week=Number(parts[1]);
    if(week>=foundWeek && Number(log?.workingWeight)>0){found=Number(log.workingWeight);foundWeek=week;}
  }
  return found;
}
function volumeLogProjection(member,week,plan){
  if(activeProgramFor(member)===BULK_ID)return state.logs;
  const out={};for(const [day,data] of Object.entries(plan))for(const ex of data.exercises){
    const log=getLog(member,week,day,ex[0]);if(log)out[[member,week,day,ex[0]].join('|')]=log;
  }return out;
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
  return planForSession(member,week)[day].exercises.every((ex,i)=>{if(isSkipped(member,week,day,i))return true;const l=getLog(member,week,day,ex[0]); return ex[1]===0 ? true : !!l && l.sets.length===ex[1] && l.sets.every(s=>s.reps!=='');});
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}
function render(){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
  const app=document.getElementById('app'); if(route==='home') app.innerHTML=homeView(); else if(route==='progress') app.innerHTML=progressView(); else if(route==='volume') app.innerHTML=volumeView(); else if(route==='macros') app.innerHTML=macrosView(); else if(route==='cardio') app.innerHTML=cardioView(); else if(route==='plates') app.innerHTML=platesView(); else if(route==='notes') app.innerHTML=notesView(); else if(route==='program') app.innerHTML=programEditorView(); else if(route==='library') app.innerHTML=programLibraryView(); else app.innerHTML=settingsView(); const h=document.querySelector('.header-program');if(h)h.textContent=' / '+PROGRAM_DETAILS[activeProgramFor(state.member)].short;bind();}

function homeView(){
  if(editing) return workoutView(editing.week,editing.day);
  const m=state.member,w=state.week, days=daysFor(m), pct=Math.round((days.filter(d=>dayComplete(m,w,d)).length/days.length)*100);
  return `<section class="hero"><div class="field-label">${esc(PROGRAM_DETAILS[activeProgramFor(m)].name)} · 12 weeks</div><h2>${esc(m)} · Week ${w}</h2><p>Double progression: hit the top of every target set, then the next session moves up ${INCREMENT} lb and returns to the bottom of the range.</p>
    <div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Week</label><select id="weekSelect" class="select">${Array.from({length:WEEKS},(_,i)=>`<option value="${i+1}" ${i+1===w?'selected':''}>Week ${i+1}</option>`).join('')}</select></div></div>
    <div style="margin-top:15px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px"><span>Week completion</span><b>${pct}%</b></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div>
  </section>
  ${activeProgramFor(m)===BULK_ID?'<article class="progress-item" style="margin:14px 0"><div class="field-label">UPCOMING PROGRAM · 12 WEEKS</div><div class="exercise-name">Winter Specialization — Conan Cut</div><p class="muted" style="margin:7px 0">5 training days/week · Fat loss and arms/shoulders specialization · Barbarian Bulk history will be preserved.</p><button class="secondary" data-route="library">View Conan Cut in Program Library</button></article>':''}
  <div class="action-row" style="margin:14px 0"><button class="secondary" data-route="library">⚔️ Program Library</button></div><div class="section-title">Training days</div><div class="day-grid">${days.map(day=>dayCard(m,w,day)).join('')}</div>
  <div class="section-title">Program notes</div><div class="info">Choose a starting weight. Keep that weight until all target sets reach the top of the range. Then add 5 lb next session and start the rep target back at the bottom.</div>`;
}
function dayCard(m,w,day){const plan=planForSession(m,w),done=dayComplete(m,w,day), n=plan[day].exercises.length;return `<button class="day-card" data-open-day="${day}" style="text-align:left"><div class="day-top"><div><div class="day-name">${day}</div><div class="focus">${plan[day].focus} · ${n} exercises</div></div><div class="done-dot ${done?'done':''}"></div></div><div class="action-row" style="margin-top:12px"><span class="secondary" style="display:flex;align-items:center;justify-content:center">${done?'Review':'Start workout'}</span></div></button>`}

function workoutView(week,day){
  const m=state.member, info=planForSession(m,week)[day];
  return `<div class="workout-head"><div><button class="back" data-back>← Back</button><h2 style="margin-top:14px">${day} · Week ${week}</h2><p>${esc(info.focus)}</p></div>${noteButton('workout',day+' workout',m,week,day)}</div>
    ${info.exercises.map((ex,i)=>isSkipped(m,week,day,i)?`<article class="exercise skipped-exercise"><div class="exercise-head"><div><div class="exercise-name">${esc(ex[0])}</div><div class="muted">Skipped for this workout</div></div><button class="secondary" data-unskip="${i}">Restore</button></div></article>`:exerciseCard(m,week,day,ex,i)).join('')}
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

function exerciseArt(name){if(CONAN_NO_ART.has(name))return './exercise-art/atlas-movement-placeholder.svg';return './exercise-art/'+String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.svg';}
const ATLAS_PILOT = {
  'Pec Deck': {art:'pec-deck', cues:['Adjust the seat so handles align near mid-chest.','Keep your back supported and feet planted.','Bring the handles together smoothly; avoid shrugging.','Return slowly within a comfortable range.'],positions:['Start: seated, chest up, arms open.','Finish: seated, handles together in front of chest.']},
  'Barbell Bench Press': {art:'barbell-bench-press', cues:['Lie on a flat bench with feet planted.','Set your shoulder blades firmly against the bench.','Lower the bar with control toward the chest.','Press upward while staying supported on the bench.'],positions:['Start: lying on the flat bench, bar near chest.','Finish: still lying on the flat bench, arms extended.']},
  'Barbell Back Squat': {art:'barbell-back-squat', cues:['Place the bar securely across your upper back.','Start upright with feet about shoulder width.','Brace and descend under control to a comfortable depth.','Stand by driving through the whole foot.'],positions:['Start: standing upright, bar across upper back.','Finish illustration: bottom of squat, bar remains on upper back.']}
};
function openExerciseDetail(name){
  const meta=window.BarbarianExercises?.metadata(name);
  const dlg=document.getElementById('exerciseDetailDialog'); if(!dlg)return;
  const muscles=meta?[meta.primary,...(meta.secondary||[])].join(' · '):'Not categorized';
  const range=meta?`${meta.min}–${meta.max} reps`:'See programmed sets';
  const pilot=ATLAS_PILOT[name];
  const pilotArt=pilot?`./exercise-art/${pilot.art}-pilot.webp`:exerciseArt(name);
  const guide=pilot?`<div class="atlas-pilot-positions">${pilot.positions.map((t,i)=>`<div><small>${i?'FINISH':'START'}</small><img class="atlas-position-art" src="./exercise-art/${pilot.art}-${i?'finish':'start'}-v32.webp" alt="${esc(name)} ${i?'finish':'start'} position illustration"><span>${esc(t)}</span></div>`).join('')}</div><div class="atlas-pilot-cues"><small>TECHNIQUE & SETUP</small><ul>${pilot.cues.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`:'';
  dlg.innerHTML=`<div class="atlas-detail-top"><div><div class="exercise-index">ATLAS MOVEMENT LIBRARY ${pilot?'· ILLUSTRATION PILOT V32':''}</div><h2>${esc(name)}</h2></div><button type="button" class="icon-btn" data-detail-close aria-label="Close details">×</button></div><img class="atlas-detail-art" src="${pilotArt}" alt="Vintage illustration of ${esc(name)}"><div class="atlas-detail-grid"><div><small>PRIMARY / SECONDARY</small><strong>${esc(muscles)}</strong></div><div><small>DEFAULT TARGET</small><strong>${range}</strong></div><div><small>EQUIPMENT</small><strong>${esc(meta?.equipment||'See exercise')}</strong></div></div>${guide}<p class="atlas-detail-note">${pilot?'Pilot illustration: visual reference only, not a verified coaching diagram. Follow qualified instruction and your equipment’s guidance.':'Illustration is a stylized movement reference, not a technical coaching diagram. Use a controlled range of motion and adjust setup to your equipment and comfort.'}</p>`;
  dlg.querySelector('[data-detail-close]').onclick=()=>dlg.close();
  dlg.showModal();
}
function exerciseCard(m,w,day,ex,index=0){
  if(ex[1]===0) return `<article class="exercise"><div class="exercise-head"><div><div class="exercise-name">${esc(ex[0])}</div><div class="range">Each</div></div></div><p class="muted" style="margin:12px 0 0">Accessory/superset note from the original program.</p></article>`;
  const log=sessionRows(m,w,day,ex[0]); const mt=metrics(log,ex); const suggested=log.workingWeight||0; const isSaved=getLog(m,w,day,ex[0]);
  const loggedCount=log.sets.filter(s=>s.reps!=='' && s.reps!=null && Number(s.reps)>0).length;
  const status=loggedCount>=ex[1]?'complete':loggedCount>0?'active':'ready';
  const superset=(day==='Friday' && (ex[0]==='EZ Curl'||ex[0]==='Triceps Pushdown'))?'<span class="superset-badge">SUPERSET A</span>':'';
  return `<article class="exercise exercise-${status}" data-exercise="${esc(ex[0])}"><div class="exercise-head"><button type="button" class="exercise-illustration" data-exercise-detail="${esc(ex[0])}" aria-label="View ${esc(ex[0])} exercise details"><img src="${ATLAS_PILOT[ex[0]]?`./exercise-art/${ATLAS_PILOT[ex[0]].art}-pilot.webp`:exerciseArt(ex[0])}" alt="${esc(ex[0])} movement illustration" loading="lazy" width="110" height="88"></button><div class="exercise-heading"><div class="exercise-index">EXERCISE ${String(index+1).padStart(2,'0')} · ${status==='complete'?'COMPLETE':status==='active'?'IN PROGRESS':'READY'}</div><div class="exercise-name">${esc(ex[0])}</div><div class="range">${targetText(ex)} reps · ${isSaved?'saved':'ready to log'} ${superset}</div></div><button class="plate-quick" data-plate-ex="${esc(ex[0])}" data-plate-weight="${suggested||''}" aria-label="Plate count for ${esc(ex[0])}">🧮 ${suggested?suggested+' lb':'Plates'}</button>${mt.ready?(ex[0]==='Assisted Chin-Ups'?'<span class="add-badge">REDUCE 5 LB ASSISTANCE</span>':'<span class="add-badge">ADD 5 LB NEXT</span>'):'<span class="keep-badge">KEEP WEIGHT</span>'}</div>
    <details class="exercise-more"><summary aria-label="Exercise options for ${esc(ex[0])}" title="Exercise options">••• <span>Options</span></summary><div class="exercise-actions"><button type="button" class="secondary" data-swap-slot="${index}">⇄ Swap exercise</button><button type="button" class="secondary" data-skip-slot="${index}">▷ Skip for today</button></div></details>
    <div class="warmup-slot"><details class="warmup-disclosure"><summary>Warm-up <span>· Tap to view</span></summary>${warmupView(day,ex,suggested)}</details></div>
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


function volumeView(){const m=state.member,w=state.week,plan=planForSession(m,w);for(const day of Object.keys(plan))plan[day].exercises=plan[day].exercises.filter((_,i)=>!isSkipped(m,w,day,i));const planned=Volume.programmedVolume(plan,MUSCLE_MAP),done=Volume.completedVolume(volumeLogProjection(m,w,plan),plan,MUSCLE_MAP,m,w);const shoulderParts=['Delts','Front Delts','Side Delts','Rear Delts'];const shoulderProgram=shoulderParts.reduce((n,x)=>n+(planned[x]||0),0);const shoulderDone=shoulderParts.reduce((n,x)=>n+(done[x]||0),0);const muscles=Object.keys(planned).sort((a,b)=>planned[b]-planned[a]);return `<section class="hero"><h2>${esc(m)} · Weekly Volume</h2><p>Weighted sets: prime mover 1.0 · secondary muscle 0.5 · isolation target 1.0.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Week</label><select id="weekSelect" class="select">${Array.from({length:WEEKS},(_,i)=>`<option value="${i+1}" ${i+1===w?'selected':''}>Week ${i+1}</option>`).join('')}</select></div></div></section><div class="info">MV &lt;6 · MEV 6–&lt;10 · MAV 10–20 · MRV &gt;20 weighted sets/week. These are guideposts, not individual recovery limits.</div><div class="section-title">Programmed vs completed</div><div class="volume-card volume-row"><b>Shoulders — Total</b><div class="volume-number">${shoulderProgram.toFixed(1)}</div><div class="volume-number">${shoulderDone.toFixed(1)}</div><div class="volume-status ${Volume.classifyVolume(shoulderProgram)}">${Volume.classifyVolume(shoulderProgram)}</div></div><div class="info">Shoulder total combines general delts plus front, side, and rear-delt weighted credits. Individual rows remain below for detail.</div><div class="volume-card volume-row volume-head"><div>Muscle</div><div>Program</div><div>Done</div><div>Zone</div></div>${muscles.map(x=>`<div class="volume-card volume-row"><b>${x}</b><div class="volume-number">${planned[x].toFixed(1)}</div><div class="volume-number">${(done[x]||0).toFixed(1)}</div><div class="volume-status ${Volume.classifyVolume(planned[x])}">${Volume.classifyVolume(planned[x])}</div></div>`).join('')}`;}

function macrosView(){
  const m=state.member,n=nutritionState(m),date=document.getElementById('macroDate')?.value||todayKey(),d=n.days[date]||{protein:'',fat:'',carbs:'',weight:'',dayType:'training'},base=n.targets, snapshot=d.targetSnapshot||base;
  const goal={protein:Number(snapshot.protein)||0,fat:Number(snapshot.fat)||0,carbs:Math.max(0,(Number(snapshot.carbs)||0)-(d.dayType==='rest'?(Number(snapshot.restCarbOffset)||0):0))};
  const cut=activeProgramFor(m)===CUT_ID;
  const used={protein:Number(d.protein)||0,fat:Number(d.fat)||0,carbs:Number(d.carbs)||0}, rem=Nutrition.remaining(goal,used), trend=Nutrition.weightTrend(Object.entries(n.days).map(([date,x])=>({date,weight:x.weight}))), rec=cut?{label:'Cut phase — individualized targets',detail:'Review weight trend, strength and recovery. Calorie adjustments should reflect your chosen deficit and current progress.',action:'none'}:Nutrition.recommendation(trend.rate,trend.days);
  const hist=n.history.slice(-6).reverse(), dayLabel=date===todayKey()?'Today':date;
  const recent=Object.entries(n.days).filter(([k,v])=>v&&(['protein','fat','carbs','weight'].some(key=>String(v[key]??'').trim()!==''))).sort(([a],[b])=>b.localeCompare(a)).slice(0,10);
  return `<section class="hero"><h2>${esc(m)} · Macros</h2><p>Calories are calculated from macro grams: protein/carbs × 4, fat × 9.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Date</label><input id="macroDate" class="input" type="date" max="${todayKey()}" value="${date}"></div><div><label class="field-label">Day type</label><select id="dayType" class="select"><option value="training" ${d.dayType!=='rest'?'selected':''}>Training day</option><option value="rest" ${d.dayType==='rest'?'selected':''}>Rest day</option></select></div></div></section>
  ${cut&&!(Number(n.targets.protein)||Number(n.targets.fat)||Number(n.targets.carbs))?'<div class="info">Conan Cut nutrition targets have not been set. Enter your individualized calorie-deficit protein, fat and carbohydrate goals before using the target dashboard; past macro entries retain their original date-based targets.</div>':''}
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

function plateBarFor(exercise){state.plateBars=state.plateBars||{};if(Object.prototype.hasOwnProperty.call(state.plateBars,exercise))return Number(state.plateBars[exercise]);const meta=window.BarbarianExercises?.metadata?.(exercise);return meta&&meta.startingResistance!=null?Number(meta.startingResistance):45;}
function savePlateBar(exercise,start){if(!exercise)return;state.plateBars=state.plateBars||{};const n=Number(start);state.plateBars[exercise]=Number.isFinite(n)?n:45;saveState();}
function plateBreakdown(target,start){
  const exact=window.BarbarianPlates.platesPerSide(target,start); const result=exact?{total:Number(target),plates:exact}:window.BarbarianPlates.closestLoad(target,start);
  if(!result)return '<div class="empty">No load available.</div>';
  const counts={};result.plates.forEach(x=>counts[x]=(counts[x]||0)+1);
  const rows=Object.entries(counts).sort((a,b)=>Number(b[0])-Number(a[0])).map(([p,n])=>`<div class="plate-chip"><b>${n} × ${p} lb</b><span>per side</span></div>`).join('');
  const note=exact?'':`<div class="info" style="margin-top:10px">Exact load unavailable. Closest load: <b>${result.total} lb</b>.</div>`;
  return `<div class="plate-total">${result.total} <span>lb total</span></div><div class="plate-side-title">Per side</div><div class="plate-stack">${rows||'<div class="plate-chip"><b>No plates</b><span>starting weight only</span></div>'}</div><div class="muted plate-math">${start} lb starting weight + ${Math.max(0,result.total-start)} lb plates = ${result.total} lb</div>${note}`;
}
function plateControls(target,start,exercise='',modal=false){
  const presets=[0,20,35,45,105,167];
  return `<div class="plate-controls"><label class="field-label">Starting weight / resistance</label><div class="bar-presets">${presets.map(x=>`<button class="${Number(start)===x?'active':''}" data-bar-preset="${x}">${x}${x===105?' Hack Squat':x===167?' Leg Press':''}</button>`).join('')}<button class="${!presets.includes(Number(start))?'active':''}" data-bar-custom>Custom</button></div><div class="custom-bar ${presets.includes(Number(start))?'hidden':''}"><label class="field-label">Custom starting weight / resistance</label><input class="input" id="customBarWeight${modal?'Modal':''}" type="number" step="0.5" min="0" value="${start}"></div><label class="field-label" style="margin-top:14px">Target weight</label><div class="plate-target-row"><button class="secondary" data-plate-step="-5">−5</button><input class="input plate-target-input" type="number" min="0" step="5" value="${target}"><button class="secondary" data-plate-step="5">+5</button></div><input class="plate-slider" type="range" min="${Math.max(0,Number(start))}" max="1000" step="5" value="${Math.max(Number(start),Number(target)||Number(start))}"><div class="plate-result">${plateBreakdown(target,start)}</div></div>`;
}
function platesView(){return `<section class="hero"><h2>Plate Counter</h2><p>Select the bar or machine starting resistance, then choose your target. Plate counts are shown per side.</p></section><article class="macro-card">${plateControls(plateTarget,plateStart)}</article><div class="info" style="margin-top:12px">Available plates: 45 · 25 · 10 · 5 · 2.5 lb. Custom starting weights are supported.</div>`;}
function openPlateDialog(exercise,target){const dlg=document.getElementById('plateDialog');const start=plateBarFor(exercise);dlg.dataset.exercise=exercise;dlg.innerHTML=`<div class="plate-dialog-head"><div><div class="field-label">${esc(exercise)}</div><h3>Plate Counter</h3></div><button class="icon-btn" data-close-plates>×</button></div>${plateControls(Number(target)||start,start,exercise,true)}`;bindPlateControls(dlg,exercise,true);dlg.querySelector('[data-close-plates]').onclick=()=>dlg.close();dlg.showModal();}
function bindPlateControls(root,exercise='',modal=false){
  const target=root.querySelector('.plate-target-input'), slider=root.querySelector('.plate-slider'), result=root.querySelector('.plate-result'); const activePreset=root.querySelector('[data-bar-preset].active'); let start=activePreset?Number(activePreset.dataset.barPreset):(Number(root.querySelector('.custom-bar input')?.value)||45);
  const redraw=()=>{let t=Number(target.value)||start;if(t<start)t=start;target.value=t;slider.min=start;slider.value=t;result.innerHTML=plateBreakdown(t,start);if(!modal){plateTarget=t;plateStart=start;}if(exercise)savePlateBar(exercise,start);};
  root.querySelectorAll('[data-bar-preset]').forEach(b=>b.onclick=()=>{start=Number(b.dataset.barPreset);root.querySelectorAll('.bar-presets button').forEach(x=>x.classList.remove('active'));b.classList.add('active');root.querySelector('.custom-bar').classList.add('hidden');redraw();});
  const custom=root.querySelector('[data-bar-custom]');custom.onclick=()=>{root.querySelectorAll('.bar-presets button').forEach(x=>x.classList.remove('active'));custom.classList.add('active');root.querySelector('.custom-bar').classList.remove('hidden');start=Number(root.querySelector('.custom-bar input').value)||45;redraw();};
  const ci=root.querySelector('.custom-bar input');ci.oninput=()=>{start=Number(ci.value)||0;redraw();};
  target.oninput=redraw;slider.oninput=()=>{target.value=slider.value;redraw();};root.querySelectorAll('[data-plate-step]').forEach(b=>b.onclick=()=>{target.value=Math.max(start,(Number(target.value)||start)+Number(b.dataset.plateStep));redraw();});
}


function notesView(){
  state.noteFilters=state.noteFilters||{q:'',member:'',week:'',day:'',scope:'',exercise:'',program:''}; state.noteFilters.exercise=state.noteFilters.exercise||'';
  const f=state.noteFilters; const rows=[];
  for(const [k,text] of Object.entries(state.notes||{})){
    if(!String(text||'').trim()) continue;
    const parts=k.split('|'); if(parts[0]!=='note') continue;
    const scoped=parts[2]===CUT_ID;
    const [scope,member,week,day,exercise,setIndex]=scoped?[parts[1],parts[3],parts[4],parts[5],parts[6],parts[7]]:[parts[1],parts[2],parts[3],parts[4],parts[5],parts[6]];
    const item={scope,member,program:scoped?CUT_ID:BULK_ID,week:Number(week),day,exercise:exercise||'',setIndex:setIndex===''?null:Number(setIndex),text:String(text)};
    const hay=[item.text,item.scope,item.member,item.day,item.exercise,item.setIndex==null?'':`Set ${item.setIndex+1}`].join(' ').toLowerCase();
    if(f.q && !hay.includes(f.q.toLowerCase())) continue;
    if(f.member && f.member!==item.member) continue;
    if(f.program && f.program!==item.program) continue;
    if(f.week && Number(f.week)!==item.week) continue;
    if(f.day && f.day!==item.day) continue;
    if(f.scope && f.scope!==item.scope) continue;
    if(f.exercise && f.exercise!==item.exercise) continue;
    rows.push(item);
  }
  rows.sort((a,b)=>b.week-a.week || a.member.localeCompare(b.member) || a.day.localeCompare(b.day) || a.exercise.localeCompare(b.exercise));
  const dayOpts=[...new Set([...Object.keys(PROGRAM),...Object.keys(DAVID_SUNDAY),...Object.keys(CONAN_CUT)])].sort();
  const exOpts=[...new Set([...Object.values(PROGRAM),...Object.values(DAVID_SUNDAY),...Object.values(CONAN_CUT)].flatMap(d=>d.exercises.map(x=>x[0])))].sort();
  return `<section class="hero"><h2>Notes</h2><p>Search and filter workout, exercise, and set notes across your training history.</p>
  <div class="notes-search"><input id="noteSearch" class="input" type="search" placeholder="Search notes..." value="${esc(f.q)}"></div>
  <div class="notes-filters"><div><label class="field-label">Program</label><select id="noteProgram" class="select"><option value="">All programs</option>${Object.values(PROGRAM_DETAILS).map(x=>`<option value="${x.id}" ${f.program===x.id?'selected':''}>${esc(x.short)}</option>`).join('')}</select></div><div><label class="field-label">Member</label><select id="noteMember" class="select"><option value="">All members</option>${MEMBERS.map(m=>`<option value="${m}" ${f.member===m?'selected':''}>${m}</option>`).join('')}</select></div>
  <div><label class="field-label">Week</label><select id="noteWeek" class="select"><option value="">All weeks</option>${Array.from({length:WEEKS},(_,i)=>`<option value="${i+1}" ${String(f.week)===String(i+1)?'selected':''}>Week ${i+1}</option>`).join('')}</select></div>
  <div><label class="field-label">Type</label><select id="noteScope" class="select"><option value="">All note types</option><option value="workout" ${f.scope==='workout'?'selected':''}>Workout</option><option value="exercise" ${f.scope==='exercise'?'selected':''}>Exercise</option><option value="set" ${f.scope==='set'?'selected':''}>Set</option></select></div>
  <div><label class="field-label">Day</label><select id="noteDay" class="select"><option value="">All days</option>${dayOpts.map(d=>`<option value="${d}" ${f.day===d?'selected':''}>${d}</option>`).join('')}</select></div><div><label class="field-label">Exercise</label><select id="noteExercise" class="select"><option value="">All exercises</option>${exOpts.map(x=>`<option value="${esc(x)}" ${f.exercise===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div></div>
  <div class="notes-result-summary"><b>${rows.length}</b> ${rows.length===1?'note':'notes'}</div></section>
  <div class="notes-list">${rows.length?rows.map(noteResultCard).join(''):`<div class="info">No notes match these filters.</div>`}</div>`;
}
function noteResultCard(n){
  const target=n.scope==='workout'?`${n.day} workout`:n.exercise+(n.scope==='set'?` · Set ${n.setIndex+1}`:'');
  return `<article class="note-result" data-note-result-program="${n.program}" data-note-result-member="${esc(n.member)}" data-note-result-week="${n.week}" data-note-result-day="${esc(n.day)}" data-note-result-exercise="${esc(n.exercise)}"><div class="note-result-top"><div><span class="note-type">${esc(n.scope)}</span><h3>${esc(target)}</h3></div><div class="note-meta">${esc(n.member)} · ${esc(PROGRAM_DETAILS[n.program].short)} · W${n.week}</div></div><p>${esc(n.text)}</p><button class="secondary" data-open-note-result>Open workout</button></article>`;
}

function programLibraryView(){
  const member=state.member,active=activeProgramFor(member),list=Object.values(PROGRAM_DETAILS);
  const preview=Object.entries(CONAN_CUT).map(([day,data])=>{
    const sets=data.exercises.reduce((sum,ex)=>sum+ex[1],0);
    return `<details class="progress-item"><summary><b>${esc(day)}</b> · ${esc(data.focus)} · ${sets} sets</summary><div style="padding-top:10px">${data.exercises.map((ex,i)=>`<div class="history-row"><b>${i+1}. ${esc(ex[0])}</b><span>${ex[1]} × ${ex[2]}–${ex[3]}</span></div>`).join('')}</div></details>`;
  }).join('');
  return `<section class="hero"><h2>Program Library</h2><p>Each member has an independent 12-week training cycle. Switching programs keeps every workout, note, macro entry, and cardio record intact.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===member?'selected':''}>${x}</option>`).join('')}</select></div></div></section>
  <div class="progress-list">${list.map(program=>{
    const selected=active===program.id,started=!!state.programStarts?.[member]?.[program.id],archived=!!state.programArchives?.[member]?.[program.id];
    const label=selected?'Active':archived?'Archived':started?'Available':'Upcoming';
    const days=program.id===CUT_ID?5:Object.keys(baseProgramFor(member,BULK_ID)).length;
    return `<article class="progress-item"><div class="top"><div><div class="field-label">${label.toUpperCase()} · ${program.weeks} WEEKS</div><div class="exercise-name">${esc(program.name)}</div><div class="muted">${esc(program.goal)} · ${days} training days/week</div></div></div>${selected?'<div class="info">Current program for this member.</div>':`<div class="action-row" style="margin-top:12px"><button class="primary" data-activate-program="${program.id}">${program.id===CUT_ID&&!started?'Start Conan Cut':'Switch to '+esc(program.short)}</button></div>`}</article>`;
  }).join('')}</div><div class="section-title">Conan Cut · Full Draft</div><div class="info">Monday–Friday · 25 exercises · 73 working sets/week. Double progression (start with +5 lb when prescribed sets reach the top of their ranges). Calorie deficit and individualized protein targets to be set separately; no bulk surplus is imported. Preview only: Conan Cut remains upcoming until a member starts it.</div><div class="progress-list">${preview}</div>`;
}
function settingsView(){return `<section class="hero"><h2>Settings & backups</h2><p>This PWA stores workout entries on the device in local storage. Export a backup before changing phones.</p></section><div class="section-title">Program</div><article class="progress-item"><div class="top"><div><div class="exercise-name">Customize the program</div><div class="muted">Choose exercises, sets, and rep ranges by member, week and day for the active program.</div></div><button class="secondary" data-route="program">Edit Program</button></div></article><article class="progress-item"><div class="top"><div><div class="exercise-name">Program Library</div><div class="muted">Barbarian Bulk and Conan Cut · member-specific cycles.</div></div><button class="secondary" data-route="library">View Programs</button></div></article><div class="section-title">Group</div><div class="progress-list"><article class="progress-item"><div class="top"><div><div class="exercise-name">Members</div><div class="muted">David · Dan · Jason · Vinjo</div></div><div>4</div></div></article><article class="progress-item"><div class="top"><div><div class="exercise-name">Plan</div><div class="muted">${WEEKS} weeks · ${daysFor(state.member).join(', ')}</div></div><div>12</div></div></article></div><div class="section-title">Double progression</div><div class="info">When every target set reaches the top of its rep range, the next session automatically suggests +5 lb. Assisted Chin-Ups instead reduce assistance by 5 lb.</div><div class="action-row" style="margin-top:14px"><button class="primary" data-action="export">Export backup</button><button class="secondary" data-action="import">Import backup</button></div>`}

function bind(){
  const m=document.getElementById('memberSelect'); if(m)m.onchange=()=>selectMember(m.value);
  const w=document.getElementById('weekSelect'); if(w)w.onchange=()=>selectWeek(w.value);
  const ed=document.getElementById('editorDay'); if(ed)ed.onchange=()=>{state.editorDay=ed.value;render()};
  const ew=document.getElementById('editorWeek'); if(ew)ew.onchange=()=>{state.editorWeek=Number(ew.value);render()};
  const sp=document.querySelector('[data-save-program]'); if(sp)sp.onclick=saveProgramChanges;
  document.querySelectorAll('[data-activate-program]').forEach(b=>b.onclick=()=>{if(activateProgram(state.member,b.dataset.activateProgram)){route='home';render();toast('Program switched — training history preserved');}});
  document.querySelectorAll('.editor-move').forEach(btn=>btn.onclick=()=>{
    const row=btn.closest('.program-slot'), list=row?.parentElement; if(!list)return;
    const rows=[...list.querySelectorAll('.program-slot')],i=rows.indexOf(row);
    if(btn.dataset.move==='up' && i>0)list.insertBefore(row,rows[i-1]);
    if(btn.dataset.move==='down' && i<rows.length-1)list.insertBefore(rows[i+1],row);
    [...list.querySelectorAll('.program-slot')].forEach((r,n,all)=>{r.querySelector('.field-label').textContent=`Exercise ${n+1}`;r.querySelector('[data-move=up]').disabled=n===0;r.querySelector('[data-move=down]').disabled=n===all.length-1;});
  });
  document.querySelectorAll('.editor-exercise').forEach(sel=>sel.onchange=()=>{const row=sel.closest('.program-slot');const meta=window.BarbarianExercises.metadata(sel.value);if(!row||!meta)return;row.querySelector('.editor-min').value=meta.min;row.querySelector('.editor-max').value=meta.max;const info=row.querySelector('.muted');if(info)info.textContent=`${meta.type} · ${meta.equipment} · ${meta.primary}${meta.secondary.length?' + '+meta.secondary.join(', '):''}`;});
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{route=b.dataset.route;if(route==='program')state.editorWeek=state.week;editing=null;render()});
  document.querySelectorAll('[data-open-day]').forEach(b=>b.onclick=()=>{const day=b.dataset.openDay,k=snapshotId(state.member,state.week,day);state.programSnapshots ||= {};if(!state.programSnapshots[k]){state.programSnapshots[k]=cloneExercises(programFor(state.member)[day].exercises);saveState();}editing={week:state.week,day};render()});
  document.querySelectorAll('[data-save-ex]').forEach(b=>b.onclick=()=>saveExercise(b.dataset.saveEx));
  document.querySelectorAll('[data-exercise-detail]').forEach(b=>b.onclick=()=>openExerciseDetail(b.dataset.exerciseDetail));
  document.querySelectorAll('[data-swap-slot]').forEach(b=>b.onclick=()=>openSwapDialog(Number(b.dataset.swapSlot)));
  document.querySelectorAll('[data-skip-slot]').forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.skipSlot),ex=planForSession(state.member,editing.week)[editing.day].exercises[i];
    if(!confirm(`Skip ${ex[0]} for this workout? The program and prior logs stay unchanged.`))return;
    persistAllVisibleExercises();state.skippedExercises ||= {};state.skippedExercises[sessionId(state.member,editing.week,editing.day,i)]=true;saveState();render();
  });
  document.querySelectorAll('[data-unskip]').forEach(b=>b.onclick=()=>{delete state.skippedExercises[sessionId(state.member,editing.week,editing.day,Number(b.dataset.unskip))];saveState();render()});
  document.querySelectorAll('[data-rest-start]').forEach(b=>b.onclick=()=>startRestTimer(b.dataset.restStart));
  document.querySelectorAll('[data-plate-ex]').forEach(b=>b.onclick=()=>openPlateDialog(b.dataset.plateEx,b.dataset.plateWeight));
  const pc=document.querySelector('.plate-controls');if(pc&&route==='plates')bindPlateControls(document.getElementById('app'));
  document.querySelectorAll('[data-warmup-rest]').forEach(b=>b.onclick=()=>startRestTimer(b.dataset.warmupLabel,Number(b.dataset.warmupRest)));
  renderRestTimerControls();
  const back=document.querySelector('[data-back]');if(back)back.onclick=()=>{editing=null;render()};
  const fin=document.querySelector('[data-finish-workout]');if(fin)fin.onclick=()=>{persistAllVisibleExercises();editing=null;toast('Workout saved');render()};
  document.querySelectorAll('.exercise').forEach(card=>{
    const repFields=[...card.querySelectorAll('.set-reps')];
    repFields.forEach((inp,i)=>{
      inp.setAttribute('enterkeyhint',i===repFields.length-1?'done':'next');
      inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();advanceRepFocus(inp);}});
    });
  });
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
  const nq=document.getElementById('noteSearch'); if(nq) nq.oninput=()=>{state.noteFilters=state.noteFilters||{};state.noteFilters.q=nq.value;const pos=nq.selectionStart||nq.value.length;render();requestAnimationFrame(()=>{const el=document.getElementById('noteSearch');if(el){el.focus();el.setSelectionRange(pos,pos)}})};
  const nprogram=document.getElementById('noteProgram');if(nprogram)nprogram.onchange=()=>{state.noteFilters={...(state.noteFilters||{}),program:nprogram.value};render()};
  const nmember=document.getElementById('noteMember'); if(nmember) nmember.onchange=()=>{state.noteFilters={...(state.noteFilters||{}),member:nmember.value};render()};
  const nweek=document.getElementById('noteWeek'); if(nweek) nweek.onchange=()=>{state.noteFilters={...(state.noteFilters||{}),week:nweek.value};render()};
  const nscope=document.getElementById('noteScope'); if(nscope) nscope.onchange=()=>{state.noteFilters={...(state.noteFilters||{}),scope:nscope.value};render()};
  const nday=document.getElementById('noteDay'); if(nday) nday.onchange=()=>{state.noteFilters={...(state.noteFilters||{}),day:nday.value};render()};
  const nex=document.getElementById('noteExercise'); if(nex) nex.onchange=()=>{state.noteFilters={...(state.noteFilters||{}),exercise:nex.value};render()};
  document.querySelectorAll('[data-open-note-result]').forEach(b=>b.onclick=()=>{
    const card=b.closest('[data-note-result-member]'),member=card.dataset.noteResultMember,program=card.dataset.noteResultProgram;
    selectMember(member);if(activeProgramFor(member)!==program)activateProgram(member,program,false);
    state.week=Number(card.dataset.noteResultWeek);state.programWeeks[member][program]=state.week;
    editing={week:state.week,day:card.dataset.noteResultDay};route='home';saveState();render();
  });
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
  const md=document.getElementById('macroDate');if(md)md.onchange=()=>render(); const sm=document.getElementById('saveMacros');if(sm)sm.onclick=saveMacroDay; const st=document.getElementById('saveTargets');if(st)st.onclick=saveMacroTargets; const dt=document.getElementById('dayType');if(dt)dt.onchange=()=>{const n=nutritionState(state.member),date=md?.value||todayKey();n.days[date]=Object.assign(n.days[date]||{}, {dayType:dt.value,targetSnapshot:n.days[date]?.targetSnapshot||{...n.targets}});saveState();render()}; document.querySelectorAll('[data-macro-date]').forEach(b=>b.onclick=()=>{const md=document.getElementById('macroDate');if(md){md.value=b.dataset.macroDate;render()}}); document.querySelectorAll('[data-adjust]').forEach(b=>b.onclick=()=>applyMacroAdjustment(Number(b.dataset.adjust)));  const sc=document.getElementById('saveCardio');if(sc)sc.onclick=saveCardio; const cc=document.getElementById('clearCardio');if(cc)cc.onclick=clearCardio; const cd=document.getElementById('cardioDate');if(cd)cd.onchange=()=>{const c=cardioState(state.member),x=c.days[cd.value]||Cardio.blankEntry();['cardioActivity','cardioIntensity','cardioDuration','cardioDistance','cardioCalories'].forEach(id=>{const el=document.getElementById(id);if(id==='cardioActivity')el.value=x.activity||'Walking'; if(id==='cardioIntensity')el.value=x.intensity||'Moderate'; if(id==='cardioDuration')el.value=x.duration||''; if(id==='cardioDistance')el.value=x.distance||''; if(id==='cardioCalories')el.value=x.calories||'';});}; 
}

function openSwapDialog(index){
  const m=state.member,w=editing.week,day=editing.day,plan=planForSession(m,w),old=plan[day].exercises[index];
  const dlg=document.getElementById('noteDialog');
  dlg.innerHTML=`<div class="note-dialog-head"><div><div class="field-label">Exercise ${index+1}</div><h3>Swap ${esc(old[0])}</h3></div><button class="icon-btn" data-swap-close>×</button></div><label class="field-label" for="swapExercise">Replacement</label><select class="select" id="swapExercise">${exerciseOptions(old[0])}</select><div class="field-label" style="margin-top:14px">Apply replacement</div><label class="swap-option"><input type="radio" name="swapScope" value="today" checked> This workout only</label><label class="swap-option"><input type="radio" name="swapScope" value="program"> Rest of program (starting this week)</label><div class="info" style="margin-top:12px">Uses the replacement's recommended rep range and preserves the original exercise's history. A program change affects this member only.</div><div class="action-row" style="margin-top:14px"><button class="primary" data-confirm-swap>Apply swap</button><button class="secondary" data-swap-cancel>Cancel</button></div>`;
  dlg.querySelector('[data-swap-close]').onclick=()=>dlg.close();dlg.querySelector('[data-swap-cancel]').onclick=()=>dlg.close();
  dlg.querySelector('[data-confirm-swap]').onclick=()=>{
    const name=dlg.querySelector('#swapExercise').value,meta=window.BarbarianExercises.metadata(name);
    if(!meta)return;
    const replacement=[name,old[1],meta.min,meta.max];
    const scope=dlg.querySelector('input[name=swapScope]:checked').value;
    persistAllVisibleExercises();
    if(scope==='today'){
      state.sessionSwaps ||= {};state.sessionSwaps[sessionId(m,w,day,index)]=replacement;
    }else{
      state.programSnapshots ||= {};
      for(let future=w;future<=WEEKS;future++){
        const entries=cloneExercises(planForSession(m,future)[day].exercises);
        entries[index]=[...replacement];
        state.programSnapshots[snapshotId(m,future,day)]=entries;
      }
      if(state.sessionSwaps)delete state.sessionSwaps[sessionId(m,w,day,index)];
    }
    saveState();dlg.close();toast(`${name} selected`);render();
  };
  dlg.showModal();
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

function advanceRepFocus(input){
  const card=input.closest('.exercise'); if(!card)return;
  const reps=[...card.querySelectorAll('.set-reps')];const i=reps.indexOf(input);
  if(i<0)return;
  if(i+1<reps.length){reps[i+1].focus();reps[i+1].select();}
  else input.blur();
}
function readCard(card){const name=card.dataset.exercise;const ex=[...daysFor(state.member).flatMap(d=>planForSession(state.member,state.week)[d].exercises)].find(x=>x[0]===name);const sets=[...card.querySelectorAll('.set-table:not(.header)')].map(r=>({weight:r.querySelector('.set-weight').value, reps:r.querySelector('.set-reps').value}));const ww=sets.find(s=>s.weight!=='')?.weight||'';return {workingWeight:Number(ww)||0,sets,saved:true};}
function persistAllVisibleExercises(){document.querySelectorAll('[data-save-ex]').forEach(b=>{const card=b.closest('.exercise');if(card){const name=card.dataset.exercise;const log=readCard(card);state.logs[key(state.member,state.week,editing.day,name)]=log;}});saveState()}
function saveExercise(name){const card=document.querySelector(`[data-exercise="${CSS.escape(name)}"]`);if(!card)return;state.logs[key(state.member,state.week,editing.day,name)]=readCard(card);saveState();toast(`${name} saved`);render();}
function refreshCardMetrics(e){const card=e.target.closest('.exercise');if(!card)return;const ex=planForSession(state.member,editing.week)[editing.day].exercises.find(x=>x[0]===card.dataset.exercise);const sets=[...card.querySelectorAll('.set-table:not(.header)')].map(r=>({weight:r.querySelector('.set-weight').value,reps:r.querySelector('.set-reps').value}));const mt=metrics({sets},ex);card.querySelector('.top-val').textContent=mt.top||'—';card.querySelector('.reps-val').textContent=mt.reps||'—';card.querySelector('.volume-val').textContent=mt.volume?Math.round(mt.volume):'—';if(e.target.classList.contains('set-weight')){const quick=card.querySelector('[data-plate-ex]');if(quick){const ww0=sets.find(s=>s.weight!=='')?.weight||0;quick.dataset.plateWeight=ww0;quick.textContent=`🧮 ${ww0?ww0+' lb':'Plates'}`;}const slot=card.querySelector('.warmup-slot');if(slot){const ww=sets.find(s=>s.weight!=='')?.weight||0;const wasOpen=!!slot.querySelector('details')?.open;slot.innerHTML=`<details class="warmup-disclosure" ${wasOpen?'open':''}><summary>Warm-up <span>· Tap to view</span></summary>${warmupView(editing.day,ex,ww)}</details>`;slot.querySelectorAll('[data-warmup-rest]').forEach(b=>b.onclick=()=>startRestTimer(b.dataset.warmupLabel,Number(b.dataset.warmupRest)));}}}
function startRestTimer(exercise,seconds){ if(window.BarbarianRestTimer) window.BarbarianRestTimer.start(exercise, seconds||window.BarbarianRest.DEFAULT_SECONDS); }

function exerciseOptions(selected){
  const lib=window.BarbarianExercises?.all?.()||[];
  const groups={};
  for(const item of lib)(groups[item.category] ||= []).push(item);
  return Object.entries(groups).map(([cat,items])=>`<optgroup label="${esc(cat)}">${items.map(item=>`<option value="${esc(item.name)}" ${item.name===selected?'selected':''}>${esc(item.name)} · ${item.min}–${item.max}</option>`).join('')}</optgroup>`).join('');
}
function programEditorView(){
  const m=state.member, week=Number(state.editorWeek||state.week), day=daysFor(m).includes(state.editorDay)?state.editorDay:daysFor(m)[0], info=planForSession(m,week)[day];
  return `<section class="hero"><h2>Edit Program</h2><p>Choose the exact member, week, and day. Then choose which workouts should receive your changes.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Week</label><select id="editorWeek" class="select">${Array.from({length:WEEKS},(_,i)=>`<option value="${i+1}" ${week===i+1?'selected':''}>Week ${i+1}</option>`).join('')}</select></div><div><label class="field-label">Day</label><select id="editorDay" class="select">${daysFor(m).map(d=>`<option ${d===day?'selected':''}>${d}</option>`).join('')}</select></div></div></section><div class="info">Editing ${esc(m)} · Week ${week} · ${esc(day)}. Existing logged weights, reps and exercise notes are preserved.</div><div class="program-editor-list">${info.exercises.map((ex,i)=>{const meta=window.BarbarianExercises.metadata(ex[0]);const last=findLastExerciseWeight(m,ex[0]);return `<article class="progress-item program-slot" data-slot="${i}"><div class="editor-slot-head"><div class="field-label">Exercise ${i+1}</div><div class="editor-move-controls"><button type="button" class="secondary editor-move" data-move="up" aria-label="Move exercise up" ${i===0?'disabled':''}>↑</button><button type="button" class="secondary editor-move" data-move="down" aria-label="Move exercise down" ${i===info.exercises.length-1?'disabled':''}>↓</button></div></div><select class="select editor-exercise">${exerciseOptions(ex[0])}</select><div class="editor-grid"><div><label class="field-label">Sets</label><input class="input editor-sets" type="number" min=1 max=10 value="${ex[1]}"></div><div><label class="field-label">Min reps</label><input class="input editor-min" type="number" min=1 max=50 value="${ex[2]}"></div><div><label class="field-label">Max reps</label><input class="input editor-max" type="number" min=1 max=50 value="${ex[3]}"></div></div><div class="muted" style="margin-top:8px">${meta?`${esc(meta.type)} · ${esc(meta.equipment)}${meta.startingResistance!=null?' · Start '+meta.startingResistance+' lb':''} · ${esc(meta.primary)}${meta.secondary.length?' + '+esc(meta.secondary.join(', ')):''}`:'Custom exercise'}${last?` · Last logged ${last} lb`:''}</div></article>`}).join('')}</div><article class="progress-item"><label class="field-label" for="editorScope">Apply changes to</label><select class="select" id="editorScope"><option value="current">This workout only (including completed)</option><option value="current-future">This workout and future weeks</option><option value="future">Future workouts only (starting next week)</option></select><p class="muted">Changing exercise order does not delete logged results. Future-only leaves the selected workout unchanged.</p></article><div class="action-row" style="margin-top:14px"><button class="primary" data-save-program>Save Program Changes</button><button class="secondary" data-route="settings">Cancel</button></div><div class="section-title">Exercise Library</div><article class="macro-card">${(window.BarbarianExercises?.all?.()||[]).map(x=>`<div class="history-row"><b>${esc(x.name)}</b><span>${esc(x.category)}</span><span>${x.min}–${x.max}</span><span>${esc(x.equipment)}</span></div>`).join('')}</article>`;
}
function findLastExerciseWeight(member,exercise){
  let best=null;
  for(const k of Object.keys(state.logs||{})){ const parts=k.split('|'); const matches=(parts[0]===member&&parts.length===4&&parts[3]===exercise)||(parts[0]===CUT_ID&&parts[1]===member&&parts.length===5&&parts[4]===exercise);if(!matches)continue;const l=state.logs[k];if(l?.workingWeight)best=Number(l.workingWeight); }
  return best||0;
}
function remapSessionFlags(member,week,day,before,after){
  const oldSkip={...(state.skippedExercises||{})},oldSwaps={...(state.sessionSwaps||{})};
  state.skippedExercises ||= {};state.sessionSwaps ||= {};
  for(let i=0;i<before.length;i++){
    delete state.skippedExercises[sessionId(member,week,day,i)];
    delete state.sessionSwaps[sessionId(member,week,day,i)];
  }
  const used=new Set();
  for(let i=0;i<after.length;i++){
    const j=before.findIndex((ex,k)=>!used.has(k)&&ex[0]===after[i][0]);
    if(j<0)continue;used.add(j);
    const old=sessionId(member,week,day,j),now=sessionId(member,week,day,i);
    if(oldSkip[old])state.skippedExercises[now]=oldSkip[old];
    if(oldSwaps[old])state.sessionSwaps[now]=oldSwaps[old];
  }
}
function saveProgramChanges(){
  const m=state.member,day=document.getElementById('editorDay')?.value,week=Number(document.getElementById('editorWeek')?.value||state.week),scope=document.getElementById('editorScope')?.value||'current';
  if(!day)return;
  const rows=[...document.querySelectorAll('.program-slot')];
  const updated=rows.map(row=>{const name=row.querySelector('.editor-exercise').value;const sets=Math.max(1,Number(row.querySelector('.editor-sets').value)||1);const min=Math.max(1,Number(row.querySelector('.editor-min').value)||1);const max=Math.max(min,Number(row.querySelector('.editor-max').value)||min);return [name,sets,min,max]});
  const first=scope==='future'?week+1:week,last=scope==='current'?week:WEEKS;
  if(first>WEEKS){toast('There are no later weeks in this 12-week program');return;}
  state.programSnapshots ||= {};
  for(let w=first;w<=last;w++){
    const before=planForSession(m,w)[day].exercises;
    remapSessionFlags(m,w,day,before,updated);
    state.programSnapshots[snapshotId(m,w,day)]=cloneExercises(updated);
  }
  state.editorDay=day;state.editorWeek=week;state.week=week;state.programWeeks[m][activeProgramFor(m)]=week;saveState();
  toast(`${m} ${day} Week ${first}${last>first?'-'+last:''} saved`);route='home';editing=null;render();
}
function action(a){const menu=document.getElementById('menuDialog'); if(a.startsWith('route-')){route=a.slice(6);if(route==='program')state.editorWeek=state.week;editing=null;if(menu.open)menu.close();render();return} if(a==='close')menu.close(); if(a==='export')exportData(); if(a==='import'){document.getElementById('importInput').click();document.getElementById('menuDialog').close()} if(a==='reset'){if(confirm('Reset all local workout data on this device?')){state={member:'David',week:1,logs:{},nutrition:{},cardio:{},programs:{},notes:{}};migratePrograms();migrateEquipmentUpgrade();migrateProgramLibrary();saveState();render();toast('Local data reset')}}}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='barbarian-bulk-backup.json';a.click();URL.revokeObjectURL(url);toast('Backup exported')}
document.getElementById('importInput').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.logs||!x.member)throw new Error();state=x;migratePrograms();migrateEquipmentUpgrade();migrateProgramLibrary();saveState();route='home';editing=null;render();toast('Backup imported')}catch(err){alert('That file is not a valid Barbarian Bulk backup.')}};r.readAsText(f);});
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
