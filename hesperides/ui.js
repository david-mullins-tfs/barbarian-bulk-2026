(function(root){
  'use strict';
  const C=root.HesperidesCore,S=root.HesperidesStore;
  if(!C||!S)throw Error('Hesperides Core and Store are required');
  const esc=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const int=x=>Math.round(Number(x)||0).toLocaleString('en-US');
  const num=x=>Number(x)||0;
  const metric=(v,suffix)=>int(v)+(suffix||'');
  const viewDate=date=>new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  function context(date){
    const p=S.profile(),d=S.dayData(date),target=S.targetFor(date);
    const planned=C.totalsFor(d.planned),consumed=C.totalsFor(d.consumed);
    const status=target?C.assessment(consumed,target):{complete:false,label:'Set targets'};
    return {p,d,target,planned,consumed,status,date};
  }
  function navControls(date,showDate=true){
    return '<div class="selection-bar"><label><span class="eyebrow">Member</span><select class="select" id="memberSelect">'
      +C.MEMBERS.map(name=>'<option value="'+name+'" '+(S.current()===name?'selected':'')+'>'+name+'</option>').join('')
      +'</select></label>'+(showDate?'<label><span class="eyebrow">Date</span><input type="date" id="dayDate" class="select" value="'+esc(date)+'"></label>':'')+'</div>';
  }
  function bar(name,got,target){
    const max=Math.max(0.01,num(target)),n=num(got),pct=Math.max(0,Math.min(100,n/max*100));
    const over=n>max*1.1;
    return '<div class="macro-bar"><div class="macro-head"><strong>'+name+'</strong><span>'+metric(n)+' / '+metric(target)+' g</span></div>'
      +'<div class="track"><span class="'+(over?'over':'')+'" style="width:'+pct.toFixed(1)+'%"></span></div></div>';
  }
  function macroOverview(consumed,target){
    if(!target)return '<div class="notice">Set your nutrition goals to activate the progress dashboard and meal targets.</div>';
    return '<div class="macro-overview">'
      +bar('Protein',consumed.protein,target.protein)+bar('Carbs',consumed.carbs,target.carbs)+bar('Fat',consumed.fat,target.fat)
      +'</div>';
  }
  function dayBadge(status){
    const style=status.complete?'complete':status.label==='Above target'?'over':'pending';
    return '<span class="status '+style+'">'+esc(status.label)+'</span>';
  }
  function intakeRows(items,type){
    if(!items.length)return '<p class="empty-line">No '+(type==='planned'?'foods planned':'foods logged')+' yet.</p>';
    return '<div class="food-rows">'+items.map(item=>{
      const sum=C.totalsFor([item]);
      const logged=type==='planned'&&S.dayData(root.HesperidesApp?.date||'').consumed.some(x=>x.planId===item.id);
      return '<div class="food-row"><div><strong>'+esc(item.name)+'</strong><small>'+esc(item.servings)+' × '+esc(item.serving)+' · '+metric(sum.calories)+' kcal</small></div>'
        +'<div class="food-row-actions">'+(type==='planned'?
          '<button class="tiny positive" data-action="log-plan" data-id="'+esc(item.id)+'" '+(logged?'disabled':'')+'>'+(logged?'✓ Logged':'Log')+'</button>':'')
        +'<button class="tiny muted-button" data-action="remove-entry" data-list="'+type+'" data-id="'+esc(item.id)+'" aria-label="Remove '+esc(item.name)+'">×</button></div></div>';
    }).join('')+'</div>';
  }
  function mealCard(index,ctx,mode){
    const {d,target}=ctx,planned=d.planned.filter(x=>Number(x.mealIndex)===index),consumed=d.consumed.filter(x=>Number(x.mealIndex)===index);
    const plannedSum=C.totalsFor(planned),consumedSum=C.totalsFor(consumed);
    const perTarget=target?C.equalMealTargets(target,d.mealCount)[index]:null;
    const check=perTarget?C.assessment(consumedSum,perTarget):{complete:false,label:'Set targets'};
    const allPlanned=planned.length>0&&planned.every(item=>consumed.some(x=>x.planId===item.id));
    return '<article class="meal-card"><div class="meal-top"><div><small class="eyebrow">Meal '+(index+1)+'</small><h3>Meal '+(index+1)+'</h3></div>'+dayBadge(check)+'</div>'
      +'<div class="meal-summary"><div><b>'+metric(consumedSum.calories)+'</b><small>Consumed kcal</small></div><div><b>'+metric(plannedSum.calories)+'</b><small>Planned kcal</small></div><div><b>'+(perTarget?metric(perTarget.calories):'—')+'</b><small>Target kcal</small></div></div>'
      +(perTarget?'<div class="meal-targets">P '+metric(perTarget.protein)+'g · C '+metric(perTarget.carbs)+'g · F '+metric(perTarget.fat)+'g</div>':'')
      +(mode==='planner'?'<div class="meal-list-title">PLANNED</div>'+intakeRows(planned,'planned')+'<div class="meal-list-title">CONSUMED</div>'+intakeRows(consumed,'consumed'):'<p class="meal-preview">'+(consumed.length?consumed.length+' food item'+(consumed.length===1?'':'s')+' logged':'Nothing eaten yet')+' · '+planned.length+' planned</p>')
      +'<div class="meal-actions">'+(mode==='planner'?'<button class="btn small" data-action="add-food" data-type="planned" data-meal="'+index+'">+ Plan food</button>'
        +'<button class="btn outline small" data-action="add-food" data-type="consumed" data-meal="'+index+'">+ Log food</button>'
        +(planned.length&&!allPlanned?'<button class="btn outline small" data-action="log-meal" data-meal="'+index+'">Log planned meal</button>':''):'<button class="btn outline small" data-action="view" data-view="planner">View / log meal</button>')+'</div></article>';
  }
  function today(date){
    const ctx=context(date),{p,d,target,consumed,planned,status}=ctx;
    return '<section class="hero"><small class="eyebrow">HELDKRAFT · HESPERIDES</small><h2>Eat Like a God.</h2><p><strong>Nutrition, Measured.</strong> Plan deliberately. Eat intentionally. Track what actually matters.</p>'+navControls(date)
      +'<div class="day-intro"><div><small>DAILY STATUS</small><div class="calories-display">'+metric(consumed.calories)+' <span>/ '+(target?metric(C.calories(target)):'—')+' kcal</span></div></div>'+dayBadge(status)+'</div>'
      +(target?'<div class="meta-line">Goal: '+esc(C.GOALS[p.goal]||'Custom')+' · '+d.mealCount+' meals/day · '+viewDate(date)+'</div>':'<div class="notice">Start with Goals to calculate calorie and macro targets.</div>')+'</section>'
      +'<section class="panel"><div class="section-header"><h3>Macro progress</h3><span class="subtle">Consumed, not planned</span></div>'+macroOverview(consumed,target)
      +'<div class="totals-strip"><span><b>'+metric(planned.calories)+'</b> planned kcal</span><span><b>'+metric(consumed.calories)+'</b> eaten kcal</span></div>'
      +'<div class="action-row"><button class="btn" data-action="view" data-view="planner">Plan & log today</button>'
      +(!target?'<button class="btn outline" data-action="view" data-view="goals">Set goals</button>':'')+'</div></section>'
      +'<div class="section-header section-outside"><h3>Meals for '+viewDate(date)+'</h3><span class="subtle">'+d.mealCount+' meals</span></div>'
      +Array.from({length:d.mealCount},(_,i)=>mealCard(i,ctx,'today')).join('')
      +'<div class="notice gentle">Completion uses a practical macro range: calories close to target, sufficient protein, and carbohydrates/fat near the plan. You never need to force food to make an exact number.</div>';
  }
  function planner(date){
    const ctx=context(date),{d,planned,target}=ctx,t=S.templates();
    return '<section class="hero"><small class="eyebrow">YOUR MEAL PLAN</small><h2>Plan ahead</h2><p>Build meals for today or any future date. Nothing counts as eaten until you log it.</p>'+navControls(date)
      +'<div class="totals-strip"><span><b>'+metric(planned.calories)+'</b> planned kcal</span><span><b>'+(target?metric(C.calories(target)):'—')+'</b> target kcal</span></div>'
      +'<div class="action-row"><button class="btn outline small" data-action="copy-yesterday">Copy yesterday</button><button class="btn outline small" data-action="save-template">Save day as template</button></div>'
      +'<div class="control-line"><label class="eyebrow" for="mealCountDay">Meals on this day</label><select class="select compact" id="mealCountDay">'
      +Array.from({length:6},(_,i)=>i+2).map(n=>'<option value="'+n+'" '+(d.mealCount===n?'selected':'')+'>'+n+' meals</option>').join('')+'</select></div>'
      +(t.length?'<div class="template-picker"><label class="eyebrow" for="templateSelect">Saved meal plans</label><select class="select" id="templateSelect">'+t.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select><button class="btn outline small" data-action="apply-template">Use template</button></div>':'')+'</section>'
      +(S.foodList().length?'':'<div class="notice">Create your first food in the Foods tab to start building meals.</div>')
      +Array.from({length:d.mealCount},(_,i)=>mealCard(i,ctx,'planner')).join('');
  }
  function foods(date){
    const list=[...S.foodList()].sort((a,b)=>a.name.localeCompare(b.name));
    return '<section class="hero"><small class="eyebrow">YOUR FOOD LIBRARY</small><h2>Foods & portions</h2><p>Use values from each food label or trusted nutrition information. Macros are per serving and calories are calculated automatically.</p>'
      +navControls(date,false)+'</section><section class="panel usda-panel"><div class="section-header"><h3>Search USDA Food Database</h3><span class="status pending">Preview</span></div><p class="subtle">Find common foods or branded products and review their protein, carbs and fat per 100 g.</p>'
      +'<form id="usdaSearchForm" class="usda-form"><label class="field"><span>Search food name</span><input id="usdaQuery" type="search" maxlength="80" placeholder="e.g. chicken breast, Greek yogurt" autocomplete="off" required minlength="2"></label><button class="btn" type="submit">Search foods</button></form>'
      +'<div id="usdaResults" aria-live="polite" class="usda-results"><p class="subtle">Enter at least two letters and tap Search.</p></div>'
      +'<p class="subtle">Source: <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener noreferrer">USDA FoodData Central</a> (public domain). Uses a limited DEMO_KEY for preview. Search may be unavailable or rate-limited; manual entry remains available. Verify labels, preparation and serving amounts.</p></section><section class="panel"><h3 id="foodFormTitle">Add a food</h3>'
      +'<div class="field"><label for="foodName">Food name</label><input id="foodName" maxlength="100" placeholder="e.g. Greek yogurt, plain"></div>'
      +'<div class="field"><label for="foodServing">Serving description</label><input id="foodServing" maxlength="80" placeholder="e.g. 170 g cup"></div>'
      +'<div class="triad"><div class="field"><label for="foodProtein">Protein (g)</label><input id="foodProtein" type="number" min="0" max="500" step="0.1" placeholder="0"></div>'
      +'<div class="field"><label for="foodCarbs">Carbs (g)</label><input id="foodCarbs" type="number" min="0" max="500" step="0.1" placeholder="0"></div>'
      +'<div class="field"><label for="foodFat">Fat (g)</label><input id="foodFat" type="number" min="0" max="500" step="0.1" placeholder="0"></div></div>'
      +'<div class="action-row"><button class="btn" data-action="save-food" id="saveFoodButton">Save food</button><button class="btn outline" data-action="cancel-edit-food">Clear</button></div>'
      +'</section><div class="section-header section-outside"><h3>Saved foods</h3><span class="subtle">'+list.length+' foods</span></div>'
      +'<input class="select food-search" id="foodSearch" type="search" placeholder="Search foods…" autocomplete="off">'
      +'<div class="food-library">'+(list.length?list.map(x=>'<article class="food-tile" data-food-name="'+esc(x.name.toLowerCase())+'"><div><strong>'+esc(x.name)+'</strong><small>'+esc(x.serving)+' · '+metric(C.calories(x))+' kcal</small><small>P '+metric(x.protein)+' · C '+metric(x.carbs)+' · F '+metric(x.fat)+' g</small>'+(x.source?'<small>'+esc(x.source)+(x.sourceId?' · #'+esc(x.sourceId):'')+'</small>':'')+'</div><div class="tile-actions"><button class="tiny" data-action="edit-food" data-id="'+esc(x.id)+'">Edit</button><button class="tiny muted-button" data-action="delete-food" data-id="'+esc(x.id)+'">Delete</button></div></article>').join(''):'<p class="notice">No foods added yet. Start with a food and its macros per serving.</p>')+'</div>';
  }
  function usdaResultsView(lookup){
    const status=String(lookup?.status||'').trim(),list=Array.isArray(lookup?.results)?lookup.results:[];
    if(lookup?.loading)return '<p class="subtle" role="status">Searching USDA foods…</p>';
    if(!list.length)return '<p class="subtle" role="status">'+esc(status||'Search by name to look up nutrition information.')+'</p>';
    return '<div class="usda-count">'+list.length+' foods with complete macro data · per 100 g. Check the actual label.</div>'
      +list.map((item,i)=>'<div class="usda-item"><div><strong>'+esc(item.name)+'</strong><small>'+esc(item.type)+' · per 100 g · '+metric(item.calories)+' kcal</small>'
        +'<small>P '+metric(item.protein)+' g · C '+metric(item.carbs)+' g · F '+metric(item.fat)+' g</small></div>'
        +'<div class="usda-actions"><button type="button" class="btn outline small" data-action="use-usda" data-index="'+i+'">Review & save</button>'
        +'<a href="'+esc(item.sourceUrl)+'" target="_blank" rel="noopener noreferrer" class="usda-source">USDA record ↗</a></div></div>').join('');
  }
  function goals(date){
    const p=S.profile(),has=p.target!=null;
    const ft=Number(p.heightCm)?Math.floor(Number(p.heightCm)/2.54/12):'',inches=Number(p.heightCm)?Math.round((Number(p.heightCm)/2.54%12)*10)/10:'';
    const sex=p.sex||'male',goals=C.GOALS,activity={sedentary:'Mostly seated',light:'Light exercise (1–3 days/week)',moderate:'Moderate exercise (3–5 days/week)',active:'Hard training (6–7 days/week)',very_active:'Very active / physical job'};
    return '<section class="hero"><small class="eyebrow">NUTRITION GUIDANCE</small><h2>Calculate your targets</h2><p>Choose Growth, Maintenance, or Fat Loss. These are initial estimates, not prescriptions; adjust using your weight trend and performance.</p>'+navControls(date,false)+'</section>'
      +'<section class="panel"><h3>Your information</h3><div class="triad two">'
      +'<div class="field"><label for="age">Age (18+)</label><input id="age" type="number" min="18" max="100" value="'+esc(p.age)+'" placeholder="35"></div>'
      +'<div class="field"><label for="weightLb">Weight (lb)</label><input id="weightLb" type="number" min="60" max="650" step="0.1" value="'+esc(p.weightLb)+'" placeholder="185"></div></div>'
      +'<div class="triad two"><div class="field"><label for="heightFt">Height (ft)</label><input id="heightFt" type="number" min="3" max="7" value="'+esc(ft)+'" placeholder="5"></div>'
      +'<div class="field"><label for="heightIn">Additional inches</label><input id="heightIn" type="number" min="0" max="11.99" step="0.1" value="'+esc(inches)+'" placeholder="10"></div></div>'
      +'<div class="field"><label for="sex">BMR coefficient</label><select id="sex" class="select"><option value="male" '+(sex==='male'?'selected':'')+'>Male physiology estimate (+5)</option><option value="female" '+(sex==='female'?'selected':'')+'>Female physiology estimate (−161)</option></select></div>'
      +'<div class="field"><label for="activity">Activity level</label><select id="activity" class="select">'+Object.entries(activity).map(([key,label])=>'<option value="'+key+'" '+(p.activity===key?'selected':'')+'>'+label+'</option>').join('')+'</select></div>'
      +'<div class="field"><label for="goal">Goal</label><select id="goal" class="select">'+Object.entries(goals).map(([key,label])=>'<option value="'+key+'" '+(p.goal===key?'selected':'')+'>'+label+'</option>').join('')+'</select></div>'
      +'<div class="field"><label for="goalMeals">Meals per day</label><select id="goalMeals" class="select">'+Array.from({length:6},(_,i)=>i+2).map(n=>'<option value="'+n+'" '+(p.mealCount===n?'selected':'')+'>'+n+' meals</option>').join('')+'</select></div>'
      +'<button class="btn full" data-action="calculate-goals">Calculate & save targets</button></section>'
      +(has?'<section class="panel target-panel"><div class="section-header"><h3>Your current targets</h3><span class="status complete">Saved</span></div>'
        +'<div class="goal-calories">'+metric(C.calories(p.target))+' <small>kcal/day</small></div>'
        +(p.estimate?'<p class="subtle">Estimated maintenance: '+metric(p.estimate.maintenance)+' kcal · Goal change: '+(p.estimate.adjustment>0?'+':'')+metric(p.estimate.adjustment)+' kcal/day.</p>':'')
        +'<div class="triad"><div class="field"><label for="targetProtein">Protein g</label><input id="targetProtein" type="number" min="0" value="'+esc(p.target.protein)+'"></div>'
        +'<div class="field"><label for="targetCarbs">Carbs g</label><input id="targetCarbs" type="number" min="0" value="'+esc(p.target.carbs)+'"></div>'
        +'<div class="field"><label for="targetFat">Fat g</label><input id="targetFat" type="number" min="0" value="'+esc(p.target.fat)+'"></div></div>'
        +'<button class="btn outline full" data-action="save-targets">Save adjusted macros</button>'
        +'<p class="notice gentle">Meal targets are divided evenly by default. Existing days with saved plans retain their original targets; new days use updated goals.</p></section>':'')
      +'<section class="panel fineprint"><h3>How estimates work</h3><p>Mifflin–St Jeor estimates resting energy, adjusted for activity. Growth starts near +250 kcal; Fat Loss uses a moderate deficit; Maintenance targets estimated energy expenditure. Protein and fat are estimated from body weight and remaining calories go toward carbohydrates.</p><p>Nutrition needs vary. Not designed for people under 18, pregnancy, eating disorders or medical nutrition therapy. Consult a qualified professional for personalized guidance.</p></section>';
  }
  function history(date){
    const dates=S.dates(),archive=S.legacy(),historical=Object.entries(archive?.days||{}).sort(([a],[b])=>b.localeCompare(a));
    return '<section class="hero"><small class="eyebrow">NUTRITION HISTORY</small><h2>Progress over time</h2><p>Recorded meals and historic Atlas macro totals stay separate. Neither is overwritten by an imported archive.</p>'+navControls(date,false)
      +'<div class="action-row"><button class="btn outline small" data-action="import-atlas">Import ATLAS records on this device</button><button class="btn outline small" data-action="import-atlas-file">Import ATLAS archive file</button></div></section>'
      +'<div class="section-header section-outside"><h3>Hesperides daily logs</h3><span class="subtle">'+dates.length+' days</span></div>'
      +(dates.length?dates.map(k=>{
        const d=S.dayData(k),got=C.totalsFor(d.consumed),goal=S.targetFor(k),status=goal?C.assessment(got,goal):{label:'No targets',complete:false};
        return '<button class="history-row" data-action="go-date" data-date="'+k+'"><span><strong>'+esc(k)+'</strong><small>'+d.consumed.length+' foods eaten · '+int(got.calories)+' kcal</small></span>'+dayBadge(status)+'</button>';
      }).join(''):'<div class="notice">No daily entries yet. Your logged days will appear here.</div>')
      +'<div class="section-header section-outside"><h3>Archived ATLAS macros</h3><span class="subtle">'+historical.length+' dates</span></div>'
      +(historical.length?historical.map(([k,d])=>'<article class="history-row legacy"><span><strong>'+esc(k)+'</strong><small>'+metric(C.calories(d))+' kcal · P '+metric(d.protein)+'g · C '+metric(d.carbs)+'g · F '+metric(d.fat)+'g</small></span><span class="status">ATLAS</span></article>').join(''):'<div class="notice">No ATLAS archive imported yet. Use the import button above to preserve your previous nutrition history.</div>')
      +'<section class="panel fineprint"><h3>Backups & privacy</h3><p>Your food records, meal plans and targets are saved on this device only. They do not synchronize across phones.</p><div class="action-row"><button class="btn outline" data-action="export-backup">Export Hesperides backup</button><button class="btn outline" data-action="import-backup">Import Hesperides backup</button></div></section>';
  }
  function screen(view,date){
    if(view==='today')return today(date);
    if(view==='planner')return planner(date);
    if(view==='foods')return foods(date);
    if(view==='goals')return goals(date);
    if(view==='history')return history(date);
    return today(date);
  }
  root.HesperidesUI={screen,context,esc,int,navControls,mealCard,usdaResultsView};
})(typeof window!=='undefined'?window:globalThis);
