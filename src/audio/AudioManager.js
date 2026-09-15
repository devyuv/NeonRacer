export class AudioManager {
  constructor(save){this.save=save;this.ctx=null;this.musicGain=null;this.sfxGain=null;this.musicTimer=null;this.musicStep=0;}

  init(){
    if(this.ctx){ if(this.ctx.state==='suspended') this.ctx.resume().catch(()=>{}); return; }
    try{
      this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      this.musicGain=this.ctx.createGain();this.musicGain.gain.value=this.save.settings.music?.35:0;this.musicGain.connect(this.ctx.destination);
      this.sfxGain=this.ctx.createGain();this.sfxGain.gain.value=this.save.settings.sfx?.55:0;this.sfxGain.connect(this.ctx.destination);
      if(this.save.settings.music)this.startMusic();
    }catch{}
  }

  startMusic(){
    if(!this.ctx||!this.save.settings.music||this.musicTimer)return;
    const notes=[110,130.81,146.83,164.81,196,164.81,146.83,130.81];
    const play=()=>{
      if(!this.ctx||!this.musicGain||!this.save.settings.music)return;
      const now=this.ctx.currentTime;
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type='triangle';o.frequency.value=notes[this.musicStep++%notes.length];
      g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.055,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+.42);
      o.connect(g).connect(this.musicGain);o.start(now);o.stop(now+.45);
    };
    play();this.musicTimer=setInterval(play,450);
  }

  stopMusic(){if(this.musicTimer){clearInterval(this.musicTimer);this.musicTimer=null;}}
  setMusic(enabled){this.save.settings.music=enabled;if(!this.ctx)return;if(enabled){this.musicGain.gain.setTargetAtTime(.35,this.ctx.currentTime,.03);this.startMusic();}else{this.musicGain.gain.setTargetAtTime(0,this.ctx.currentTime,.03);this.stopMusic();}}
  setSfx(enabled){this.save.settings.sfx=enabled;if(this.sfxGain&&this.ctx)this.sfxGain.gain.setTargetAtTime(enabled?.55:0,this.ctx.currentTime,.03);}

  beep(freq=440,dur=.08,type='sine'){
    this.init();if(!this.ctx||!this.save.settings.sfx)return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=.06;o.connect(g).connect(this.sfxGain||this.ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+dur);o.stop(this.ctx.currentTime+dur);
  }
  countdown(n){this.init();this.beep(n===0?880:420,.11);}
  nitro(){this.init();this.beep(120,.2,'sawtooth');}
  crash(){this.init();this.beep(90,.16,'square');}
  finish(){this.init();this.beep(660,.12);setTimeout(()=>this.beep(880,.18),100);}
}
