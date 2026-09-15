export class TouchControls {
  constructor(root){
    this.state={accel:true,brake:false,steer:0,nitro:false};
    root.innerHTML=`<div class="touch left"><button data-k="left" aria-label="Left">◀</button></div>
      <div class="touch right"><button data-k="right" aria-label="Right">▶</button><button data-k="brake" aria-label="Brake">■</button><button class="nitro" data-k="nitro" aria-label="Nitro">N₂</button></div>`;
    const set=(k,v)=>{ if(k==="left")this.state.steer=v?-1:(this.state.steer===-1?0:this.state.steer); if(k==="right")this.state.steer=v?1:(this.state.steer===1?0:this.state.steer); if(k==="brake")this.state.brake=v; if(k==="nitro")this.state.nitro=v; };
    root.querySelectorAll("button").forEach(b=>{
      const k=b.dataset.k;
      b.addEventListener("pointerdown",e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);b.classList.add("pressed");set(k,true);});
      ["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();b.classList.remove("pressed");set(k,false);}));
    });
  }
  update(){return this.state;}
}