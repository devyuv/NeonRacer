import * as THREE from "three";

function mat(color, emissive=0x000000, intensity=0) {
  return new THREE.MeshStandardMaterial({color, metalness:.65, roughness:.25, emissive, emissiveIntensity:intensity});
}
export function buildCar(color=0x2ff5ff, scale=1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9,.48,3.8), mat(color));
  body.position.y=.62; g.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.65,.20,1.35), mat(color, color, .12));
  hood.position.set(0,.89,.72); g.add(hood);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.35,.48,1.55), new THREE.MeshStandardMaterial({color:0x11192a,metalness:.5,roughness:.16}));
  cabin.position.set(0,1.02,-.35); g.add(cabin);
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.12,.42), new THREE.MeshBasicMaterial({color:0x63cfff,transparent:true,opacity:.34}));
  windshield.rotation.x=-Math.PI/2; windshield.rotation.z=0; windshield.position.set(0,1.28,.22); g.add(windshield);
  const wheelMat = mat(0x080a12);
  for (const x of [-.98,.98]) for (const z of [-1.15,1.15]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.22,12), wheelMat);
    w.rotation.z=Math.PI/2; w.position.set(x,.43,z); g.add(w);
  }
  const headMat = mat(0xdffcff,0x5defff,2.5), brakeMat = mat(0xff243f,0xff0025,2.2);
  for (const x of [-.58,.58]) {
    const h=new THREE.Mesh(new THREE.BoxGeometry(.34,.11,.06),headMat); h.position.set(x,.73,1.94); g.add(h);
    const b=new THREE.Mesh(new THREE.BoxGeometry(.34,.10,.06),brakeMat); b.position.set(x,.70,-1.94); g.add(b);
  }
  const glow = new THREE.PointLight(color, 1.2, 6); glow.position.y=.7; g.add(glow);
  g.scale.setScalar(scale);
  g.userData.wheels=g.children.filter(o=>o.geometry?.type==="CylinderGeometry");
  return g;
}

export class PlayerCar {
  constructor(data) {
    this.data=data; this.mesh=buildCar(data.color);
    this.speed=0; this.steer=0; this.nitro=100; this.drifting=false;
    this.lateral=0; this.heading=0; this.distance=0;
  }
  reset(){ this.speed=0; this.steer=0; this.nitro=100; this.distance=0; this.lateral=0; this.heading=0; this.mesh.position.set(0,.05,0); this.mesh.rotation.set(0,0,0); }
  update(input, dt, track, active=true) {
    if(!active) return;
    const boost=input.nitro && this.nitro>0;
    const max=this.data.speed*(boost?1.22:1);
    if(input.accel) this.speed += (this.data.accel*92)*dt;
    else this.speed -= 22*dt;
    if(input.brake) this.speed -= 105*dt;
    this.speed=THREE.MathUtils.clamp(this.speed,0,max);
    if(boost){this.speed=Math.min(max,this.speed+35*dt);this.nitro=Math.max(0,this.nitro-34*dt);}
    else this.nitro=Math.min(100,this.nitro+6*dt);
    this.drifting=Math.abs(input.steer)>.55 && this.speed>85;
    const turn=(this.drifting?0.86:1.0)*this.data.handling*(this.speed/this.data.speed);
    this.heading += input.steer*turn*1.7*dt;
    this.lateral += input.steer * (this.speed/105) * 5.0 * dt;
    this.lateral *= Math.pow(.78,dt*60);
    const forward=new THREE.Vector3(Math.sin(this.heading),0,Math.cos(this.heading));
    this.mesh.position.addScaledVector(forward,this.speed*dt/3.6);
    this.mesh.position.x += this.lateral*dt;
    this.mesh.rotation.y=this.heading;
    this.mesh.rotation.z=-input.steer*.09*(this.speed/this.data.speed);
    this.distance += this.speed*dt/3.6;
    const edge=track.roadHalfWidth;
    if(Math.abs(this.mesh.position.x)>edge){
      this.speed*=Math.pow(.92,dt*60);
      this.mesh.position.x=THREE.MathUtils.clamp(this.mesh.position.x,-edge-2,edge+2);
    }
    for(const w of this.mesh.userData.wheels) w.rotation.x -= this.speed*dt*.035;
  }
}