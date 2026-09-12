(function(global){
  const KEY = 'barbarian_bulk_rest_timer_v1';
  const DEFAULT_SECONDS = 150;

  function clampSeconds(value){
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return DEFAULT_SECONDS;
    return Math.max(0, n);
  }
  function formatTime(seconds){
    const s = clampSeconds(seconds);
    const mm = Math.floor(s / 60).toString().padStart(2,'0');
    const ss = (s % 60).toString().padStart(2,'0');
    return `${mm}:${ss}`;
  }
  function remainingSeconds(endAt, now){
    if (!endAt) return 0;
    const end = Number(endAt);
    const current = now == null ? Date.now() : Number(now);
    if (!Number.isFinite(end) || !Number.isFinite(current)) return 0;
    return Math.max(0, Math.ceil((end - current) / 1000));
  }

  function load(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || {remaining:0,running:false,paused:false,endAt:0,label:''}; }
    catch(e){ return {remaining:0,running:false,paused:false,endAt:0,label:''}; }
  }
  function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }

  class RestTimer {
    constructor(){
      this.state = load();
      this.interval = null;
      this.audio = null;
      this.onTick = null;
      this.onFinish = null;
    }
    start(label='Rest', seconds=DEFAULT_SECONDS){
      const duration = clampSeconds(seconds);
      this.state = {remaining:duration,running:true,paused:false,endAt:Date.now()+duration*1000,label};
      save(this.state); this.ensureAudio(); this.schedule(); this.emit();
    }
    pause(){
      if(!this.state.running) return;
      this.state.remaining = remainingSeconds(this.state.endAt);
      this.state.running=false; this.state.paused=true; this.state.endAt=0;
      save(this.state); this.emit();
    }
    resume(){
      if(!this.state.paused || this.state.remaining<=0) return;
      this.state.running=true; this.state.paused=false; this.state.endAt=Date.now()+this.state.remaining*1000;
      save(this.state); this.schedule(); this.emit();
    }
    reset(){
      this.state={remaining:0,running:false,paused:false,endAt:0,label:''}; save(this.state); this.stopSchedule(); this.emit();
    }
    adjust(delta){
      const current = this.state.running ? remainingSeconds(this.state.endAt) : this.state.remaining;
      const next = Math.max(0,current+delta);
      if(this.state.running){ this.state.endAt=Date.now()+next*1000; }
      this.state.remaining=next; if(next===0){this.finish(); return;}
      save(this.state); this.schedule(); this.emit();
    }
    schedule(){
      this.stopSchedule();
      this.interval=setInterval(()=>this.tick(),250);
    }
    stopSchedule(){ if(this.interval){clearInterval(this.interval);this.interval=null;} }
    tick(){
      if(!this.state.running) return;
      const left=remainingSeconds(this.state.endAt);
      if(left<=0){this.finish();return;}
      this.state.remaining=left; save(this.state); this.emit();
    }
    finish(){
      const label=this.state.label;
      this.state={remaining:0,running:false,paused:false,endAt:0,label}; save(this.state); this.stopSchedule(); this.alert(); this.emit(); if(this.onFinish)this.onFinish(label);
    }
    emit(){ if(this.onTick)this.onTick(this.state); }
    ensureAudio(){
      try{ if(!this.audio) this.audio=new (window.AudioContext||window.webkitAudioContext)(); if(this.audio.state==='suspended')this.audio.resume(); }
      catch(e){}
    }
    alert(){
      try{ this.ensureAudio(); if(this.audio){const now=this.audio.currentTime; const osc=this.audio.createOscillator(); const gain=this.audio.createGain(); osc.type='sine'; osc.frequency.setValueAtTime(880,now); gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(.22,now+.02); gain.gain.exponentialRampToValueAtTime(.0001,now+.4); osc.connect(gain).connect(this.audio.destination); osc.start(now); osc.stop(now+.45);} }catch(e){}
      try{ if(navigator.vibrate)navigator.vibrate([220,100,220]); }catch(e){}
    }
  }

  global.BarbarianRest = {DEFAULT_SECONDS,clampSeconds,formatTime,remainingSeconds,RestTimer};
})(typeof window !== 'undefined' ? window : globalThis);
