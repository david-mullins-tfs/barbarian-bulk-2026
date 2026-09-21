const PLATES=[45,25,10,5,2.5];
function platesPerSide(total,start){
  total=Number(total);start=Number(start);
  const side=(total-start)/2;
  if(!Number.isFinite(side)||side<0||Math.abs(side*2-Math.round(side*2))>1e-9)return null;
  let rem=Math.round(side*2)/2,out=[];
  for(const p of PLATES){while(rem+1e-9>=p){out.push(p);rem=Math.round((rem-p)*2)/2;}}
  return Math.abs(rem)<1e-9?out:null;
}
function closestLoad(total,start){
  total=Number(total);start=Number(start);
  const min=Math.max(start,Math.round((total-100)/5)*5),max=Math.max(start,Math.round((total+100)/5)*5);
  let best=null;
  for(let t=min;t<=max;t+=5){const plates=platesPerSide(t,start);if(plates){const d=Math.abs(t-total);if(!best||d<best.diff||(d===best.diff&&t<best.total))best={total:t,plates,diff:d};}}
  return best;
}
const api={PLATES,platesPerSide,closestLoad};
if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.BarbarianPlates=api;
