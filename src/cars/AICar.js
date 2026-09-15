import {PlayerCar} from "./PlayerCar.js";
export class AICar extends PlayerCar {
  constructor(data,index){ super(data); this.index=index; this.phase=index*1.7; this.targetSpeed=data.speed*(.82+(index%3)*.045); }
  updateAI(dt, track, raceTime) {
    const t=(raceTime*.055*this.targetSpeed + this.phase) % track.length;
    const p=track.sample(t);
    const ahead=track.sample((t+7)%track.length);
    const dx=ahead.x-this.mesh.position.x;
    const desired=Math.atan2(ahead.x-this.mesh.position.x,ahead.z-this.mesh.position.z);
    let err=desired-this.heading; while(err>Math.PI)err-=Math.PI*2; while(err<-Math.PI)err+=Math.PI*2;
    const steer=Math.max(-1,Math.min(1,err*2.4 + Math.sin(raceTime*.8+this.phase)*.08));
    const input={accel:true,brake:false,steer};
    this.speed += (this.targetSpeed-this.speed)*dt*.9;
    this.speed=Math.min(this.speed,this.targetSpeed);
    const forward={x:Math.sin(this.heading),z:Math.cos(this.heading)};
    this.heading += steer*this.data.handling*(this.speed/this.data.speed)*1.55*dt;
    this.mesh.position.x += forward.x*this.speed*dt/3.6;
    this.mesh.position.z += forward.z*this.speed*dt/3.6;
    this.mesh.rotation.y=this.heading;
    this.mesh.rotation.z=-steer*.06;
    this.distance += this.speed*dt/3.6;
    if(this.mesh.position.distanceTo(p)>14){this.mesh.position.x=p.x;this.mesh.position.z=p.z;}
  }
}