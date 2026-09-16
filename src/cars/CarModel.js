import * as THREE from 'three';

// Builds an original, simple procedural sports-car mesh out of primitive geometry.
// No external assets, no copyrighted designs - just an abstract low-poly car.
export function buildCarMesh(carDef, { withLights = true } = {}) {
  const group = new THREE.Group();
  group.name = 'car-' + carDef.id;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: carDef.color,
    metalness: 0.55,
    roughness: 0.35,
    envMapIntensity: 1.0
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: carDef.accentColor,
    metalness: 0.3,
    roughness: 0.5
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x111a22,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.75
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0c0c10, metalness: 0.6, roughness: 0.6 });

  // Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.32, 4.0), bodyMat);
  chassis.position.y = 0.36;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // Cabin / cockpit (tapered using scaled box for speed rather than heavy geometry)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 1.7), glassMat);
  cabin.position.set(0, 0.72, -0.1);
  cabin.castShadow = true;
  group.add(cabin);

  // Nose wedge (front)
  const noseGeo = new THREE.ConeGeometry(1.05, 1.1, 4);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.rotation.x = Math.PI / 2;
  nose.rotation.y = Math.PI / 4;
  nose.scale.set(0.95, 0.4, 1);
  nose.position.set(0, 0.42, 2.0);
  nose.castShadow = true;
  group.add(nose);

  // Rear spoiler
  const spoilerStand1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), darkMat);
  spoilerStand1.position.set(-0.7, 0.85, -1.85);
  group.add(spoilerStand1);
  const spoilerStand2 = spoilerStand1.clone();
  spoilerStand2.position.x = 0.7;
  group.add(spoilerStand2);
  const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.45), accentMat);
  spoilerWing.position.set(0, 1.02, -1.85);
  spoilerWing.castShadow = true;
  group.add(spoilerWing);

  // Side skirts / accent stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.06, 3.6), accentMat);
  stripe.position.y = 0.5;
  group.add(stripe);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.2, roughness: 0.8 });
  const wheelPositions = [
    [-0.95, 0.42, 1.3], [0.95, 0.42, 1.3],
    [-0.95, 0.42, -1.3], [0.95, 0.42, -1.3]
  ];
  const wheels = [];
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  });

  // Headlights
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.6 });
  const headlightGeo = new THREE.BoxGeometry(0.28, 0.12, 0.08);
  const hl1 = new THREE.Mesh(headlightGeo, headlightMat);
  hl1.position.set(-0.62, 0.46, 2.45);
  group.add(hl1);
  const hl2 = hl1.clone();
  hl2.position.x = 0.62;
  group.add(hl2);

  // Brake lights (emissive toggled at runtime via material)
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0xff2233, emissive: 0xff0000, emissiveIntensity: 0.4 });
  const brakeGeo = new THREE.BoxGeometry(0.32, 0.14, 0.06);
  const bl1 = new THREE.Mesh(brakeGeo, brakeMat);
  bl1.position.set(-0.6, 0.55, -2.02);
  group.add(bl1);
  const bl2 = bl1.clone();
  bl2.position.x = 0.6;
  group.add(bl2);

  let headlightLights = [];
  if (withLights) {
    const spot = new THREE.PointLight(0xbfe9ff, 0.6, 8, 2);
    spot.position.set(0, 0.5, 2.6);
    group.add(spot);
    headlightLights.push(spot);
  }

  group.traverse(obj => { if (obj.isMesh) { obj.castShadow = true; } });

  return {
    group,
    wheels,
    brakeMaterial: brakeMat,
    headlightLights
  };
}
