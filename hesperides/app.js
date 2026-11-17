(function(root){
  'use strict';
  const C=root.HesperidesCore,S=root.HesperidesStore,UI=root.HesperidesUI,DB=root.HesperidesFoodDB,P=root.HesperidesPortions,PickerUI=root.HesperidesPickerUI;
  if(!C||!S||!UI||!DB||!P||!PickerUI)throw Error('Hesperides modules must load before app.js');
  const state={date:localDate(new Date()),view:'today',editingFoodId:null,
    selectedUsda:null,usda:{query:'',results:[],status:'',loading:false},requestSeq:0};
  root.HesperidesApp=state;
  let picker=null;
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
    if(member)member.onchange=()=>{closePicker();S.selectMember(member.value);state.editingFoodId=null;render();};
    if(date)date.onchange=()=>{if(/^\d{4}-\d{2}-\d{2}$/.test(date.value)){closePicker();state.date=date.value;render();}};
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
  function closePicker(){
    const dlg=node('modal');
    if(dlg?.open)dlg.close();
    picker=null;
  }
  function addFoodDialog(type,meal){
    const day=S.dayData(state.date);
    if(!Number.isInteger(meal)||meal<0||meal>=day.mealCount)throw Error('Invalid meal.');
    picker={step:'search',tab:S.recentFoods().length?'recent':'usda',query:'',meal,date:state.date,
      member:S.current(),preferred:type,food:null,unit:'g',quantity:100,detailsLoading:false,req:0,
      usda:{results:[],loading:false,status:''}};
    renderPicker();
  }
  function renderPicker(){
    if(!picker)return;
    const dlg=node('modal');
    dlg.innerHTML=PickerUI.pickerView(picker);
    if(!dlg.open)dlg.showModal();
    if(picker.step==='portion'){
      const unit=node('pickerUnit'),qty=node('pickerQuantity');
      if(unit)unit.onchange=()=>{picker.unit=unit.value;picker.quantity=Number(qty?.value)||0;renderPickerPreview();};
      if(qty)qty.oninput=()=>{picker.quantity=Number(qty.value)||0;renderPickerPreview();};
      renderPickerPreview();
    }else if(picker.tab!=='custom'){
      const input=node('pickerQuery'),results=node('pickerResults'),form=node('pickerUsdaForm');
      if(input){
        input.oninput=()=>{
          picker.query=input.value;
          if(picker.tab!=='usda'&&results)results.innerHTML=PickerUI.resultsView(picker);
        };
      }
      if(form)form.onsubmit=e=>{e.preventDefault();searchPickerUsda();};
      if(results)results.innerHTML=PickerUI.resultsView(picker);
    }
  }
  function renderPickerPreview(){
    if(!picker?.food)return;
    const target=node('pickerPreview');
    if(!target)return;
    try{
      const unit=node('pickerUnit')?.value||picker.unit;
      const quantity=Number(node('pickerQuantity')?.value);
      const selection=P.resolve(picker.food,unit,quantity);
      picker.unit=unit;picker.quantity=quantity;
      const m=P.macros(picker.food,selection);
      target.innerHTML='<div class="picker-preview-calories">'+Math.round(m.calories)+' <small>kcal</small></div>'
        +'<div class="picker-preview-macros"><span><b>'+m.protein+'</b> Protein g</span><span><b>'+m.carbs+'</b> Carbs g</span><span><b>'+m.fat+'</b> Fat g</span></div>'
        +(selection.portionGrams!=null?'<small>Weight: '+selection.portionGrams+' g</small>':'');
    }catch(e){
      target.innerHTML='<p class="notice" role="alert">'+UI.esc(e.message)+'</p>';
    }
  }
  async function searchPickerUsda(){
    if(!picker||picker.tab!=='usda'||picker.usda.loading)return;
    const query=node('pickerQuery')?.value?.trim()||'';
    picker.query=query;picker.usda={results:[],status:'',loading:true};
    const chosen=picker,seq=++picker.req;
    renderPicker();
    try{
      const found=await DB.search(query);
      if(picker!==chosen||picker.req!==seq||picker.tab!=='usda'||picker.member!==S.current())return;
      chosen.usda={results:found.results,loading:false,status:found.results.length?'':'No matching foods with complete macro data. Try another description or Custom.'};
    }catch(e){
      if(picker!==chosen||picker.req!==seq||picker.member!==S.current())return;
      chosen.usda={results:[],loading:false,status:e.message||'USDA unavailable. Try My Foods or Custom.'};
    }
    if(picker===chosen)renderPicker();
  }
  function selectPickerFood(btn){
    if(!picker)return;
    const food=btn.dataset.source==='usda'
      ?picker.usda.results[Number(btn.dataset.resultIndex)]
      :S.foodList().find(x=>x.id===btn.dataset.foodId);
    if(!food)throw Error('Food not found. Search again.');
    const fromUsda=btn.dataset.source==='usda';
    const already=fromUsda?S.foodList().find(x=>x.source==='USDA FoodData Central'&&x.sourceId===food.id):null;
    picker.food=already||food;
    picker.step='portion';picker.detailsLoading=fromUsda&&!already;
    picker.unit=P.options(picker.food)[0]?.id||'serving';
    picker.quantity=picker.unit==='g'?100:1;
    renderPicker();
    if(picker.detailsLoading){
      const current=picker,chosenId=food.id;
      DB.details(chosenId).then(options=>{
        if(picker!==current||picker.step!=='portion'||picker.food?.id!==chosenId)return;
        picker.food={...picker.food,servingOptions:options.length?options:picker.food.servingOptions||[]};
        picker.detailsLoading=false;renderPicker();
      }).catch(()=>{
        if(picker===current&&picker.step==='portion'){picker.detailsLoading=false;renderPicker();}
      });
    }
  }
  function addPickerSelection(kind){
    if(!picker?.food)throw Error('Select a food first.');
    const unit=node('pickerUnit')?.value||picker.unit,quantity=Number(node('pickerQuantity')?.value);
    const result=S.addPickedFood({date:picker.date,mealIndex:picker.meal,kind,food:picker.food,unitId:unit,quantity});
    closePicker();render();
    notice(result.food.name+' · '+(kind==='planned'?'added to plan':'logged as eaten'));
  }
  function customPickerNext(){
    if(!picker)return;
    const food={name:val('pickName').trim(),serving:val('pickServing').trim(),gramWeight:Number(val('pickGrams'))||0,
      protein:Number(val('pickProtein')),carbs:Number(val('pickCarbs')),fat:Number(val('pickFat'))};
    if(!food.name||!food.serving||!Object.values({protein:food.protein,carbs:food.carbs,fat:food.fat})
      .every(x=>Number.isFinite(x)&&x>=0&&x<=500))throw Error('Enter a food, serving, and valid macros per serving.');
    if(!Number.isFinite(food.gramWeight)||food.gramWeight<0||food.gramWeight>10000)throw Error('Invalid serving weight.');
    picker.food=food;picker.step='portion';
    picker.unit=P.options(food)[0].id;picker.quantity=picker.unit==='g'?(food.gramWeight||100):1;
    renderPicker();
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
      foodName:item.name,foodServing:'100 g',foodGramWeight:100,foodProtein:item.protein,foodCarbs:item.carbs,foodFat:item.fat
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
      S.saveFood({id:existing,name:val('foodName'),serving:val('foodServing'),gramWeight:val('foodGramWeight'),
        protein:val('foodProtein'),carbs:val('foodCarbs'),fat:val('foodFat'),
        servingOptions:state.selectedUsda?.servingOptions||undefined,
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
    for(const [key,value] of Object.entries({foodName:f.name,foodServing:f.serving,foodGramWeight:f.gramWeight||'',foodProtein:f.protein,foodCarbs:f.carbs,foodFat:f.fat}))node(key).value=value;
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
        closePicker();state.view=btn.dataset.view||'today';state.editingFoodId=null;render();break;
      case 'add-food':
        addFoodDialog(btn.dataset.type,Number(btn.dataset.meal));break;
      case 'picker-close':closePicker();break;
      case 'picker-back':if(picker){picker.step='search';picker.detailsLoading=false;renderPicker();}break;
      case 'picker-tab':
        if(picker){picker.tab=btn.dataset.tabId;picker.query='';picker.req++;renderPicker();}break;
      case 'picker-select':selectPickerFood(btn);break;
      case 'picker-favorite':
        S.toggleFavorite(btn.dataset.foodId);if(picker)renderPicker();break;
      case 'picker-add':addPickerSelection(btn.dataset.kind);break;
      case 'picker-custom-next':customPickerNext();break;
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
    if(tab){closePicker();state.view=tab.dataset.tab;state.editingFoodId=null;render();return;}
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
