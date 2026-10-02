import assert from "node:assert/strict";
import { test } from "node:test";
import { access, readFile } from "node:fs/promises";
import * as vrCatalog from "../src/components/virtual-try-on/glassesCatalog.ts";
import * as productCatalog from "../src/data/products.ts";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { computeFacePose, extractFaceTransform } from "../src/components/virtual-try-on/faceLandmarker.ts";
import { GlassesRenderer, FaceOccluder } from "../src/components/virtual-try-on/glassesRenderer.ts";
import { DEFAULT_CALIBRATION } from "../src/components/virtual-try-on/types.ts";

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;

function near(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);
}

function faceResult(rotation = new THREE.Euler(), distanceScale = 1) {
  const landmarks = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const points = {
    33: [-0.2, 0, 0], 133: [-0.1, 0, 0],
    362: [0.1, 0, 0], 263: [0.2, 0, 0],
    168: [0, 0.02, 0], 1: [0, -0.08, 0.04],
    10: [0, 0.25, 0], 152: [0, -0.35, 0],
    234: [-0.3, -0.1, 0], 454: [0.3, -0.1, 0],
  };
  for (const [index, xyz] of Object.entries(points)) {
    const point = new THREE.Vector3(...xyz).applyEuler(rotation).multiplyScalar(distanceScale);
    landmarks[index] = {
      x: 0.5 + point.x,
      y: 0.5 - point.y * VIDEO_WIDTH / VIDEO_HEIGHT,
      z: -point.z,
    };
  }
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(3, -2, -40),
    new THREE.Quaternion().setFromEuler(rotation),
    new THREE.Vector3(1.05, 1.05, 1.05),
  );
  return {
    faceLandmarks: [landmarks], faceBlendshapes: [],
    facialTransformationMatrixes: [{ rows: 4, columns: 4, data: matrix.toArray() }],
  };
}

function rendererFixture() {
  const renderer = Object.create(GlassesRenderer.prototype);
  Object.assign(renderer, {
    faceAnchor: new THREE.Group(), glassesModel: new THREE.Group(),
    glassesContent: null, calibration: { ...DEFAULT_CALIBRATION }, occluder: new FaceOccluder(),
    modelWidthMeters: 0.14, fovDeg: 45,
    cropLeft: 0, cropRight: 1, cropTop: 0, cropBottom: 1,
    camera: new THREE.PerspectiveCamera(45, 1, 0.01, 100),
    renderer: { setSize() {}, setPixelRatio() {} },
    tmpMatrix: new THREE.Matrix4(), tmpQuaternion: new THREE.Quaternion(),
    targetPosition: new THREE.Vector3(), lastPoseTime: null,
  });
  renderer.faceAnchor.add(renderer.occluder, renderer.glassesModel);
  return renderer;
}

function applyResult(renderer, result, timestamp = 1000) {
  const pose = computeFacePose(result, VIDEO_WIDTH, VIDEO_HEIGHT);
  renderer.applyPose(pose, extractFaceTransform(result), VIDEO_WIDTH, timestamp, result.faceLandmarks[0], VIDEO_HEIGHT);
  return pose;
}

test("scale uses eye centers rather than outer eye corners", () => {
  const pose = computeFacePose(faceResult(), VIDEO_WIDTH, VIDEO_HEIGHT);
  near(pose.eyeDistance, 0.3 * VIDEO_WIDTH);
});

test("3D eye separation stays stable under yaw and roll on a 16:9 video", () => {
  for (const rotation of [new THREE.Euler(0, 0.7, 0), new THREE.Euler(0, 0, 0.6)]) {
    const pose = computeFacePose(faceResult(rotation), VIDEO_WIDTH, VIDEO_HEIGHT);
    near(pose.eyeDistance, 0.3 * VIDEO_WIDTH);
  }
});

test("moving closer increases tracking scale proportionally", () => {
  const normal = rendererFixture();
  const closer = rendererFixture();
  applyResult(normal, faceResult());
  applyResult(closer, faceResult(new THREE.Euler(), 1.5));
  near(closer.faceAnchor.scale.x / normal.faceAnchor.scale.x, 1.5);
});

test("column-major MediaPipe matrices preserve yaw, pitch and roll direction", () => {
  for (const rotation of [
    new THREE.Euler(0, 0.5, 0), new THREE.Euler(0, -0.5, 0),
    new THREE.Euler(0.4, 0, 0), new THREE.Euler(0, 0, -0.3),
  ]) {
    const renderer = rendererFixture();
    applyResult(renderer, faceResult(rotation));
    const expected = new THREE.Quaternion().setFromEuler(rotation);
    near(renderer.faceAnchor.quaternion.angleTo(expected), 0);
    near(renderer.faceAnchor.quaternion.length(), 1);
  }
});

test("bridge projects onto the video landmark across aspect ratios and cover crops", () => {
  const originalWindow = globalThis.window;
  globalThis.window = { devicePixelRatio: 1 };
  try {
    for (const [width, height] of [[480, 640], [1280, 720], [1000, 400]]) {
      const renderer = rendererFixture();
      renderer.resize(width, height, VIDEO_WIDTH, VIDEO_HEIGHT);
      renderer.camera.updateMatrixWorld();
      const pose = { centerX: 0.6, centerY: 0.35, eyeDistance: 160, detected: true, roll: 0, yaw: 0, pitch: 0, faceWidth: 300 };
      renderer.applyPose(pose, { matrix: null, detected: false }, VIDEO_WIDTH, 1000);
      const screen = renderer.faceAnchor.position.clone().project(renderer.camera);
      near(screen.x, 2 * (pose.centerX - renderer.cropLeft) / (renderer.cropRight - renderer.cropLeft) - 1);
      near(screen.y, 1 - 2 * (pose.centerY - renderer.cropTop) / (renderer.cropBottom - renderer.cropTop));
    }
  } finally {
    globalThis.window = originalWindow;
  }
});

test("fallback roll follows image coordinates without fabricated pitch or yaw", () => {
  const renderer = rendererFixture();
  const result = faceResult(new THREE.Euler(0, 0, 0.3));
  result.facialTransformationMatrixes = [];
  applyResult(renderer, result);
  near(renderer.faceAnchor.quaternion.angleTo(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.3))), 0);
});

test("pose smoothing damps changes and resets after detection is lost", () => {
  const renderer = rendererFixture();
  applyResult(renderer, faceResult());
  const initialScale = renderer.faceAnchor.scale.x;
  const moved = faceResult(new THREE.Euler(0, 0.5, 0), 1.5);
  moved.faceLandmarks[0].forEach((point) => { point.x += 0.1; });
  applyResult(renderer, moved, 1016);
  assert.ok(renderer.faceAnchor.position.x > 0 && renderer.faceAnchor.position.x < 0.2);
  assert.ok(renderer.faceAnchor.scale.x > initialScale && renderer.faceAnchor.scale.x < initialScale * 1.5);
  const target = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.5, 0));
  assert.ok(renderer.faceAnchor.quaternion.angleTo(target) > 0.01);
  renderer.applyPose({ detected: false }, { matrix: null, detected: false }, VIDEO_WIDTH, 1032);
  assert.equal(renderer.faceAnchor.visible, false);
  applyResult(renderer, moved, 1048);
  near(renderer.faceAnchor.position.x, 0.2);
  near(renderer.faceAnchor.quaternion.angleTo(target), 0);
});

test("loading a model without metadata measures its width instead of reusing the previous one", async () => {
  const renderer = rendererFixture();
  const content = new THREE.Group();
  content.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.005), new THREE.MeshBasicMaterial()));
  renderer.loader = { loadAsync: async () => ({ scene: content }) };
  await renderer.loadModel("fixture.glb");
  near(renderer.modelWidthMeters, 0.16);
});

test("face anchor follows the nasal bridge rather than averaging it with the eyes", () => {
  for (const rotation of [new THREE.Euler(), new THREE.Euler(0.2, 0.6, 0.3)]) {
    const result = faceResult(rotation);
    result.faceLandmarks[0][168].x += 0.04;
    result.faceLandmarks[0][168].y -= 0.03;
    const pose = computeFacePose(result, VIDEO_WIDTH, VIDEO_HEIGHT);
    near(pose.centerX, result.faceLandmarks[0][168].x);
    near(pose.centerY, result.faceLandmarks[0][168].y);
  }
});

test("face width is a 3D measurement stable under yaw and roll", () => {
  for (const rotation of [new THREE.Euler(), new THREE.Euler(0, 0.7, 0), new THREE.Euler(0, 0, 0.6)]) {
    const pose = computeFacePose(faceResult(rotation), VIDEO_WIDTH, VIDEO_HEIGHT);
    near(pose.faceWidth, 0.6 * VIDEO_WIDTH);
  }
});

test("frame width fits the face instead of a fixed multiple of eye separation", () => {
  const renderer = rendererFixture();
  const result = faceResult();
  result.faceLandmarks[0][234].x = 0.1;
  result.faceLandmarks[0][454].x = 0.9;
  const pose = applyResult(renderer, result);
  const renderedWidth = renderer.faceAnchor.scale.x * renderer.modelWidthMeters;
  near(renderedWidth, pose.faceWidth / VIDEO_WIDTH * 2 * 1.12);
  assert.ok(renderedWidth > pose.eyeDistance / VIDEO_WIDTH * 2 * 2.2);
});

test("wider frame fitting leaves the facial occluder at the measured head width", () => {
  for (const modelWidth of [0.14, 0.1544]) {
    const renderer = rendererFixture();
    renderer.modelWidthMeters = modelWidth;
    const pose = applyResult(renderer, faceResult());
    renderer.faceAnchor.updateMatrixWorld(true);
    const face = renderer.occluder.getObjectByName("faceDepthMask");
    const positions = face.geometry.getAttribute("position");
    const left = face.localToWorld(new THREE.Vector3().fromBufferAttribute(positions, 234));
    const right = face.localToWorld(new THREE.Vector3().fromBufferAttribute(positions, 454));
    const expectedFaceWidth = pose.faceWidth / VIDEO_WIDTH * 2;
    near(right.distanceTo(left), expectedFaceWidth);
    const head = renderer.occluder.getObjectByName("headDepthMask");
    near(head.getWorldScale(new THREE.Vector3()).x * 2, expectedFaceWidth);
    const frameWidth = renderer.faceAnchor.scale.x * modelWidth;
    near((frameWidth - expectedFaceWidth) / 2, expectedFaceWidth * 0.06);
    near(renderer.faceAnchor.position.x, pose.centerX * 2 - 1);
    near(renderer.faceAnchor.position.y, 1 - pose.centerY * 2);
  }
});

test("position follows a moving nose with less lag than scale and rotation", () => {
  const renderer = rendererFixture();
  applyResult(renderer, faceResult());
  const moved = faceResult();
  moved.faceLandmarks[0].forEach((point) => { point.x += 0.1; });
  applyResult(renderer, moved, 1033);
  assert.ok(renderer.faceAnchor.position.x > 0.18);
});

for (const id of ["209833317-orange", "209833300-red"]) {
  test(`${id}: real GLB bridge stays at the nasal anchor under rotation and scaling`, async () => {
    const bytes = await readFile(new URL(`../public/glasses_models/${id}.glb`, import.meta.url));
    const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
    const renderer = rendererFixture();
    renderer.loader = { loadAsync: async () => gltf };
    const temples = [];
    gltf.scene.traverse((mesh) => {
      if (mesh.isMesh && mesh.name.startsWith("temple_")) {
        temples.push([mesh, mesh.geometry.getAttribute("position").array.slice()]);
      }
    });
    await renderer.loadModel(`${id}.glb`);
    for (const [mesh, positions] of temples) {
      assert.deepEqual(mesh.geometry.getAttribute("position").array, positions, "occlusion must preserve full temple geometry");
    }
    for (const rotation of [new THREE.Euler(), new THREE.Euler(0.2, 0.6, 0.3)]) {
      renderer.lastPoseTime = null;
      const pose = applyResult(renderer, faceResult(rotation, 1.3));
      renderer.faceAnchor.updateMatrixWorld(true);
      const bridge = renderer.glassesContent.getObjectByName("bridge_anchor");
      assert.ok(bridge);
      const position = bridge.getWorldPosition(new THREE.Vector3());
      near(position.x, pose.centerX * 2 - 1);
      near(position.y, 1 - pose.centerY * 2);
      near(position.z, 0);
    }
  });
}

test("occluder writes depth without painting over the camera image", async () => {
  const occluder = new FaceOccluder();
  assert.equal(occluder.visible, false);
  assert.equal(occluder.children.length, 2);
  for (const mesh of occluder.children) {
    assert.equal(mesh.material.colorWrite, false);
    assert.equal(mesh.material.depthWrite, true);
    assert.equal(mesh.material.depthTest, true);
    assert.equal(mesh.material.transparent, false);
    assert.equal(mesh.material.side, THREE.DoubleSide);
    assert.ok(mesh.renderOrder < 0);
  }
  const face = occluder.getObjectByName("faceDepthMask");
  assert.equal(face.geometry.getAttribute("position").count, 470);
  assert.equal(face.geometry.index.count, 2652);
  occluder.dispose();
});

test("occlusion geometry is nose-relative and invariant under head pose and camera distance", async () => {
  const occluder = new FaceOccluder();
  let reference;
  for (const rotation of [new THREE.Euler(), new THREE.Euler(0.3, 0.6, 0.2)]) {
    const result = faceResult(rotation, reference ? 1.5 : 1);
    occluder.update(result.faceLandmarks[0], VIDEO_WIDTH, VIDEO_HEIGHT, 0.14, new THREE.Quaternion().setFromEuler(rotation), 1);
    assert.equal(occluder.visible, true);
    const positions = occluder.getObjectByName("faceDepthMask").geometry.getAttribute("position");
    near(positions.getX(168), 0);
    near(positions.getY(168), 0);
    assert.ok(positions.getZ(168) < 0);
    if (reference) positions.array.forEach((value, index) => near(value, reference[index]));
    else reference = positions.array.slice();
  }
  occluder.dispose();
});

test("head depth volume hides rear temples at either yaw direction but leaves the front visible", async () => {
  for (const yaw of [-0.65, 0, 0.65]) {
    const occluder = new FaceOccluder();
    const rotation = new THREE.Euler(0, yaw, 0);
    const quaternion = new THREE.Quaternion().setFromEuler(rotation);
    occluder.update(faceResult(rotation).faceLandmarks[0], VIDEO_WIDTH, VIDEO_HEIGHT, 0.14, quaternion, 1);
    occluder.quaternion.copy(quaternion);
    occluder.updateMatrixWorld(true);
    const head = occluder.getObjectByName("headDepthMask");
    const camera = new THREE.Vector3(0, 0, 2);
    const hiddenPoint = head.localToWorld(new THREE.Vector3(yaw > 0 ? -0.8 : 0.8, 0, 0));
    const ray = new THREE.Raycaster(camera, hiddenPoint.clone().sub(camera).normalize());
    const hit = ray.intersectObject(head)[0];
    assert.ok(hit && hit.distance < camera.distanceTo(hiddenPoint));
    const frontPoint = new THREE.Vector3(0.03, 0, 0.008).applyQuaternion(quaternion);
    ray.set(camera, frontPoint.clone().sub(camera).normalize());
    const frontHit = ray.intersectObject(head)[0];
    assert.ok(!frontHit || frontHit.distance > camera.distanceTo(frontPoint));
    occluder.dispose();
  }
});

test("facial depth surface blocks geometry behind the cheek but not in front", () => {
  const occluder = new FaceOccluder();
  const landmarks = faceResult().faceLandmarks[0];
  landmarks[127] = { x: 0.45, y: 0.45, z: 0.03 };
  landmarks[34] = { x: 0.55, y: 0.45, z: 0.03 };
  landmarks[139] = { x: 0.5, y: 0.55, z: 0.03 };
  occluder.update(landmarks, VIDEO_WIDTH, VIDEO_HEIGHT, 0.14, new THREE.Quaternion(), 1);
  occluder.updateMatrixWorld(true);
  const mesh = occluder.getObjectByName("faceDepthMask");
  const positions = mesh.geometry.getAttribute("position");
  const center = [127, 34, 139].reduce((sum, index) => sum.add(new THREE.Vector3().fromBufferAttribute(positions, index)), new THREE.Vector3()).divideScalar(3);
  const camera = center.clone().add(new THREE.Vector3(0, 0, 2));
  const ray = new THREE.Raycaster(camera, new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(mesh)[0];
  assert.ok(hit);
  assert.ok(hit.distance < camera.distanceTo(center.clone().add(new THREE.Vector3(0, 0, -0.01))));
  assert.ok(hit.distance > camera.distanceTo(center.clone().add(new THREE.Vector3(0, 0, 0.01))));
  occluder.dispose();
});

test("renderer shares the smoothed head anchor with occlusion and clears it when tracking is lost", () => {
  const renderer = rendererFixture();
  applyResult(renderer, faceResult(new THREE.Euler(0.1, 0.5, 0.2)));
  assert.equal(renderer.occluder.parent, renderer.faceAnchor);
  assert.equal(renderer.occluder.visible, true);
  const moved = faceResult(new THREE.Euler(0.2, 0.7, 0.3));
  applyResult(renderer, moved, 1016);
  near(renderer.occluder.position.length(), 0);
  near(renderer.occluder.quaternion.angleTo(new THREE.Quaternion()), 0);
  renderer.applyPose({ detected: false }, { matrix: null, detected: false }, VIDEO_WIDTH, 1032);
  assert.equal(renderer.faceAnchor.visible, false);
  assert.equal(renderer.occluder.visible, false);
  moved.facialTransformationMatrixes = [];
  applyResult(renderer, moved, 1048);
  assert.equal(renderer.faceAnchor.visible, true);
  assert.equal(renderer.occluder.visible, false);
});

test("occlusion hides on missing or invalid landmarks and releases GPU resources", async () => {
  const occluder = new FaceOccluder();
  const landmarks = faceResult().faceLandmarks[0];
  const quaternion = new THREE.Quaternion();
  occluder.update(landmarks, VIDEO_WIDTH, VIDEO_HEIGHT, 0.14, quaternion, 1);
  assert.equal(occluder.visible, true);
  occluder.update(undefined, VIDEO_WIDTH, VIDEO_HEIGHT, 0.14, quaternion, 1);
  assert.equal(occluder.visible, false);
  landmarks[33].x = NaN;
  occluder.update(landmarks, VIDEO_WIDTH, VIDEO_HEIGHT, 0.14, quaternion, 1);
  assert.equal(occluder.visible, false);
  let disposed = 0;
  occluder.children.forEach((mesh) => mesh.geometry.addEventListener("dispose", () => disposed++));
  occluder.children[0].material.addEventListener("dispose", () => disposed++);
  occluder.dispose();
  assert.equal(disposed, 3);
});

const EYE_RINGS = [
  [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
  [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
];

test("both eyelid boundaries are closed by depth triangles", () => {
  const occluder = new FaceOccluder();
  const indices = occluder.getObjectByName("faceDepthMask").geometry.index.array;
  const edges = new Map();
  const key = (a, b) => `${Math.min(a, b)}:${Math.max(a, b)}`;
  for (let i = 0; i < indices.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const edge = key(indices[i + j], indices[i + (j + 1) % 3]);
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
    }
  }
  for (const ring of EYE_RINGS) {
    ring.forEach((vertex, i) => assert.equal(edges.get(key(vertex, ring[(i + 1) % ring.length])), 2));
  }
  occluder.dispose();
});

test("eye depth caps hide rear geometry during turns and blinks without depending on iris tracking", () => {
  for (const yaw of [-0.6, 0, 0.6]) {
    for (const opening of [0.02, 0.002]) {
      const occluder = new FaceOccluder();
      const landmarks = faceResult().faceLandmarks[0];
      const rotation = new THREE.Euler(0, yaw, 0);
      const quaternion = new THREE.Quaternion().setFromEuler(rotation);
      EYE_RINGS.forEach((ring, side) => {
        ring.forEach((index, i) => {
          const angle = i / ring.length * Math.PI * 2;
          landmarks[index] = { x: (side ? 0.35 : 0.65) + Math.cos(angle) * 0.05, y: 0.5 + Math.sin(angle) * opening, z: 0.02 };
        });
      });
      landmarks.forEach((landmark) => {
        const point = new THREE.Vector3(landmark.x - 0.5, -(landmark.y - 0.5) * VIDEO_HEIGHT / VIDEO_WIDTH, -landmark.z).applyEuler(rotation);
        landmark.x = point.x + 0.5;
        landmark.y = 0.5 - point.y * VIDEO_WIDTH / VIDEO_HEIGHT;
        landmark.z = -point.z;
      });
      occluder.update(landmarks, VIDEO_WIDTH, VIDEO_HEIGHT, 0.14, quaternion, 1);
      occluder.quaternion.copy(quaternion);
      occluder.updateMatrixWorld(true);
      const mesh = occluder.getObjectByName("faceDepthMask");
      mesh.geometry.setDrawRange(2556, 96);
      const positions = mesh.geometry.getAttribute("position");
      for (const ring of EYE_RINGS) {
        const center = ring.reduce((sum, index) => sum.add(new THREE.Vector3().fromBufferAttribute(positions, index)), new THREE.Vector3()).divideScalar(ring.length);
        for (const index of [0, 4, 8, 12]) {
          const sample = center.clone().lerp(new THREE.Vector3().fromBufferAttribute(positions, ring[index]), 0.7);
          mesh.localToWorld(sample);
          const camera = sample.clone().add(new THREE.Vector3(0, 0, 2));
          const hit = new THREE.Raycaster(camera, new THREE.Vector3(0, 0, -1)).intersectObject(mesh)[0];
          assert.ok(hit, `uncovered eye at yaw=${yaw}, opening=${opening}`);
          near(hit.distance, 2);
          assert.ok(hit.distance < 2.01 && hit.distance > 1.99);
        }
      }
      const before = positions.array.slice();
      for (let i = 468; i < 478; i++) landmarks[i] = { x: 0.1, y: 0.9, z: -0.2 };
      occluder.update(landmarks, VIDEO_WIDTH, VIDEO_HEIGHT, 0.14, quaternion, 1);
      positions.array.forEach((value, i) => near(value, before[i]));
      occluder.dispose();
    }
  }
});

test("VR selector keeps the procedural models last and resolves URL selections safely", () => {
  assert.deepEqual(vrCatalog.GLASSES_CATALOG.map((model) => model.id), [
    "ardsley", "caleb", "duncan", "morley", "penn-sun", "209833317-orange", "209833300-red",
  ]);
  for (const id of [null, undefined, "", "unknown", "https://example.com/model.glb"]) {
    assert.equal(vrCatalog.resolveGlassesModelId(id), "ardsley");
  }
  for (const model of vrCatalog.GLASSES_CATALOG) {
    const url = new URL(vrCatalog.getVirtualTryOnHref(model.id), "http://localhost");
    assert.equal(url.pathname, "/probador-virtual");
    assert.equal(vrCatalog.resolveGlassesModelId(url.searchParams.get("model")), model.id);
  }
});

test("every VR model has exactly one product card with the same model ID", () => {
  const { products } = productCatalog;
  assert.equal(new Set(products.map((product) => product.id)).size, products.length);
  for (const model of vrCatalog.GLASSES_CATALOG) {
    const matching = products.filter((product) => product.vrModelId === model.id);
    assert.equal(matching.length, 1, `missing or duplicated product for ${model.id}`);
    assert.equal(matching[0].name, model.name);
  }
  assert.equal(products.find((product) => product.id === 6).vrModelId, "209833300-red");
  assert.equal(products.find((product) => product.id === 8).vrModelId, "209833317-orange");
  assert.equal(products.find((product) => product.id === 6).price, 45);
  assert.equal(products.find((product) => product.id === 8).price, 45);
});

test("new VR cards show the selfie first and glasses on hover without inventing prices", async () => {
  for (const id of ["ardsley", "caleb", "duncan", "morley", "penn-sun"]) {
    const model = vrCatalog.GLASSES_CATALOG.find((item) => item.id === id);
    const product = productCatalog.products.find((item) => item.vrModelId === id);
    assert.ok(product, `missing product for ${id}`);
    assert.equal(product.img, model.referenceImage ?? model.preview);
    assert.equal(product.hoverImg, model.referenceImage ? model.preview : undefined);
    assert.equal(product.price, null);
    assert.equal(product["try-on"], false);
    for (const path of [product.img, product.hoverImg, model.url].filter(Boolean)) {
      await access(new URL(`../public${path}`, import.meta.url));
    }
  }
  assert.equal(productCatalog.formatProductPrice(null), "Consultar precio");
  assert.equal(productCatalog.formatProductPrice(45), "$45");
});

test("malformed transformation matrices are ignored", () => {
  const result = faceResult();
  result.facialTransformationMatrixes[0].data[0] = NaN;
  assert.equal(extractFaceTransform(result).matrix, null);
});
