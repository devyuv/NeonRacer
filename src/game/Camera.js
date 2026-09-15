import * as THREE from "three";
export class RaceCamera {
  constructor(camera){this.camera=camera;this.shake=0;}
  impact(){this.shake=Math.max(this.shake,.32);}
  update(car,dt,boost=false){
    const back=new THREE.Vector3(-Math.sin(car.heading),0,-Math.cos(car.heading));
    const desired=car.mesh.position.clone().addScaledVector(back,8.2).add(new THREE.Vector3(0,4.8,0));
    this.camera.position.lerp(desired,1-Math.pow(.001,dt));
    const look=car.mesh.position.clone().add(new THREE.Vector3(0,1,2));
    this.camera.lookAt(look);
    this.camera.fov=THREE.MathUtils.lerp(this.camera.fov,boost?82:THREE.MathUtils.mapLinear(car.speed,0,210,65,76),.08);
    this.camera.updateProjectionMatrix();
    if(this.shake>0){this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake*.6;this.shake*=Math.pow(.02,dt);}
  }
}