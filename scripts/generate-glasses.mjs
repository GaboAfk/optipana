import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import validator from "gltf-validator";

const output = new URL("../public/glasses_models/", import.meta.url);
const definitions = [
  {
    id: "209833317-orange",
    productId: 8,
    name: "Oversize Naranja",
    reference: "/glasses_catalog/209833317-1-orange.jpg",
    orange: true,
    half: [[0, 9], [9, 9], [22, 29], [58, 28], [69, 10], [76, 6], [76, -6], [64, -29], [55, -32], [25, -30], [17, -22], [10, -1], [7, 3], [0, 3]],
    lens: [[18, 12], [26, 23], [54, 22], [63, 9], [66, -7], [57, -24], [30, -24], [21, -18], [15, -1]],
    lensCenter: [40, -1],
    hingeX: 74,
    hingeY: 1,
    depth: 5,
    bevel: 0.85,
    sag: 6,
  },
  {
    id: "209833300-red",
    productId: 6,
    name: "Rectangular Rubí",
    reference: "/glasses_catalog/209833300-1-red.jpg",
    orange: false,
    half: [[0, 10], [12, 12], [31, 15], [51, 14], [64, 11], [71, 10], [71, 0], [65, -2], [62, -22], [55, -26], [29, -25], [20, -21], [15, -6], [10, 2], [0, 3]],
    lens: [[12, 7], [30, 12], [54, 11], [62, 7], [60, -13], [55, -22], [30, -21], [22, -17], [17, -6]],
    lensCenter: [37, -5],
    hingeX: 69,
    hingeY: 5,
    depth: 3.6,
    bevel: 0.55,
    sag: 4,
  },
];

class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.({ target: this });
    }, (error) => this.onerror?.(error));
  }
}

globalThis.FileReader ??= NodeFileReader;

function roundedPath(points, radius = 6, Shape = THREE.Shape) {
  const path = new Shape();
  const vertices = points.map(([x, y]) => new THREE.Vector2(x, y));
  vertices.forEach((point, i) => {
    const previous = vertices[(i + vertices.length - 1) % vertices.length];
    const next = vertices[(i + 1) % vertices.length];
    const distance = Math.min(radius, point.distanceTo(previous) * 0.35, point.distanceTo(next) * 0.35);
    const entry = point.clone().lerp(previous, distance / point.distanceTo(previous));
    const exit = point.clone().lerp(next, distance / point.distanceTo(next));
    if (i === 0) path.moveTo(entry.x, entry.y);
    else path.lineTo(entry.x, entry.y);
    path.quadraticCurveTo(point.x, point.y, exit.x, exit.y);
  });
  path.closePath();
  return path;
}

function surfaceZ(x, y, definition) {
  return -definition.sag * (x / 76) ** 2 - y * 0.035;
}

function finishGeometry(geometry) {
  geometry.deleteAttribute("uv");
  geometry.deleteAttribute("normal");
  geometry.clearGroups();
  const smooth = mergeVertices(geometry, 0.0001);
  smooth.computeVertexNormals();
  return smooth;
}

function acetateColor(x, y, z, orange) {
  if (!orange) {
    const edge = 0.5 + 0.5 * Math.sin(x * 0.09 + y * 0.16 + z * 0.035);
    return new THREE.Color("#8d071a").lerp(new THREE.Color("#ed182c"), 0.5 + edge * 0.5);
  }
  const wave = Math.sin(x * 0.29 + Math.sin(y * 0.31) * 2 + z * 0.06)
    + 0.6 * Math.sin(y * 0.49 - x * 0.19 + z * 0.12);
  const patch = THREE.MathUtils.smoothstep(wave, 0.1, 1.25);
  const amber = THREE.MathUtils.smoothstep(-y, 13, 33);
  const color = new THREE.Color("#813211").lerp(new THREE.Color("#cf740d"), amber);
  return color.lerp(new THREE.Color("#281a17"), Math.min(0.93, patch * 0.8 + (1 - amber) * 0.25));
}

function colorAcetate(geometry, orange) {
  const position = geometry.getAttribute("position");
  const colors = [];
  for (let i = 0; i < position.count; i++) {
    const color = acetateColor(position.getX(i), position.getY(i), position.getZ(i), orange);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}

function addMesh(parent, name, geometry, material) {
  geometry.scale(0.001, 0.001, 0.001);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function subdivideSurface(geometry, maxEdge = 5) {
  const positions = geometry.attributes.position;
  const result = [];
  const split = (a, b, c) => {
    const ab = a.distanceToSquared(b);
    const bc = b.distanceToSquared(c);
    const ca = c.distanceToSquared(a);
    if (Math.max(ab, bc, ca) <= maxEdge * maxEdge) {
      result.push(...a.toArray(), ...b.toArray(), ...c.toArray());
      return;
    }
    if (bc >= ab && bc >= ca) [a, b, c] = [b, c, a];
    else if (ca >= ab && ca >= bc) [a, b, c] = [c, a, b];
    const middle = a.clone().lerp(b, 0.5);
    split(a, middle, c);
    split(middle, b, c);
  };
  for (let i = 0; i < positions.count; i += 3) {
    split(...[0, 1, 2].map((j) => new THREE.Vector3().fromBufferAttribute(positions, i + j)));
  }
  return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(result, 3));
}

function frontGeometry(definition) {
  const { half, lens, depth, bevel } = definition;
  const outline = [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
  const shape = roundedPath(outline);
  for (const side of [-1, 1]) {
    shape.holes.push(roundedPath(lens.map(([x, y]) => [side * x, y]), 7, THREE.Path));
  }
  const geometry = subdivideSurface(new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, steps: 1, curveSegments: 5,
  }));
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    position.setZ(i, position.getZ(i) - depth / 2 + surfaceZ(x, y, definition));
  }
  return finishGeometry(geometry);
}

function lensGeometry(definition, side) {
  const contour = roundedPath(definition.lens, 7).getPoints(6);
  if (contour[0].distanceTo(contour.at(-1)) < 0.0001) contour.pop();
  const [cx, cy] = definition.lensCenter;
  const positions = [];
  const indices = [];
  const addPoint = (x, y, bulge) => positions.push(side * x, y, surfaceZ(x, y, definition) + 0.15 + bulge);
  addPoint(cx, cy, 0.65);
  const rings = 5;
  for (let ring = 1; ring <= rings; ring++) {
    const t = ring / rings;
    for (const point of contour) {
      addPoint(THREE.MathUtils.lerp(cx, point.x, t), THREE.MathUtils.lerp(cy, point.y, t), 0.65 * (1 - t * t));
    }
  }
  const count = contour.length;
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    indices.push(0, 1 + i, 1 + next);
    for (let ring = 0; ring < rings - 1; ring++) {
      const a = 1 + ring * count + i;
      const b = 1 + ring * count + next;
      indices.push(a, a + count, b + count, a, b + count, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const a = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, indices[0]);
  const b = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, indices[1]);
  const c = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, indices[2]);
  if (b.sub(a).cross(c.sub(a)).z < 0) {
    for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    geometry.setIndex(indices);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function templeGeometry(definition, side) {
  const { hingeX: x, hingeY: y, orange } = definition;
  const z = surfaceZ(x, y, definition) - definition.depth / 2;
  const curve = new THREE.CatmullRomCurve3([
    [x, y, z], [x + 1, y, -17], [x + 0.5, y + 0.5, -45],
    [x - 1, y + 2, -83], [x - 3, y + 3, -108],
    [x - 6, y - 1, -121], [x - 9, y - 14, -137], [x - 10, y - 19, -140],
  ].map(([px, py, pz]) => new THREE.Vector3(side * px, py, pz)));
  const positions = [];
  const indices = [];
  const segments = 70;
  const sides = 12;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const across = new THREE.Vector3(0, 1, 0).cross(tangent).normalize();
    const up = tangent.clone().cross(across).normalize();
    const taper = t > 0.94 ? THREE.MathUtils.lerp(1, 0.12, (t - 0.94) / 0.06) : 1;
    const width = (orange ? 2.1 : 1.65) * taper;
    const height = THREE.MathUtils.lerp(orange ? 5.7 : 4.1, 2.5, THREE.MathUtils.smoothstep(t, 0.1, 0.9)) * taper;
    for (let j = 0; j < sides; j++) {
      const theta = 2 * Math.PI * j / sides;
      const rectangular = (v) => Math.sign(v) * Math.abs(v) ** 0.5;
      const point = center.clone().addScaledVector(across, width * rectangular(Math.cos(theta)))
        .addScaledVector(up, height * rectangular(Math.sin(theta)));
      positions.push(...point.toArray());
      if (i < segments) {
        const a = i * sides + j;
        const b = i * sides + (j + 1) % sides;
        indices.push(a, b, b + sides, a, b + sides, a + sides);
      }
    }
  }
  for (const end of [0, segments]) {
    const index = positions.length / 3;
    positions.push(...curve.getPoint(end / segments).toArray());
    for (let j = 0; j < sides; j++) {
      const a = end * sides + j;
      const b = end * sides + (j + 1) % sides;
      indices.push(...(end === 0 ? [index, b, a] : [index, a, b]));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildModel(definition) {
  const root = new THREE.Group();
  root.name = definition.id;
  root.userData = {
    productId: definition.productId, sourceImage: definition.reference,
    fidelity: "Procedural visual approximation; not a scan or a measured optical fitting.",
    units: "meters", axes: { x: "right in an unmirrored front view", y: "up", z: "forward, away from the wearer" },
    origin: "bridge_anchor; estimated nose bridge alignment point",
    dimensionsEstimated: true, templePose: "open", lensRendering: "alpha blend for camera compositing; no optical prescription",
    sideNaming: "negative_x / positive_x are model coordinates, not anatomical left / right",
  };
  const acetate = new THREE.MeshPhysicalMaterial({
    name: definition.orange ? "amber_tortoiseshell_acetate" : "ruby_acetate",
    color: "#ffffff", vertexColors: true, roughness: 0.23, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.14,
  });
  const lenses = new THREE.MeshPhysicalMaterial({
    name: definition.orange ? "orange_tinted_lenses" : "clear_lenses",
    color: definition.orange ? "#f6a323" : "#dae7ed", roughness: 0.12, metalness: 0,
    transparent: true, opacity: definition.orange ? 0.36 : 0.055,
    side: THREE.DoubleSide, depthWrite: false, clearcoat: 0.45, clearcoatRoughness: 0.1,
  });
  const metal = new THREE.MeshStandardMaterial({ name: "silver_hardware", color: "#c8c4b7", metalness: 0.8, roughness: 0.27 });
  const front = frontGeometry(definition);
  colorAcetate(front, definition.orange);
  addMesh(root, "frame_front", front, acetate);
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? "negative_x" : "positive_x";
    addMesh(root, `lens_${suffix}`, lensGeometry(definition, side), lenses);
    const temple = templeGeometry(definition, side);
    colorAcetate(temple, definition.orange);
    addMesh(root, `temple_${suffix}`, temple, acetate);
    const x = side * definition.hingeX;
    const y = definition.hingeY;
    const hinge = new THREE.CylinderGeometry(1.1, 1.1, definition.orange ? 7 : 5, 12);
    hinge.translate(x, y, surfaceZ(x, y, definition) - definition.depth / 2 - 1);
    addMesh(root, `hinge_${suffix}`, hinge, metal);
    for (const [i, dy] of [-2.1, 2.1].entries()) {
      const pin = definition.orange
        ? new THREE.BoxGeometry(4.0, 1.3, 0.55)
        : new THREE.CylinderGeometry(0.85, 0.85, 0.55, 16);
      if (!definition.orange) pin.rotateX(Math.PI / 2);
      pin.translate(x - side * 0.6, y + dy, surfaceZ(x, y + dy, definition) + definition.depth / 2 + definition.bevel + 0.15);
      addMesh(root, `rivet_${suffix}_${i + 1}`, pin, metal);
    }
    const anchor = new THREE.Object3D();
    anchor.name = `lens_center_${suffix}`;
    anchor.position.set(side * definition.lensCenter[0] * 0.001, definition.lensCenter[1] * 0.001, (surfaceZ(...definition.lensCenter, definition) + 0.8) * 0.001);
    anchor.userData.role = "Geometric lens center, not a measured pupil position";
    root.add(anchor);
  }
  const bridge = new THREE.Object3D();
  bridge.name = "bridge_anchor";
  root.add(bridge);
  root.updateMatrixWorld(true);
  return root;
}

function inspectModel(root) {
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  let triangles = 0;
  let meshes = 0;
  root.traverse((object) => {
    if (!object.isMesh) return;
    meshes++;
    const { geometry } = object;
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    assert(positions && normals, `${object.name}: missing positions/normals`);
    assert([...positions.array, ...normals.array].every(Number.isFinite), `${object.name}: non-finite geometry`);
    const count = geometry.index?.count ?? positions.count;
    assert.equal(count % 3, 0);
    triangles += count / 3;
    for (let i = 0; i < normals.count; i++) {
      const length = new THREE.Vector3().fromBufferAttribute(normals, i).length();
      assert(Math.abs(length - 1) < 0.001, `${object.name}: invalid normal`);
    }
  });
  assert(size.x > 0.13 && size.x < 0.17, "Unexpected frame width in meters");
  assert(size.y > 0.03 && size.y < 0.07, "Unexpected frame height in meters");
  assert(size.z > 0.13 && size.z < 0.16, "Unexpected temple depth in meters");
  assert(triangles < 30000, "Mobile triangle budget exceeded");
  for (const name of ["frame_front", "lens_negative_x", "lens_positive_x", "temple_negative_x", "temple_positive_x", "bridge_anchor"]) {
    assert(root.getObjectByName(name), `Missing ${name}`);
  }
  const anchor = root.getObjectByName("bridge_anchor");
  assert.equal(anchor.getWorldPosition(new THREE.Vector3()).length(), 0);
  return { meshes, triangles, estimatedBoundsMm: size.toArray().map((v) => Number((v * 1000).toFixed(2))) };
}

async function validateGlb(bytes, definition) {
  assert(bytes.byteLength < 1024 * 1024, "GLB must stay under 1 MiB");
  assert.equal(bytes.toString("utf8", 0, 4), "glTF");
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.byteLength);
  const json = JSON.parse(bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)));
  assert(json.buffers.every((buffer) => !buffer.uri), "GLB must be self-contained");
  assert(!json.images?.some((image) => image.uri), "No external image dependencies");
  const report = await validator.validateBytes(new Uint8Array(bytes), { uri: `${definition.id}.glb` });
  assert.equal(report.issues.numErrors, 0, JSON.stringify(report.issues, null, 2));
  assert.equal(report.issues.numWarnings, 0, JSON.stringify(report.issues, null, 2));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  gltf.scene.updateMatrixWorld(true);
  const stats = inspectModel(gltf.scene);
  const frame = gltf.scene.getObjectByName("frame_front");
  for (const side of [-1, 1]) {
    const [x, y] = definition.lensCenter;
    const ray = new THREE.Raycaster(new THREE.Vector3(side * x * 0.001, y * 0.001, 0.1), new THREE.Vector3(0, 0, -1));
    assert.equal(ray.intersectObject(frame).length, 0, "Frame must not fill lens openings");
    const lens = gltf.scene.getObjectByName(`lens_${side < 0 ? "negative_x" : "positive_x"}`);
    assert(ray.intersectObject(lens).length > 0, "Lens must cover its opening");
    assert(lens.material.transparent && lens.material.opacity < 0.5);
  }
  const bridgeRay = new THREE.Raycaster(new THREE.Vector3(0, 0.006, 0.1), new THREE.Vector3(0, 0, -1));
  assert(bridgeRay.intersectObject(frame).length > 0, "Bridge must connect the frame");
  return { ...stats, bytes: bytes.byteLength, validation: { errors: 0, warnings: 0 }, scene: gltf.scene };
}

function previewSvg(scene, definition) {
  const width = 1200;
  const height = 800;
  const panels = [
    { position: [0.2, 0.125, 0.31], target: [0, -0.003, -0.046], center: [600, 250], scale: 3700, label: "Vista 3/4", labelY: 55 },
    { position: [0, 0, 0.4], target: [0, -0.003, 0], center: [600, 610], scale: 4800, label: "Vista frontal", labelY: 435 },
  ];
  const light = new THREE.Vector3(-0.35, 0.7, 1).normalize();
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="1200" height="800" fill="#f3f0ec"/><text x="36" y="34" font-family="sans-serif" font-size="23" fill="#252525">${definition.name} · aproximación 3D</text>`;
  for (const panel of panels) {
    const eye = new THREE.Vector3(...panel.position);
    const target = new THREE.Vector3(...panel.target);
    const forward = eye.clone().sub(target).normalize();
    const right = new THREE.Vector3(0, 1, 0).cross(forward).normalize();
    const up = forward.clone().cross(right);
    const faces = [];
    scene.traverse((object) => {
      if (!object.isMesh) return;
      const { geometry, material } = object;
      const position = geometry.attributes.position;
      const color = geometry.attributes.color;
      const normal = geometry.attributes.normal;
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
      const count = geometry.index?.count ?? position.count;
      if (object.name.startsWith("lens_")) {
        const contourCount = (position.count - 1) / 5;
        const points = Array.from({ length: contourCount }, (_, i) => new THREE.Vector3()
          .fromBufferAttribute(position, position.count - contourCount + i).applyMatrix4(object.matrixWorld));
        const coordinates = points.map((point) => {
          const relative = point.clone().sub(target);
          return `${(panel.center[0] + relative.dot(right) * panel.scale).toFixed(2)},${(panel.center[1] - relative.dot(up) * panel.scale).toFixed(2)}`;
        }).join(" ");
        faces.push({ depth: points.reduce((sum, point) => sum + point.dot(forward), 0) / points.length,
          coordinates, color: `#${material.color.getHexString()}`, opacity: material.opacity });
        return;
      }
      for (let i = 0; i < count; i += 3) {
        const ids = [0, 1, 2].map((j) => geometry.index ? geometry.index.getX(i + j) : i + j);
        const points = ids.map((id) => new THREE.Vector3().fromBufferAttribute(position, id).applyMatrix4(object.matrixWorld));
        const faceNormal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
        if (material.side !== THREE.DoubleSide && faceNormal.dot(forward) <= 0) continue;
        const n = ids.reduce((sum, id) => sum.add(new THREE.Vector3().fromBufferAttribute(normal, id)), new THREE.Vector3()).applyNormalMatrix(normalMatrix).normalize();
        if (n.dot(forward) < 0) n.negate();
        const shade = 0.48 + 0.52 * Math.max(0, n.dot(light));
        const tint = color ? new THREE.Color().setRGB(...[0, 1, 2].map((component) => ids.reduce((sum, id) => sum + color.array[id * 3 + component], 0) / 3)) : material.color.clone();
        if (color) tint.multiply(material.color);
        tint.multiplyScalar(shade);
        const half = light.clone().add(forward).normalize();
        tint.lerp(new THREE.Color("#ffffff"), 0.25 * Math.max(0, n.dot(half)) ** 48);
        const coordinates = points.map((point) => {
          const relative = point.clone().sub(target);
          return `${(panel.center[0] + relative.dot(right) * panel.scale).toFixed(2)},${(panel.center[1] - relative.dot(up) * panel.scale).toFixed(2)}`;
        }).join(" ");
        faces.push({ depth: points.reduce((sum, point) => sum + point.dot(forward), 0) / 3, coordinates, color: `#${tint.getHexString()}`, opacity: material.opacity });
      }
    });
    faces.sort((a, b) => a.depth - b.depth);
    svg += `<text x="36" y="${panel.labelY + 30}" font-family="sans-serif" font-size="16" fill="#666">${panel.label}</text><g stroke-linejoin="round">`;
    for (const face of faces) {
      svg += `<polygon points="${face.coordinates}" fill="${face.color}" fill-opacity="${face.opacity}"${face.opacity === 1 ? ` stroke="${face.color}" stroke-width="0.35"` : ""}/>`;
    }
    svg += "</g>";
  }
  return `${svg}<text x="36" y="779" font-family="sans-serif" font-size="14" fill="#666">Medidas estimadas · Vista geométrica con iluminación simplificada; el material final depende del visor GLB.</text></svg>`;
}

const checkOnly = process.argv.includes("--check");
if (!checkOnly) await mkdir(output, { recursive: true });
const manifest = { version: 1, units: "meters", dimensionsEstimated: true, models: [] };
for (const definition of definitions) {
  const url = new URL(`${definition.id}.glb`, output);
  let bytes;
  if (checkOnly) bytes = await readFile(url);
  else {
    const root = buildModel(definition);
    inspectModel(root);
    bytes = Buffer.from(await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: false }));
  }
  const { scene, ...stats } = await validateGlb(bytes, definition);
  if (!checkOnly) {
    await writeFile(url, bytes);
    await writeFile(new URL(`${definition.id}-preview.svg`, output), previewSvg(scene, definition));
  }
  manifest.models.push({
    id: definition.id, productId: definition.productId, name: definition.name,
    url: `/glasses_models/${definition.id}.glb`, referenceImage: definition.reference,
    preview: `/glasses_models/${definition.id}-preview.svg`, ...stats,
  });
  console.log(`${definition.id}: ${stats.triangles} triangles, ${(stats.bytes / 1024).toFixed(1)} KiB, validation OK`);
}
if (!checkOnly) await writeFile(new URL("manifest.json", output), `${JSON.stringify(manifest, null, 2)}\n`);
else assert.deepEqual(JSON.parse(await readFile(new URL("manifest.json", output), "utf8")), manifest, "Manifest does not match GLB assets");
console.log(`${checkOnly ? "Verified" : "Generated"} models in ${fileURLToPath(output)}`);
