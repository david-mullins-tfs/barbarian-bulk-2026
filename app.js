const PROGRAM = {
  'Monday': {
    focus:'Squat Focus', exercises:[
      ['Squat',5,6,8],['Lunges',4,10,12],['Leg Press',3,10,12],['Leg Curls',3,12,15]
    ]
  },
  'Tuesday': {
    focus:'Bench Focus', exercises:[
      ['Bench',5,6,8],['Overhead Press',4,8,10],['Pullups',4,6,9],['Lateral Raise',3,12,15]
    ]
  },
  'Thursday': {
    focus:'Deadlift Focus', exercises:[
      ['Deadlift',5,5,7],['RDL',4,8,10],['Leg Curls',3,12,15],['Yes/No',3,12,15]
    ]
  },
  'Friday': {
    focus:'Upper Volume Day', exercises:[
      ['Close-Grip Bench',4,8,10],['Chest-Supported Row',4,10,12],['Seated DB Press',3,10,12],['EZ Curl + Tri Push',4,10,12],['W-Bar Superset',0,null,null]
    ]
  }
};
const DAYS=Object.keys(PROGRAM), MEMBERS=['David','Dan','Jason','Vinjo'], WEEKS=12, INCREMENT=5;
const KEY='barbarian_bulk_pwa_v1';
let state=loadState();
let route='home'; let editing=null;

function loadState(){
  try{const raw=localStorage.getItem(KEY); if(raw) return JSON.parse(raw);}catch(e){}
  return {member:'David',week:1,logs:{}};
}
function saveState(){localStorage.setItem(KEY,JSON.stringify(state));}
function key(member,week,day,exercise){return [member,week,day,exercise].join('|')}
function getLog(member,week,day,exercise){return state.logs[key(member,week,day,exercise)] || null}
function targetText(ex){return ex[3]==null?'Each':`${ex[2]}–${ex[3]}`}
function sessionRows(member,week,day,exercise){
  const ex=PROGRAM[day].exercises.find(x=>x[0]===exercise); if(!ex) return null;
  const existing=getLog(member,week,day,exercise);
  if(existing) return existing;
  let weight=0;
  const prev=week>1?getLog(member,week-1,day,exercise):null;
  if(prev){
    const complete=ex[2]!=null && prev.sets.length===ex[1] && prev.sets.every(s=>Number(s.reps)>=ex[3]);
    weight=(Number(prev.workingWeight)||0)+(complete?INCREMENT:0);
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
  return PROGRAM[day].exercises.every(ex=>{const l=getLog(member,week,day,ex[0]); return ex[1]===0 ? true : !!l && l.sets.length===ex[1] && l.sets.every(s=>s.reps!=='');});
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}
function render(){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
  const app=document.getElementById('app'); if(route==='home') app.innerHTML=homeView(); else if(route==='progress') app.innerHTML=progressView(); else app.innerHTML=settingsView(); bind();}

function homeView(){
  if(editing) return workoutView(editing.week,editing.day);
  const m=state.member,w=state.week, pct=Math.round((DAYS.filter(d=>dayComplete(m,w,d)).length/DAYS.length)*100);
  return `<section class="hero"><h2>${esc(m)} · Week ${w}</h2><p>Double progression: hit the top of every target set, then the next session moves up ${INCREMENT} lb and returns to the bottom of the range.</p>
    <div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">Week</label><select id="weekSelect" class="select">${Array.from({length:WEEKS},(_,i)=>`<option value="${i+1}" ${i+1===w?'selected':''}>Week ${i+1}</option>`).join('')}</select></div></div>
    <div style="margin-top:15px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px"><span>Week completion</span><b>${pct}%</b></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div>
  </section><div class="section-title">Training days</div><div class="day-grid">${DAYS.map(day=>dayCard(m,w,day)).join('')}</div>
  <div class="section-title">Program notes</div><div class="info">Choose a starting weight. Keep that weight until all target sets reach the top of the range. Then add 5 lb next session and start the rep target back at the bottom.</div>`;
}
function dayCard(m,w,day){const done=dayComplete(m,w,day), n=PROGRAM[day].exercises.length;return `<button class="day-card" data-open-day="${day}" style="text-align:left"><div class="day-top"><div><div class="day-name">${day}</div><div class="focus">${PROGRAM[day].focus} · ${n} exercises</div></div><div class="done-dot ${done?'done':''}"></div></div><div class="action-row" style="margin-top:12px"><span class="secondary" style="display:flex;align-items:center;justify-content:center">${done?'Review':'Start workout'}</span></div></button>`}

function workoutView(week,day){
  const m=state.member, info=PROGRAM[day];
  return `<div class="workout-head"><div><button class="back" data-back>← Back</button><h2 style="margin-top:14px">${day} · Week ${week}</h2><p>${esc(info.focus)}</p></div></div>
    ${info.exercises.map(ex=>exerciseCard(m,week,day,ex)).join('')}
    <div class="action-row" style="margin:18px 0 6px"><button class="primary" data-finish-workout>Save ${day}</button></div>`;
}
function exerciseCard(m,w,day,ex){
  if(ex[1]===0) return `<article class="exercise"><div class="exercise-head"><div><div class="exercise-name">${esc(ex[0])}</div><div class="range">Each</div></div></div><p class="muted" style="margin:12px 0 0">Accessory/superset note from the original program.</p></article>`;
  const log=sessionRows(m,w,day,ex[0]); const mt=metrics(log,ex); const suggested=log.workingWeight||0; const isSaved=getLog(m,w,day,ex[0]);
  return `<article class="exercise" data-exercise="${esc(ex[0])}"><div class="exercise-head"><div><div class="exercise-name">${esc(ex[0])}</div><div class="range">${targetText(ex)} reps · ${isSaved?'saved':'ready to log'}</div></div>${mt.ready?'<span class="add-badge">ADD 5 LB NEXT</span>':'<span class="keep-badge">KEEP WEIGHT</span>'}</div>
    <div class="set-table header"><div>Set</div><div>Weight</div><div>Reps</div><div></div></div>
    ${log.sets.map((s,i)=>`<div class="set-table"><div class="set-num">${i+1}</div><input class="mini-input set-weight" inputmode="decimal" type="number" min="0" step="5" value="${s.weight??''}" aria-label="${ex[0]} set ${i+1} weight"><input class="mini-input set-reps" inputmode="numeric" type="number" min="0" step="1" value="${s.reps??''}" aria-label="${ex[0]} set ${i+1} reps"><div class="set-status ${ex[3]!=null && Number(s.reps)>=ex[3]?'good':'bad'}">${ex[3]!=null&&Number(s.reps)>=ex[3]?'✓':'•'}</div></div>`).join('')}
    <div class="metrics"><div class="metric"><div class="label">Top weight</div><div class="value top-val">${mt.top||'—'}</div></div><div class="metric"><div class="label">Total reps</div><div class="value reps-val">${mt.reps||'—'}</div></div><div class="metric"><div class="label">Volume</div><div class="value volume-val">${mt.volume?Math.round(mt.volume):'—'}</div></div></div>
    <div class="action-row" style="margin-top:10px"><button class="secondary" data-save-ex="${esc(ex[0])}">${isSaved?'Update':'Save exercise'}</button></div>
  </article>`;
}

function progressView(){const m=state.member;const exercises=[...new Map(DAYS.flatMap(d=>PROGRAM[d].exercises).map(x=>[x[0],x])).values()].filter(x=>x[1]);
return `<section class="hero"><h2>${esc(m)} · Progress</h2><p>Track working weight, total reps and volume across the 12-week plan.</p><div class="select-row"><div><label class="field-label">Member</label><select id="memberSelect" class="select">${MEMBERS.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div><div><label class="field-label">View week</label><select id="weekSelect" class="select">${Array.from({length:WEEKS},(_,i)=>`<option value="${i+1}" ${i+1===state.week?'selected':''}>Week ${i+1}</option>`).join('')}</select></div></div></section>
<div class="section-title">Working weight by week</div><div class="progress-list">${exercises.map(ex=>progressItem(m,ex)).join('')}</div>`}
function progressItem(m,ex){const values=[];for(let w=1;w<=WEEKS;w++){let found=null;for(const d of DAYS){const l=getLog(m,w,d,ex[0]);if(l){const mt=metrics(l,ex);found=mt.top||l.workingWeight||0;break}}values.push(found||0)}const best=Math.max(0,...values);return `<article class="progress-item"><div class="top"><div class="exercise-name">${esc(ex[0])}</div><div class="muted">Best ${best||'—'} lb</div></div><div class="mini-grid">${values.map((v,i)=>`<div class="week-chip ${i+1===state.week?'active':''}"><div class="w">W${i+1}</div><div class="v">${v||'—'}</div></div>`).join('')}</div></article>`}

function settingsView(){return `<section class="hero"><h2>Settings & backups</h2><p>This PWA stores workout entries on the device in local storage. Export a backup before changing phones.</p></section><div class="section-title">Group</div><div class="progress-list"><article class="progress-item"><div class="top"><div><div class="exercise-name">Members</div><div class="muted">David · Dan · Jason · Vinjo</div></div><div>4</div></div></article><article class="progress-item"><div class="top"><div><div class="exercise-name">Plan</div><div class="muted">12 weeks · Monday, Tuesday, Thursday, Friday</div></div><div>12</div></div></article></div><div class="section-title">Double progression</div><div class="info">When every target set reaches the top of its rep range, the next session automatically suggests +5 lb and starts the rep goal back at the bottom of the range.</div><div class="action-row" style="margin-top:14px"><button class="primary" data-action="export">Export backup</button><button class="secondary" data-action="import">Import backup</button></div>`}

function bind(){
  const m=document.getElementById('memberSelect'); if(m)m.onchange=()=>{state.member=m.value;saveState();editing=null;render()};
  const w=document.getElementById('weekSelect'); if(w)w.onchange=()=>{state.week=Number(w.value);editing=null;render()};
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{route=b.dataset.route;editing=null;render()});
  document.querySelectorAll('[data-open-day]').forEach(b=>b.onclick=()=>{editing={week:state.week,day:b.dataset.openDay};render()});
  document.querySelectorAll('[data-save-ex]').forEach(b=>b.onclick=()=>saveExercise(b.dataset.saveEx));
  const back=document.querySelector('[data-back]');if(back)back.onclick=()=>{editing=null;render()};
  const fin=document.querySelector('[data-finish-workout]');if(fin)fin.onclick=()=>{persistAllVisibleExercises();editing=null;toast('Workout saved');render()};
  document.querySelectorAll('.set-reps,.set-weight').forEach(inp=>inp.addEventListener('input',refreshCardMetrics));
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
}
function readCard(card){const name=card.dataset.exercise;const ex=[...DAYS.flatMap(d=>PROGRAM[d].exercises)].find(x=>x[0]===name);const sets=[...card.querySelectorAll('.set-table:not(.header)')].map(r=>({weight:r.querySelector('.set-weight').value, reps:r.querySelector('.set-reps').value}));const ww=sets.find(s=>s.weight!=='')?.weight||'';return {workingWeight:Number(ww)||0,sets,saved:true};}
function persistAllVisibleExercises(){document.querySelectorAll('[data-save-ex]').forEach(b=>{const card=b.closest('.exercise');if(card){const name=card.dataset.exercise;const log=readCard(card);state.logs[key(state.member,state.week,editing.day,name)]=log;}});saveState()}
function saveExercise(name){const card=document.querySelector(`[data-exercise="${CSS.escape(name)}"]`);if(!card)return;state.logs[key(state.member,state.week,editing.day,name)]=readCard(card);saveState();toast(`${name} saved`);render();}
function refreshCardMetrics(e){const card=e.target.closest('.exercise');if(!card)return;const ex=PROGRAM[editing.day].exercises.find(x=>x[0]===card.dataset.exercise);const sets=[...card.querySelectorAll('.set-table:not(.header)')].map(r=>({weight:r.querySelector('.set-weight').value,reps:r.querySelector('.set-reps').value}));const mt=metrics({sets},ex);card.querySelector('.top-val').textContent=mt.top||'—';card.querySelector('.reps-val').textContent=mt.reps||'—';card.querySelector('.volume-val').textContent=mt.volume?Math.round(mt.volume):'—';}
function action(a){if(a==='close')document.getElementById('menuDialog').close(); if(a==='export')exportData(); if(a==='import'){document.getElementById('importInput').click();document.getElementById('menuDialog').close()} if(a==='reset'){if(confirm('Reset all local workout data on this device?')){state={member:'David',week:1,logs:{}};saveState();render();toast('Local data reset')}}}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='barbarian-bulk-backup.json';a.click();URL.revokeObjectURL(url);toast('Backup exported')}
document.getElementById('importInput').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.logs||!x.member)throw new Error();state=x;saveState();route='home';editing=null;render();toast('Backup imported')}catch(err){alert('That file is not a valid Barbarian Bulk backup.')}};r.readAsText(f);});
document.getElementById('menuBtn').onclick=()=>document.getElementById('menuDialog').showModal();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
