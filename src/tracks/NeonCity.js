import * as THREE from 'three';
import { TrackBuilder } from './TrackManager.js';

// Original circuit layout - a flowing figure-eight-ish loop, all values are just
// coordinates and carry no reference to any real or copyrighted location.
const CONTROL_POINTS = [
  { x: 0, z: 0 },
  { x: 40, z: 10 },
  { x: 70, z: 40 },
  { x: 70, z: 90 },
  { x: 40, z: 120 },
  { x: -10, z: 120 },
  { x: -40, z: 95 },
  { x: -40, z: 55 },
  { x: -15, z: 35 },
  { x: -15, z: 10 },
];

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildNeonCity(graphicsTier = 'medium') {
  const track = new TrackBuilder(CONTROL_POINTS, {
    roadColor: 0x14141f,
    lineColor: 0x00e6ff,
    barrierColor: 0xff00c8,
    width: 12
  });

  const scene = new THREE.Group();
  scene.add(track.group);

  const rand = mulberry32(1337);
  const density = graphicsTier === 'low' ? 0.35 : graphicsTier === 'medium' ? 0.7 : 1.0;

  // Ground plane (city floor)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grass/terrain ring outside the road (simple color variation patches)
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x0e1b14, roughness: 1 });
  for (let i = 0; i < track.centerline.length; i += 6) {
    if (rand() > density) continue;
    const p = track.centerline[i];
    const patch = new THREE.Mesh(new THREE.CircleGeometry(6 + rand() * 6, 6), grassMat);
    patch.rotation.x = -Math.PI / 2;
    const offset = 18 + rand() * 20;
    const angle = rand() * Math.PI * 2;
    patch.position.set(p.x + Math.cos(angle) * offset, -0.03, p.z + Math.sin(angle) * offset);
    scene.add(patch);
  }

  // Buildings (instanced boxes with neon window strips) placed off-track along the route
  const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x11121c, roughness: 0.6, metalness: 0.3 });
  const buildingCount = Math.floor(70 * density);
  const buildingMesh = new THREE.InstancedMesh(buildingGeo, buildingMat, buildingCount);
  buildingMesh.castShadow = true;
  buildingMesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const neonWindowMat = new THREE.MeshBasicMaterial({ color: 0x00e6ff });
  const neonGroup = new THREE.Group();

  for (let i = 0; i < buildingCount; i++) {
    const idx = Math.floor(rand() * track.centerline.length);
    const p = track.centerline[idx];
    const nextP = track.centerline[(idx + 1) % track.centerline.length];
    const dir = new THREE.Vector2(nextP.x - p.x, nextP.z - p.z).normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x);
    const side = rand() > 0.5 ? 1 : -1;
    const distance = 16 + rand() * 26;
    const w = 5 + rand() * 8;
    const h = 8 + rand() * 34;
    const d = 5 + rand() * 8;
    const x = p.x + normal.x * side * distance;
    const z = p.z + normal.y * side * distance;

    dummy.position.set(x, h / 2, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.y = rand() * Math.PI;
    dummy.updateMatrix();
    buildingMesh.setMatrixAt(i, dummy.matrix);

    if (rand() > 0.5) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.4, h * 0.8), neonWindowMat);
      strip.position.set(x + Math.sin(dummy.rotation.y) * (w / 2 + 0.05), h / 2, z + Math.cos(dummy.rotation.y) * (w / 2 + 0.05));
      strip.rotation.y = dummy.rotation.y;
      strip.material = new THREE.MeshBasicMaterial({ color: rand() > 0.5 ? 0x00e6ff : 0xff00c8 });
      neonGroup.add(strip);
    }
  }
  scene.add(buildingMesh);
  scene.add(neonGroup);

  // Street lights along the track
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 5, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const lampGeo = new THREE.SphereGeometry(0.28, 8, 8);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c0, emissiveIntensity: 1.2 });
  const lightCount = Math.floor((graphicsTier === 'high' ? 40 : graphicsTier === 'medium' ? 22 : 10));
  for (let i = 0; i < track.centerline.length; i += Math.floor(track.centerline.length / lightCount) || 1) {
    const p = track.centerline[i];
    const nextP = track.centerline[(i + 1) % track.centerline.length];
    const dir = new THREE.Vector2(nextP.x - p.x, nextP.z - p.z).normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x);
    const side = (i % 2 === 0) ? 1 : -1;
    const dist = 7.5;
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(p.x + normal.x * side * dist, 2.5, p.z + normal.y * side * dist);
    pole.castShadow = true;
    scene.add(pole);
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(pole.position.x, 5.1, pole.position.z);
    scene.add(lamp);
    if (graphicsTier !== 'low') {
      const pl = new THREE.PointLight(0xfff2c0, 0.6, 14, 2);
      pl.position.copy(lamp.position);
      scene.add(pl);
    }
  }

  // Trees (simple cone + cylinder, scattered off the road)
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.4, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2b1c12 });
  const leafGeo = new THREE.ConeGeometry(1.1, 2.4, 7);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x0f3b2a, roughness: 0.9 });
  const treeCount = Math.floor(50 * density);
  for (let i = 0; i < treeCount; i++) {
    const idx = Math.floor(rand() * track.centerline.length);
    const p = track.centerline[idx];
    const nextP = track.centerline[(idx + 1) % track.centerline.length];
    const dir = new THREE.Vector2(nextP.x - p.x, nextP.z - p.z).normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x);
    const side = rand() > 0.5 ? 1 : -1;
    const dist = 10 + rand() * 30;
    const x = p.x + normal.x * side * dist;
    const z = p.z + normal.y * side * dist;
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 0.7, z);
    trunk.castShadow = true;
    scene.add(trunk);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(x, 2.3, z);
    leaf.castShadow = true;
    scene.add(leaf);
  }

  // Road signs
  const signGeo = new THREE.BoxGeometry(1.4, 1.0, 0.06);
  const signMat = new THREE.MeshStandardMaterial({ color: 0x111318, emissive: 0xff00c8, emissiveIntensity: 0.4 });
  for (let i = 0; i < track.centerline.length; i += 14) {
    const p = track.centerline[i];
    const nextP = track.centerline[(i + 1) % track.centerline.length];
    const dir = new THREE.Vector2(nextP.x - p.x, nextP.z - p.z).normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x);
    const side = -1;
    const dist = 7.2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), poleMat);
    post.position.set(p.x + normal.x * side * dist, 1.1, p.z + normal.y * side * dist);
    scene.add(post);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(post.position.x, 2.0, post.position.z);
    sign.rotation.y = Math.atan2(dir.x, dir.y);
    scene.add(sign);
  }

  // Distant mountains/hills backdrop
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x171a2c, roughness: 1 });
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const radius = 260 + rand() * 40;
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(60 + rand() * 40, 90 + rand() * 60, 5), mountainMat);
    mountain.position.set(Math.cos(angle) * radius + 15, -10, Math.sin(angle) * radius + 55);
    mountain.rotation.y = rand() * Math.PI;
    scene.add(mountain);
  }

  // Sky + clouds via a large inverted sphere with gradient-ish color and simple cloud sprites
  const skyGeo = new THREE.SphereGeometry(500, 16, 12);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x0a0a1e, side: THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  const cloudMat = new THREE.MeshBasicMaterial({ color: 0x1c1f38, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 18; i++) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(14 + rand() * 18, 6, 5), cloudMat);
    const angle = rand() * Math.PI * 2;
    const radius = 150 + rand() * 120;
    cloud.position.set(Math.cos(angle) * radius, 70 + rand() * 60, Math.sin(angle) * radius);
    cloud.scale.y = 0.4;
    scene.add(cloud);
  }

  // Fog for depth + performance (hides pop-in of distant objects)
  const fog = new THREE.FogExp2(0x0a0a14, graphicsTier === 'low' ? 0.006 : 0.0035);

  return {
    id: 'neon-city',
    name: 'Neon City',
    scene,
    track,
    fog,
    laps: 3,
    ambientColor: 0x1c2440,
    sunColor: 0x9fd4ff
  };
}
