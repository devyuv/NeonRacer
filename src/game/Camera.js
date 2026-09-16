import * as THREE from 'three';

export class ChaseCamera {
  constructor(camera) {
    this.camera = camera;
    this.baseFov = 62;
    this.maxFovBoost = 14;
    this.currentPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this._initialized = false;
    this.shakeTime = 0;
    this.shakeStrength = 0;
  }

  triggerShake(strength = 0.5, duration = 0.35) {
    this.shakeStrength = Math.max(this.shakeStrength, strength);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(dt, carMesh, carState, maxSpeed) {
    const heading = carMesh.rotation.y;
    const behindDist = 7.2;
    const height = 3.1;

    const desired = new THREE.Vector3(
      carMesh.position.x - Math.sin(heading) * behindDist,
      height,
      carMesh.position.z - Math.cos(heading) * behindDist
    );

    if (!this._initialized) {
      this.currentPos.copy(desired);
      this.currentLookAt.copy(carMesh.position);
      this._initialized = true;
    } else {
      this.currentPos.lerp(desired, Math.min(1, dt * 5.5));
    }

    const lookTarget = new THREE.Vector3(
      carMesh.position.x + Math.sin(heading) * 4,
      carMesh.position.y + 1.0,
      carMesh.position.z + Math.cos(heading) * 4
    );
    this.currentLookAt.lerp(lookTarget, Math.min(1, dt * 6));

    // Shake decay
    let shakeOffset = new THREE.Vector3();
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const t = Math.max(0, this.shakeTime);
      const s = this.shakeStrength * t;
      shakeOffset.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
      if (this.shakeTime <= 0) this.shakeStrength = 0;
    }

    this.camera.position.copy(this.currentPos).add(shakeOffset);
    this.camera.lookAt(this.currentLookAt);

    // Tilt (roll) into turns is handled via the car mesh roll for clarity on small screens;
    // the camera itself stays level to avoid disorientation.
    this.camera.rotation.z = 0;

    // FOV increases with speed / nitro for a sense of velocity
    const speedRatio = Math.min(1, Math.abs(carState.speed) / maxSpeed);
    const targetFov = this.baseFov + speedRatio * this.maxFovBoost + (carState.nitroActive ? 8 : 0);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 4);
    this.camera.updateProjectionMatrix();
  }
}
