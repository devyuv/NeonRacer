export class AudioManager {
  constructor(save){this.save=save;this.ctx=null;}
  init(){ if(this.ctx || !this.save.settings.sfx) return; try{this.ctx=new AudioContext();}catch{} }
  beep(freq=440,dur=.08,type="sine"){
    if(!this.ctx||!this.save.settings.sfx)return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=.035;o.connect(g).connect(this.ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+dur);o.stop(this.ctx.currentTime+dur);
  }
  countdown(n){this.init();this.beep(n===0?880:420,.11);}
  nitro(){this.init();this.beep(120,.2,"sawtooth");}
  crash(){this.init();this.beep(90,.16,"square");}
  finish(){this.init();this.beep(660,.12);setTimeout(()=>this.beep(880,.18),100);}
}