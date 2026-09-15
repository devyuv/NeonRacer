import * as THREE from "three";
import {TrackManager} from "../tracks/TrackManager.js";
import {RaceManager} from "./RaceManager.js";
import {RaceCamera} from "./Camera.js";
import {GameState,STATE} from "./GameState.js";
import {KeyboardControls} from "../controls/KeyboardControls.js";
import {TouchControls} from "../controls/TouchControls.js";
import {hudHTML, updateHUD} from "../ui/HUD.js";
import {vibrate} from "../utils/DeviceDetection.js";

export class Game {
 constructor(root,save,audio,onResult,onMenu){
  this.root=root;this.save=save;this.audio=audio;this.onResult=onResult;this.onMenu=onMenu;
  this.state=new GameState();this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x050711);
  this.scene.fog=new THREE.FogExp2(0x07101f,.008);
  this.camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,600);this.camera.position.set(0,6,10);
  this.renderer=new THREE.WebGLRenderer({antialias:save.settings.graphics!=="LOW",powerPreference:"high-performance"});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,save.settings.graphics==="HIGH"?1.8:1.35));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=save.settings.graphics!=="LOW";
  root.querySelector("#webgl").appendChild(this.renderer.domElement);
  this.scene.add(new THREE.HemisphereLight(0x8beaff,0x07140e,1.2));
  const sun=new THREE.DirectionalLight(0xffffff,1.2);sun.position.set(30,50,20);sun.castShadow=false;this.scene.add(sun);
  this.track=new TrackManager(this.scene).load();this.race=new RaceManager(this.scene,this.track,save,audio);this.race.start();this.cam=new RaceCamera(this.camera);
  this.keys=new KeyboardControls();this.touch=new TouchControls(root.querySelector("#controls"));this.hud=root.querySelector("#hud");this.hud.innerHTML=hudHTML();
  this.running=true;this.last=performance.now();this.count=3;this.countClock=0;this.race.time=0;
  this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);};
  addEventListener("resize",this.resize);this.loop();
 }
 startCountdown(){this.state.state=STATE.COUNTDOWN;this.count=3;this.countClock=0;this.audio.countdown(3);}
 loop(){
  if(!this.running)return;requestAnimationFrame(()=>this.loop());
  const now=performance.now(),dt=Math.min(.033,(now-this.last)/1000);this.last=now;
  if(this.state.state===STATE.COUNTDOWN){this.countClock+=dt;if(this.countClock>1){this.count--;this.countClock=0;this.audio.countdown(this.count);if(this.count<=0){this.state.state=STATE.RACING;this.countClock=0;}}}
  if(this.state.state===STATE.RACING){
    this.race.time+=dt;const input=this.keys.update();const touch=this.touch.update();
    const merged={accel:input.accel||touch.accel,brake:input.brake||touch.brake,steer:input.steer||touch.steer,nitro:input.nitro||touch.nitro};
    if(merged.nitro && this.race.player.nitro>0 && !this.wasNitro){this.audio.nitro();vibrate(35,this.save.settings.vibration);}
    this.wasNitro=merged.nitro;
    const r=this.race.update(dt,merged,this.race.time,"racing");this.state.lap=r.lap;updateHUD(this.race.player,this.state,r.position);
    if(r.lap>3){this.finish();return;}
    if(this.race.time>0 && this.race.player.distance>=this.track.length*3){this.finish();return;}
  } else updateHUD(this.race.player,this.state,this.race.getPosition());
  this.cam.update(this.race.player,dt,this.wasNitro);this.renderer.render(this.scene,this.camera);
  const cd=document.getElementById("countdown-overlay");if(cd)cd.textContent=this.state.state===STATE.COUNTDOWN?(this.count>0?this.count:"GO!"):"";
 }
 finish(){this.state.state=STATE.RESULTS;this.race.time=this.race.time;this.audio.finish();vibrate(100,this.save.settings.vibration);this.running=false;this.onResult(this.race.finish());}
 pause(){if(this.state.state===STATE.RACING)this.state.state=STATE.PAUSED;else if(this.state.state===STATE.PAUSED)this.state.state=STATE.RACING;}
 dispose(){this.running=false;removeEventListener("resize",this.resize);this.race.dispose();this.renderer.dispose();this.root.querySelector("#webgl").innerHTML="";this.root.querySelector("#hud").innerHTML="";this.root.querySelector("#controls").innerHTML="";}
}