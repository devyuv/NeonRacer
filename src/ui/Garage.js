import {CARS} from "../cars/CarData.js";
export function garageHTML(save){
 const cards=CARS.map((c,i)=>`<div class="car-card"><div class="car-swatch" style="--car:${c.color}"></div><h3>${c.name}</h3><p>SPEED ${bar(c.speed,180,225)}</p><p>ACCEL ${bar(c.accel,0.65,.9)}</p><p>HANDLING ${bar(c.handling,.6,.95)}</p><p>NITRO ${bar(c.nitro,.7,.9)}</p><button data-car="${i}">${save.unlockedCars.includes(c.name)?"SELECT":"LOCKED"}</button></div>`).join("");
 return `<section class="screen panel"><button class="back" data-action="menu">← MENU</button><h1>GARAGE</h1><div class="garage-grid">${cards}</div></section>`;
}
function bar(v,min,max){const n=Math.round(Math.max(0,Math.min(1,(v-min)/(max-min)))*10);return "▮".repeat(n)+"▯".repeat(10-n)}