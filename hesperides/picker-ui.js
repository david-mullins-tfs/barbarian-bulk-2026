(function(root){
  'use strict';
  const S=root.HesperidesStore,P=root.HesperidesPortions;
  const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const metric=x=>Math.round(Number(x)||0);
  const tabs=[['recent','Recent'],['favorites','Favorites'],['my','My Foods'],['usda','USDA Search'],['custom','Custom']];
  function pickerView(state){
    const title='<div class="modal-head"><div><small class="eyebrow">MEAL '+(state.meal+1)+' · '+esc(state.date)+'</small><h3>Search & add food</h3></div>'
      +'<button type="button" class="close-button" data-action="picker-close" aria-label="Close">×</button></div>';
    if(state.step==='portion'){
      const f=state.food,options=P.options(f),unit=options.find(x=>x.id===state.unit)||options[0];
      return '<div class="modal-card">'+title+'<button class="tiny muted-button" data-action="picker-back">← Back to search</button>'
        +'<div class="picker-selected"><strong>'+esc(f.name)+'</strong><small>'+esc(f.source||'My Food')+' · base: '+esc(f.serving)+'</small></div>'
        +'<div class="picker-serving-grid"><label class="field"><span>Serving unit</span><select id="pickerUnit" class="select">'
        +options.map(item=>'<option value="'+esc(item.id)+'" '+(item.id===unit.id?'selected':'')+'>'+esc(item.label)+'</option>').join('')+'</select></label>'
        +'<label class="field"><span>Quantity</span><input id="pickerQuantity" type="number" min="0.01" step="any" max="10000" value="'+esc(state.quantity)+'"></label></div>'
        +'<div id="pickerPreview" class="picker-preview" aria-live="polite"></div>'
        +(state.detailsLoading?'<p class="subtle">Checking USDA for additional measured portions…</p>':'')
        +'<p class="subtle">Grams are the default when a known gram weight exists. Cups, tablespoons and individual pieces appear only with a documented weight for this food.</p>'
        +'<div class="action-row"><button class="btn" type="button" data-action="picker-add" data-kind="planned">Add to Plan</button>'
        +'<button class="btn outline" type="button" data-action="picker-add" data-kind="consumed">Log as Eaten</button></div></div>';
    }
    const active=state.tab||'recent';
    const controls='<div class="picker-tabs" role="group" aria-label="Food source">'
      +tabs.map(([id,label])=>'<button type="button" class="picker-tab '+(id===active?'active':'')+'" data-action="picker-tab" data-tab-id="'+id+'">'+label+'</button>').join('')+'</div>';
    if(active==='custom'){
      return '<div class="modal-card">'+title+controls+'<p class="subtle">Quick-add a food from its nutrition label. It is saved to My Foods when added to the meal.</p>'
        +'<div class="field"><label for="pickName">Food name</label><input id="pickName" maxlength="100" placeholder="Scrambled eggs"></div>'
        +'<div class="field"><label for="pickServing">Serving description</label><input id="pickServing" maxlength="80" placeholder="1 large egg or 100 g"></div>'
        +'<div class="field"><label for="pickGrams">Grams per serving (optional)</label><input id="pickGrams" type="number" min="0" max="10000" step="any" placeholder="Only if known"></div>'
        +'<div class="triad"><div class="field"><label for="pickProtein">Protein g</label><input id="pickProtein" type="number" min="0" max="500" step="any"></div>'
        +'<div class="field"><label for="pickCarbs">Carbs g</label><input id="pickCarbs" type="number" min="0" max="500" step="any"></div>'
        +'<div class="field"><label for="pickFat">Fat g</label><input id="pickFat" type="number" min="0" max="500" step="any"></div></div>'
        +'<button type="button" class="btn full" data-action="picker-custom-next">Choose quantity →</button></div>';
    }
    return '<div class="modal-card">'+title+controls
      +(active==='usda'?'<form id="pickerUsdaForm" class="picker-search-line"><input id="pickerQuery" type="search" minlength="2" maxlength="80" placeholder="Search USDA foods…" value="'+esc(state.query||'')+'"><button class="btn small" type="submit">Search</button></form>'
        :'<div class="field"><label for="pickerQuery">Search '+(active==='recent'?'recent foods':active==='favorites'?'favorites':'saved foods')+'</label>'
        +'<input id="pickerQuery" type="search" placeholder="Filter foods…" value="'+esc(state.query||'')+'" autocomplete="off"></div>')
      +'<div id="pickerResults" class="picker-results" aria-live="polite"></div>'
      +'<div class="notice gentle"><b>USDA Search</b> is a limited preview; press Search to query. If unavailable, use My Foods or Custom. Verify preparation method, serving weights and label values.</div></div>';
  }
  function resultsView(state){
    if(!state||state.step!=='search')return '';
    const q=String(state.query||'').trim().toLowerCase();
    if(state.tab==='usda'){
      const result=state.usda||{},list=Array.isArray(result.results)?result.results:[];
      if(result.loading)return '<p class="subtle">Searching USDA…</p>';
      if(!list.length)return '<p class="subtle">'+esc(result.status||'Enter a food name and tap Search.')+'</p>';
      return '<p class="subtle">'+list.length+' USDA results · macros per 100 g</p>'
        +list.map((f,i)=>'<button class="picker-result" type="button" data-action="picker-select" data-result-index="'+i+'" data-source="usda"><span>'
        +'<strong>'+esc(f.name)+'</strong><small>P '+metric(f.protein)+' g · C '+metric(f.carbs)+' g · F '+metric(f.fat)+' g per 100 g</small>'
        +'</span><span class="picker-arrow">›</span></button>').join('');
    }
    const list=state.tab==='favorites'?S.favoriteFoods():state.tab==='recent'?S.recentFoods():S.foodList().slice().sort((a,b)=>a.name.localeCompare(b.name));
    const shown=list.filter(x=>x.name.toLowerCase().includes(q)).slice(0,50);
    if(!shown.length)return '<div class="notice gentle">Nothing here yet. Try USDA Search, My Foods or Custom.</div>';
    const fav=new Set(S.favoriteIds());
    return '<p class="subtle">'+shown.length+' foods</p>'+shown.map(f=>'<div class="picker-local-row">'
      +'<button type="button" class="picker-result" data-action="picker-select" data-food-id="'+esc(f.id)+'" data-source="local"><span>'
      +'<strong>'+esc(f.name)+'</strong><small>'+esc(f.serving)+' · P '+metric(f.protein)+'g · C '+metric(f.carbs)+'g · F '+metric(f.fat)+'g</small></span>'
      +'<span class="picker-arrow">›</span></button>'
      +'<button type="button" class="picker-star" data-action="picker-favorite" data-food-id="'+esc(f.id)+'" aria-label="'+(fav.has(f.id)?'Remove favorite':'Add favorite')+'">'+(fav.has(f.id)?'★':'☆')+'</button></div>').join('');
  }
  root.HesperidesPickerUI={pickerView,resultsView};
})(typeof window!=='undefined'?window:globalThis);
