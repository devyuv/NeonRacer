export function hudHTML(){
 return `<div id="countdown-overlay"></div><div class="hud-top"><div><small>POSITION</small><b id="pos">1 / 6</b></div><div><small>LAP</small><b id="lap">1 / 3</b></div><button id="pause">Ⅱ</button></div>
 <div class="hud-bottom"><div class="speed"><span id="speed">0</span><small>KM/H</small></div><div class="timer"><small>TIME</small><b id="time">00:00.00</b></div><div class="nitro-box"><small>NITRO</small><div class="bar"><i id="nitro"></i></div></div></div>`;
}
export function updateHUD(player,state,pos){
 const s=document.getElementById("speed"),t=document.getElementById("time"),l=document.getElementById("lap"),p=document.getElementById("pos"),n=document.getElementById("nitro");
 if(s)s.textContent=Math.round(player.speed); if(t)t.textContent=fmt(state.time); if(l)l.textContent=`${Math.min(state.lap,state.totalLaps)} / ${state.totalLaps}`; if(p)p.textContent=`${pos} / 6`; if(n)n.style.width=`${player.nitro}%`;
}
export function fmt(s){const m=Math.floor(s/60),sec=(s%60).toFixed(2).padStart(5,"0");return `${String(m).padStart(2,"0")}:${sec}`;}