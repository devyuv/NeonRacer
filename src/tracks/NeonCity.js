import * as THREE from "three";

export class NeonCity {
  constructor(scene){
    this.scene=scene; this.roadHalfWidth=7; this.length=1500; this.segment=10;
    this.group=new THREE.Group(); scene.add(this.group); this.build();
  }
  sample(d){
    const L=this.length, t=((d%L)+L)%L;
    const a=t/L*Math.PI*2;
    return new THREE.Vector3(Math.sin(a)*58 + Math.sin(a*3)*9,0,Math.cos(a)*58 + Math.cos(a*2)*5);
  }
  tangent(d){
    const p=this.sample(d), q=this.sample(d+.5); return q.sub(p).normalize();
  }
  build(){
    const roadMat=new THREE.MeshStandardMaterial({color:0x171b28,roughness:.9});
    const edgeMat=new THREE.MeshBasicMaterial({color:0x00eaff});
    for(let d=0;d<this.length;d+=this.segment){
      const p=this.sample(d), tan=this.tangent(d), yaw=Math.atan2(tan.x,tan.z);
      const road=new THREE.Mesh(new THREE.BoxGeometry(this.roadHalfWidth*2,.16,this.segment+.3),roadMat);
      road.position.copy(p); road.position.y=-.05; road.rotation.y=yaw; this.group.add(road);
      if(d%20===0){
        const mark=new THREE.Mesh(new THREE.BoxGeometry(.16,.025,3.3),new THREE.MeshBasicMaterial({color:0xd9ffff}));
        mark.position.copy(p); mark.position.y=.06; mark.rotation.y=yaw; this.group.add(mark);
      }
      if(d%30===0) this.addBarrier(p,tan);
      if(d%50===0) this.addLamp(p,tan);
      if(d%40===0) this.addBuilding(p);
      if(d%70===0) this.addTree(p,tan);
    }
    const terrain=new THREE.Mesh(new THREE.CircleGeometry(110,48),new THREE.MeshStandardMaterial({color:0x061c16,roughness:1}));
    terrain.rotation.x=-Math.PI/2; terrain.position.y=-.25; this.group.add(terrain);
    const inner=new THREE.Mesh(new THREE.RingGeometry(40,50,64),new THREE.MeshBasicMaterial({color:0x09111f,side:THREE.DoubleSide}));
    inner.rotation.x=-Math.PI/2; inner.position.y=-.21; this.group.add(inner);
    for(let i=0;i<20;i++){
      const h=8+((i*37)%16), b=new THREE.Mesh(new THREE.BoxGeometry(4,h,4),new THREE.MeshStandardMaterial({color:0x11172a,roughness:.7}));
      const a=i/20*Math.PI*2; b.position.set(Math.sin(a)*78,h/2,Math.cos(a)*78); this.group.add(b);
    }
  }
  addBarrier(p,tan){
    const n=new THREE.Vector3(-tan.z,0,tan.x);
    for(const side of [-1,1]){
      const b=new THREE.Mesh(new THREE.BoxGeometry(.45,.7,9.2),new THREE.MeshStandardMaterial({color:0x2a3041,metalness:.5}));
      b.position.copy(p).addScaledVector(n,side*7.5); b.position.y=.35; b.rotation.y=Math.atan2(tan.x,tan.z); this.group.add(b);
      const glow=new THREE.Mesh(new THREE.BoxGeometry(.48,.08,8.8),new THREE.MeshBasicMaterial({color:side>0?0xff2fe6:0x2ff5ff}));
      glow.position.copy(b.position); glow.position.y=.72; glow.rotation.y=b.rotation.y; this.group.add(glow);
    }
  }
  addLamp(p,tan){
    const n=new THREE.Vector3(-tan.z,0,tan.x);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,5.5,8),new THREE.MeshStandardMaterial({color:0x303848,metalness:.8}));
    pole.position.copy(p).addScaledVector(n,10); pole.position.y=2.75; pole.rotation.y=Math.atan2(tan.x,tan.z); this.group.add(pole);
    const lamp=new THREE.PointLight(0x4defff,1.4,15); lamp.position.copy(pole.position); lamp.position.y=5.5; this.group.add(lamp);
  }
  addBuilding(p){
    const b=new THREE.Mesh(new THREE.BoxGeometry(6,10,6),new THREE.MeshStandardMaterial({color:0x0d1221,roughness:.8}));
    b.position.set(p.x*1.22,5,p.z*1.22); this.group.add(b);
    for(let y=2;y<9;y+=2) {
      const w=new THREE.Mesh(new THREE.BoxGeometry(4.6,.35,.08),new THREE.MeshBasicMaterial({color:(y%4?0x00eaff:0xff2fe6)}));
      w.position.set(b.position.x,b.position.y-5+y,b.position.z+3.04); this.group.add(w);
    }
  }
  addTree(p,tan){
    const n=new THREE.Vector3(-tan.z,0,tan.x);
    const x=p.clone().addScaledVector(n,14+Math.random()*5);
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,2,7),new THREE.MeshStandardMaterial({color:0x49321f}));
    trunk.position.set(x.x,1,x.z); this.group.add(trunk);
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.7,1),new THREE.MeshStandardMaterial({color:0x123d31,roughness:1}));
    crown.position.set(x.x,2.7,x.z); this.group.add(crown);
  }
}