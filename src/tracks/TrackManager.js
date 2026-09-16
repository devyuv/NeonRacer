import * as THREE from 'three';

const ROAD_WIDTH = 11;
const ROAD_SEGMENTS_PER_UNIT = 0.35; // sample density along the curve

/**
 * Builds a closed race track from a list of {x,z} control points.
 * Returns the road mesh, a reusable curve, sampled centerline points,
 * a fast off-road distance sampler, and barrier meshes.
 */
export class TrackBuilder {
  constructor(controlPoints, options = {}) {
    this.options = {
      roadColor: options.roadColor ?? 0x1a1c28,
      lineColor: options.lineColor ?? 0x00e6ff,
      barrierColor: options.barrierColor ?? 0xff00c8,
      width: options.width ?? ROAD_WIDTH,
      ...options
    };

    const vec3Points = controlPoints.map(p => new THREE.Vector3(p.x, 0, p.z));
    this.curve = new THREE.CatmullRomCurve3(vec3Points, true, 'catmullrom', 0.5);

    const approxLength = this._estimateLength(vec3Points);
    this.sampleCount = Math.max(120, Math.floor(approxLength * ROAD_SEGMENTS_PER_UNIT));
    this.centerline = this.curve.getSpacedPoints(this.sampleCount);
    this.length = approxLength;

    this.group = new THREE.Group();
    this.group.name = 'track';

    this._buildRoad();
    this._buildBarriers();
    this._buildStartLine();
  }

  _estimateLength(points) {
    let len = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      len += a.distanceTo(b);
    }
    return len;
  }

  _getFrame(i) {
    const p = this.centerline[i];
    const pNext = this.centerline[(i + 1) % this.centerline.length];
    const dir = new THREE.Vector3().subVectors(pNext, p).normalize();
    const normal = new THREE.Vector3(-dir.z, 0, dir.x); // perpendicular on XZ plane
    return { p, dir, normal };
  }

  _buildRoad() {
    const halfW = this.options.width / 2;
    const n = this.centerline.length;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i < n; i++) {
      const { p, normal } = this._getFrame(i);
      const left = new THREE.Vector3().copy(p).addScaledVector(normal, -halfW);
      const right = new THREE.Vector3().copy(p).addScaledVector(normal, halfW);
      positions.push(left.x, 0, left.z, right.x, 0, right.z);
      uvs.push(0, i / n * 20, 1, i / n * 20);
    }

    for (let i = 0; i < n; i++) {
      const a = i * 2, b = i * 2 + 1;
      const c = ((i + 1) % n) * 2, d = ((i + 1) % n) * 2 + 1;
      indices.push(a, c, b, b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: this.options.roadColor,
      roughness: 0.75,
      metalness: 0.15
    });
    const roadMesh = new THREE.Mesh(geo, mat);
    roadMesh.receiveShadow = true;
    this.group.add(roadMesh);
    this.roadMesh = roadMesh;

    // Center dashed lane line using small emissive segments
    const lineMat = new THREE.MeshBasicMaterial({ color: this.options.lineColor });
    const dashGroup = new THREE.Group();
    for (let i = 0; i < n; i += 4) {
      const { p, dir } = this._getFrame(i);
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.2), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(p.x, 0.03, p.z);
      dash.rotation.z = -Math.atan2(dir.x, dir.z);
      dashGroup.add(dash);
    }
    this.group.add(dashGroup);

    // Edge stripes (glow lines at road edges)
    [-1, 1].forEach(side => {
      const edgePositions = [];
      for (let i = 0; i < n; i++) {
        const { p, normal } = this._getFrame(i);
        const edge = new THREE.Vector3().copy(p).addScaledVector(normal, side * (halfW - 0.4));
        edgePositions.push(edge.x, 0.04, edge.z);
      }
      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
      const edgeMat = new THREE.LineBasicMaterial({ color: this.options.lineColor, transparent: true, opacity: 0.8 });
      const loop = new THREE.LineLoop(edgeGeo, edgeMat);
      this.group.add(loop);
    });
  }

  _buildBarriers() {
    const halfW = this.options.width / 2 + 1.1;
    const n = this.centerline.length;
    const barrierGeo = new THREE.BoxGeometry(0.5, 1.0, 2.4);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: this.options.barrierColor,
      emissive: this.options.barrierColor,
      emissiveIntensity: 0.35,
      roughness: 0.4
    });

    const instanceStep = 3;
    const count = Math.ceil(n / instanceStep) * 2;
    const mesh = new THREE.InstancedMesh(barrierGeo, barrierMat, count);
    mesh.castShadow = true;
    let idx = 0;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < n; i += instanceStep) {
      const { p, dir, normal } = this._getFrame(i);
      const angle = -Math.atan2(dir.x, dir.z);
      [-1, 1].forEach(side => {
        const pos = new THREE.Vector3().copy(p).addScaledVector(normal, side * halfW);
        dummy.position.set(pos.x, 0.5, pos.z);
        dummy.rotation.set(0, angle, 0);
        dummy.updateMatrix();
        if (idx < count) {
          mesh.setMatrixAt(idx, dummy.matrix);
          idx++;
        }
      });
    }
    mesh.count = idx;
    this.group.add(mesh);
    this.barrierMesh = mesh;
  }

  _buildStartLine() {
    const halfW = this.options.width / 2;
    const { p, dir, normal } = this._getFrame(0);
    const angle = -Math.atan2(dir.x, dir.z);
    const checker = new THREE.Mesh(
      new THREE.PlaneGeometry(this.options.width, 3),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    checker.rotation.x = -Math.PI / 2;
    checker.rotation.z = angle;
    checker.position.set(p.x, 0.035, p.z);
    this.group.add(checker);
    void halfW; void normal;
    this.startPoint = p.clone();
    this.startHeading = Math.atan2(dir.x, dir.z);
  }

  /** Returns { distance, offRoad } for a world point, by scanning nearby centerline samples. */
  distanceFromCenter(x, z, searchIndexHint = -1) {
    let best = Infinity;
    const n = this.centerline.length;
    let start = 0, end = n;
    if (searchIndexHint >= 0) {
      start = Math.max(0, searchIndexHint - 12);
      end = Math.min(n, searchIndexHint + 12);
    }
    for (let i = start; i < end; i++) {
      const p = this.centerline[i];
      const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }

  isOffRoad(x, z, indexHint = -1) {
    return this.distanceFromCenter(x, z, indexHint) > this.options.width / 2 + 0.5;
  }

  /** Finds nearest centerline index by brute force (used sparingly - for progress/checkpoints). */
  nearestIndex(x, z) {
    let best = Infinity, bestI = 0;
    for (let i = 0; i < this.centerline.length; i++) {
      const p = this.centerline[i];
      const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
      if (d < best) { best = d; bestI = i; }
    }
    return bestI;
  }
}
