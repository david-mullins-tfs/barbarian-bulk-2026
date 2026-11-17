(function(root){
  'use strict';
  const C=root.HesperidesCore,S=root.HesperidesStore,UI=root.HesperidesUI,DB=root.HesperidesFoodDB;
  if(!C||!S||!UI||!DB)throw Error('Hesperides modules must load before app.js');
  const state={date:localDate(new Date()),view:'today',editingFoodId:null,
    selectedUsda:null,usda:{query:'',results:[],status:'',loading:false},requestSeq:0};
  root.HesperidesApp=state;
  function localDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function yesterday(date){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-1);return localDate(d);}
  const node=id=>document.getElementById(id);
  const val=id=>node(id)?.value||'';
  function notice(message){
    const toast=node('toast');toast.textContent=message;toast.classList.add('visible');
    clearTimeout(notice.timer);notice.timer=setTimeout(()=>toast.classList.remove('visible'),3200);
  }
  function render(){
    node('app').innerHTML=UI.screen(state.view,state.date);
    if(state.view==='foods'){
      const search=node('usdaSearchForm'),query=node('usdaQuery');
      if(query)query.value=state.usda.query;
      if(search)search.onsubmit=e=>{e.preventDefault();searchUsda();};
      renderUsda();
    }
    document.querySelectorAll('[data-tab]').forEach(btn=>{
      const active=btn.dataset.tab===state.view;
      btn.classList.toggle('active',active);
      if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
    });
    const member=node('memberSelect'),date=node('dayDate'),mealCount=node('mealCountDay');
    if(member)member.onchange=()=>{S.selectMember(member.value);state.editingFoodId=null;render();};
    if(date)date.onchange=()=>{if(/^\d{4}-\d{2}-\d{2}$/.test(date.value)){state.date=date.value;render();}};
    if(mealCount)mealCount.onchange=()=>{
      try{S.saveMealCount(state.date,Number(mealCount.value));render();}
      catch(err){alert(err.message);render();}
    };
    const search=node('foodSearch');
    if(search)search.oninput=()=>{
      const needle=search.value.toLowerCase().trim();
      document.querySelectorAll('[data-food-name]').forEach(card=>{
        card.hidden=!!needle&&!card.dataset.foodName.includes(needle);
      });
    };
  }
  function download(filename,content){
    const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);
    link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function addFoodDialog(type,meal){
    const list=S.foodList().slice().sort((a,b)=>a.name.localeCompare(b.name));
    if(!list.length){state.view='foods';render();notice('Add a food to your library first.');return;}
    const dlg=node('modal');
    dlg.innerHTML='<form method="dialog" class="modal-card">'
      +'<div class="modal-head"><h3>'+(type==='planned'?'Plan food':'Log food eaten')+'</h3><button value="cancel" class="close-button" aria-label="Close">×</button></div>'
      +'<p class="subtle">Meal '+(meal+1)+' · '+state.date+'</p>'
      +'<div class="field"><label for="modalFood">Choose food</label><select id="modalFood" class="select">'
      +list.map(f=>'<option value="'+UI.esc(f.id)+'">'+UI.esc(f.name)+' — '+UI.esc(f.serving)+'</option>').join('')+'</select></div>'
      +'<div class="field"><label for="modalServings">Number of servings</label><input id="modalServings" type="number" min="0.01" max="100" step="0.25" value="1"></div>'
      +'<button class="btn full" type="button" id="modalSave">'+(type==='planned'?'Add to plan':'Add to consumed')+'</button>'
      +'<p class="subtle">Macros are based on the stored nutrition label for each serving.</p></form>';
    dlg.showModal();
    node('modalSave').onclick=()=>{
      try{S.addEntry(state.date,meal,val('modalFood'),Number(val('modalServings')),type);dlg.close();render();notice(type==='planned'?'Food added to plan':'Food logged as eaten');}
      catch(err){alert(err.message);}
    };
  }
  function renderUsda(){
    if(state.view!=='foods')return;
    const result=node('usdaResults');
    if(result)result.innerHTML=UI.usdaResultsView(state.usda);
  }
  async function searchUsda(){
    if(state.usda.loading)return;
    const query=val('usdaQuery').trim();
    state.usda.query=query;state.usda.loading=true;
    state.usda.results=[];state.usda.status='';renderUsda();
    const seq=++state.requestSeq,member=S.current();
    try{
      const response=await DB.search(query);
      if(seq!==state.requestSeq||member!==S.current())return;
      state.usda.results=response.results;
      state.usda.status=response.results.length?'':response.found
        ?'Matching foods were missing complete protein, carbohydrate or fat data. Enter macros manually.'
        :'No matching foods found. Try a shorter name or manual entry.';
    }catch(err){
      if(seq!==state.requestSeq||member!==S.current())return;
      state.usda.results=[];state.usda.status=err.message||'Search unavailable. Enter food manually.';
    }finally{
      if(seq===state.requestSeq){state.usda.loading=false;renderUsda();}
    }
  }
  function chooseUsda(index){
    const item=state.usda.results[Number(index)];
    if(!item)throw Error('That USDA result is no longer available. Search again.');
    state.selectedUsda=item;state.editingFoodId=null;
    for(const [id,value] of Object.entries({
      foodName:item.name,foodServing:'100 g',foodProtein:item.protein,foodCarbs:item.carbs,foodFat:item.fat
    })){
      const element=node(id);if(element)element.value=String(value);
    }
    const heading=node('foodFormTitle');
    if(heading)heading.textContent='Review USDA nutrition before saving';
    const button=node('saveFoodButton');if(button)button.textContent='Save reviewed food';
    notice('Review nutrition per 100 g, then tap Save food. Labels may vary.');
    node('foodName')?.focus();
    root.scrollTo?.({top:0,behavior:'smooth'});
  }
  function saveFood(){
    try{
      const existing=state.editingFoodId;
      S.saveFood({id:existing,name:val('foodName'),serving:val('foodServing'),
        protein:val('foodProtein'),carbs:val('foodCarbs'),fat:val('foodFat'),
        source:state.selectedUsda?'USDA FoodData Central':'',
        sourceId:state.selectedUsda?.id||''});
      state.editingFoodId=null;state.selectedUsda=null;render();
      notice(existing?'Food updated; prior entries retain original macros':'Food saved. Add it to a meal from Plan.');
    }catch(err){alert(err.message);}
  }
  function editFood(id){
    const f=S.foodList().find(x=>x.id===id);if(!f)return;
    if(state.view!=='foods'){state.view='foods';render();}
    state.editingFoodId=id;state.selectedUsda=null;
    for(const [key,value] of Object.entries({foodName:f.name,foodServing:f.serving,foodProtein:f.protein,foodCarbs:f.carbs,foodFat:f.fat}))node(key).value=value;
    node('foodFormTitle').textContent='Edit '+f.name;node('saveFoodButton').textContent='Update food';
    node('foodName').focus();window.scrollTo?.({top:0,behavior:'smooth'});
  }
  function calculate(){
    const feet=Number(val('heightFt')),inches=Number(val('heightIn'));
    try{
      if(!Number.isFinite(feet)||feet<3||feet>7||!Number.isFinite(inches)||inches<0||inches>=12)throw Error('Enter height in feet and additional inches.');
      const estimate=S.saveProfile({
        age:val('age'),weightLb:val('weightLb'),heightCm:(feet*12+inches)*2.54,sex:val('sex'),
        activity:val('activity'),goal:val('goal'),mealCount:Number(val('goalMeals'))
      });
      render();
      notice('Saved '+C.GOALS[S.profile().goal]+' targets · '+estimate.targetCalories+' kcal estimated');
    }catch(err){alert(err.message);}
  }
  function saveManualGoals(){
    try{S.saveCustomTarget({protein:val('targetProtein'),carbs:val('targetCarbs'),fat:val('targetFat')});render();notice('Custom macro targets saved for future days');}
    catch(err){alert(err.message);}
  }
  function importAtlasLocal(){
    if(!confirm('Copy ATLAS macro history from this device? ATLAS data will not be deleted or modified.'))return;
    try{const n=S.importFromSameOrigin();state.view='history';render();notice(n?n+' historical ATLAS dates imported':'ATLAS history is already up to date');}
    catch(err){alert(err.message);}
  }
  function fileInput(kind){
    const input=node('fileInput');input.dataset.importKind=kind;input.value='';input.click();
  }
  async function importFile(e){
    const file=e.target.files?.[0];if(!file)return;
    const kind=e.target.dataset.importKind;
    try{
      const text=await file.text();
      if(kind==='atlas'){
        const doc=JSON.parse(text);
        if(!confirm('Copy ATLAS macro history from this file? Existing Hesperides meal logs will remain unchanged.'))return;
        const count=S.importAtlas(doc);
        state.view='history';render();notice(count+' ATLAS days imported');
      }else if(kind==='backup'){
        if(!confirm('Restore this Hesperides backup? This replaces current Hesperides data on this device. Export your current backup first.'))return;
        S.importBackup(text);state.view='today';render();notice('Hesperides backup restored');
      }
    }catch(err){alert('Could not import file: '+err.message);}
    finally{e.target.value='';}
  }
  function applyClick(btn){
    const action=btn.dataset.action;
    try{
      switch(action){
      case 'view':
        state.view=btn.dataset.view||'today';state.editingFoodId=null;render();break;
      case 'add-food':
        addFoodDialog(btn.dataset.type,Number(btn.dataset.meal));break;
      case 'save-food':saveFood();break;
      case 'edit-food':editFood(btn.dataset.id);break;
      case 'cancel-edit-food':state.editingFoodId=null;state.selectedUsda=null;render();break;
      case 'use-usda':chooseUsda(btn.dataset.index);break;
      case 'delete-food':{
        const item=S.foodList().find(f=>f.id===btn.dataset.id);
        if(item&&confirm('Remove '+item.name+' from the food library? Previously logged nutrition remains intact.')){
          S.removeFood(item.id);state.editingFoodId=null;render();notice('Food removed from library');
        }break;
      }
      case 'log-plan':
        S.logPlanned(state.date,btn.dataset.id);render();notice('Planned food logged as eaten');break;
      case 'log-meal':{
        const count=S.logMeal(state.date,Number(btn.dataset.meal));render();notice(count+' planned food'+(count===1?'':'s')+' logged');break;
      }
      case 'remove-entry':
        if(btn.dataset.list==='consumed'&&!confirm('Remove this consumed-food record?'))return;
        S.removeEntry(state.date,btn.dataset.list,btn.dataset.id);render();notice('Food entry removed');break;
      case 'save-template':{
        const name=prompt('Name this reusable daily meal plan:','My daily plan');
        if(name==null)return;S.saveTemplate(state.date,name);render();notice('Reusable meal plan saved');break;
      }
      case 'copy-yesterday':{
        const prior=yesterday(state.date),source=S.day(prior);
        if(!source?.planned.length){notice('Yesterday has no saved meal plan');return;}
        const today=S.day(state.date);
        if(today?.planned.length&&!confirm('Replace the planned foods for '+state.date+'? Consumed logs will remain intact.'))return;
        const count=S.replacePlan(state.date,source.planned,source.mealCount);render();notice(count+' planned foods copied from '+prior);break;
      }
      case 'apply-template':{
        const id=val('templateSelect');
        if(!id)return;
        if(S.day(state.date)?.planned?.length&&!confirm('Replace existing planned foods? Consumed logs will remain unchanged.'))return;
        const count=S.applyTemplate(state.date,id);render();notice(count+' foods added from the template');break;
      }
      case 'calculate-goals':calculate();break;
      case 'save-targets':saveManualGoals();break;
      case 'go-date':state.date=btn.dataset.date;state.view='today';render();break;
      case 'import-atlas':importAtlasLocal();break;
      case 'import-atlas-file':fileInput('atlas');break;
      case 'export-backup':download('hesperides-backup.json',S.exportJson());notice('Hesperides backup downloaded');break;
      case 'import-backup':fileInput('backup');break;
      default:break;
      }
    }catch(err){alert(err.message);}
  }
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-tab]');
    if(tab){state.view=tab.dataset.tab;state.editingFoodId=null;render();return;}
    const button=e.target.closest('[data-action]');
    if(button){e.preventDefault();applyClick(button);}
  });
  node('fileInput').addEventListener('change',importFile);
  const menu=node('menuDialog'),menuBtn=node('menuBtn');
  menuBtn.onclick=()=>menu.showModal();
  menu.addEventListener('click',e=>{
    const a=e.target.closest('[data-menu-view]');
    if(a){state.view=a.dataset.menuView;menu.close();render();}
    if(e.target.closest('[data-menu-close]'))menu.close();
  });
  if('serviceWorker' in navigator)root.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}));
  render();
  root.HesperidesApp.render=render;
})(typeof window!=='undefined'?window:globalThis);
