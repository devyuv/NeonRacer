import {PlayerCar} from "../cars/PlayerCar.js";
import {AICar} from "../cars/AICar.js";
import {CARS} from "../cars/CarData.js";
import {resolveCarCollision} from "./Physics.js";
import {fmt} from "../ui/HUD.js";
export class RaceManager {
 constructor(scene,track,save,audio){
   this.scene=scene;this.track=track;this.save=save;this.audio=audio;this.cars=[];this.lapD=track.length;this.finished=false;this.lastLap=0;
 }
 start(){
   const player=new PlayerCar(CARS[0]); this.player=player;this.scene.add(player.mesh);player.mesh.position.copy(this.track.sample(0));player.mesh.position.x-=3;
   for(let i=0;i<5;i++){const ai=new AICar(CARS[(i+1)%CARS.length],i);ai.mesh.position.copy(this.track.sample(12+i*5));ai.mesh.position.x+=(i%2?2:-2);ai.heading=Math.atan2(this.track.tangent(12+i*5).x,this.track.tangent(12+i*5).z);this.scene.add(ai.mesh);this.cars.push(ai);}
   this.cars.unshift(player); this.finished=false;
 }
 update(dt,input,time,state){
   this.player.update(input,dt,this.track,state==="racing");
   for(let i=1;i<this.cars.length;i++)this.cars[i].updateAI(dt,this.track,time);
   for(let i=1;i<this.cars.length;i++)if(resolveCarCollision(this.player,this.cars[i]))this.audio.crash();
   const d=this.player.distance; const lap=Math.floor(d/this.lapD)+1;
   if(lap>this.lastLap+1){this.lastLap=lap-1;}
   return {lap:Math.min(lap,3),position:this.getPosition()};
 }
 getPosition(){
   const pd=this.player.distance;
   return 1+this.cars.slice(1).filter(c=>c.distance>pd).length;
 }
 finish(){
   const position=this.getPosition(), time=fmt(this.time||0);
   const coins=Math.max(50,300-(position-1)*40);
   this.save.coins+=coins;this.save.racePoints+=Math.max(10,120-(position-1)*15);if(position===1)this.save.trophies++;
   this.save.bestTimes["NEON CITY"]=Math.min(this.save.bestTimes["NEON CITY"]||Infinity,this.time||Infinity);
   return {position,time,bestLap:time,coins};
 }
 dispose(){for(const c of this.cars)this.scene.remove(c.mesh);this.cars=[];}
}