// Escena Three.js que renderiza los lentes (.glb) sobre el video.
//
// Arquitectura:
//   scene
//     └── faceAnchor (Group)       ← transformación de la cabeza (MediaPipe)
//           └── glassesModel (Group) ← calibración estática del GLB
//                 └── gltf.scene      ← contenido del modelo .glb
//
// - faceAnchor recibe position (landmarks 2D→NDC), quaternion (matriz 4x4
//   de MediaPipe) y scale (ancho facial estimado en 3D).
// - glassesModel recibe los offsets de calibración (position/rotation/scale)
//   que corrigen cómo está construido cada GLB individual.
// - La cámara es PerspectiveCamera colocada de forma que el plano Z=0
//   mapea exactamente a NDC [-1,1] en X, igual que la OrthographicCamera
//   anterior. Esto preserves el posicionamiento 2D estable pero añade
//   perspectiva 3D real a las rotaciones de la cabeza.

import * as THREE from "three";
import { FaceLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { FacePose, FaceTransform, GlassesCalibration } from "./types";

const FRAME_TO_FACE_RATIO = 1.12; // margen de la montura respecto al ancho facial estimado
const POSITION_SMOOTHING_MS = 12;
const POSE_SMOOTHING_MS = 45;
const POSE_RESET_MS = 250;

// FOV vertical de la cámara 3D. No afecta al posicionamiento en Z=0
// (está calibrado para mapear NDC), solo al grado de perspectiva en
// rotaciones 3D. 45° da un efecto natural similar a un webcam real.
const DEFAULT_FOV_DEG = 45;

export class GlassesRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private loader: GLTFLoader;

  // Jerarquía faceAnchor → glassesModel → gltf content
  private faceAnchor: THREE.Group;
  private glassesModel: THREE.Group;
  private glassesContent: THREE.Group | null = null;
  private occluder = new FaceOccluder();

  private modelWidthMeters = 0.14; // valor por defecto hasta conocer el bounds real
  private calibration: GlassesCalibration;
  private fovDeg = DEFAULT_FOV_DEG;

  // Recorte del video al mostrarse con object-cover (en coords normalizadas del video).
  private cropLeft = 0;
  private cropRight = 1;
  private cropTop = 0;
  private cropBottom = 1;

  // Objetos reutilizables para evitar allocations por frame.
  private tmpMatrix = new THREE.Matrix4();
  private tmpQuaternion = new THREE.Quaternion();
  private targetPosition = new THREE.Vector3();
  private lastPoseTime: number | null = null;

  constructor(canvas: HTMLCanvasElement, calibration: GlassesCalibration) {
    this.calibration = calibration;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();

    // Luz sencilla para PBR acetate.
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    hemi.position.set(0, 1, 1);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(0.5, 1, 1);
    this.scene.add(dir);

    // PerspectiveCamera: el posicionamiento se mantiene en el plano Z=0
    // (que mapea a NDC igual que la OrthographicCamera anterior), pero
    // las rotaciones 3D de los lentes ahora tienen perspectiva real.
    const aspect = 1; // se ajusta en resize()
    this.camera = new THREE.PerspectiveCamera(this.fovDeg, aspect, 0.01, 100);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    // Jerarquía: faceAnchor (tracking) → glassesModel (calibración) → GLB
    this.faceAnchor = new THREE.Group();
    this.faceAnchor.name = "faceAnchor";
    this.glassesModel = new THREE.Group();
    this.glassesModel.name = "glassesModel";
    this.faceAnchor.add(this.occluder, this.glassesModel);
    this.scene.add(this.faceAnchor);

    this.loader = new GLTFLoader();
  }

  /** Carga un GLB y reemplaza el modelo actual. */
  async loadModel(url: string, estimatedBoundsMm?: [number, number, number]) {
    const gltf = await this.loader.loadAsync(url);
    this.disposeGlassesContent();
    const content = gltf.scene as THREE.Group;
    trimTemples(content);

    // Centrar el modelo en su bridge_anchor si existe; si no, en su bbox.
    const anchor = content.getObjectByName("bridge_anchor");
    if (anchor) {
      const p = new THREE.Vector3();
      anchor.getWorldPosition(p);
      content.position.sub(p);
    }

    const bounds = new THREE.Box3().setFromObject(content);
    const measuredWidth = bounds.max.x - bounds.min.x;
    this.modelWidthMeters = measuredWidth > 0 ? measuredWidth : (estimatedBoundsMm?.[0] ?? 140) / 1000;
    this.lastPoseTime = null;

    this.glassesModel.add(content);
    this.glassesContent = content;
  }

  setCalibration(c: GlassesCalibration) {
    this.calibration = c;
  }

  /**
   * Aplica la pose del rostro al faceAnchor y la calibración al glassesModel.
   *
   * - Position y scale: desde landmarks 2D (estables, mapean directo al video).
   * - Rotation (quaternion): desde la matriz 4x4 de transformación facial
   *   de MediaPipe, que da yaw/pitch/roll 3D reales.
   * - Calibración: offsets estáticos del GLB aplicados al hijo glassesModel.
   */
  applyPose(
    pose: FacePose,
    transform: FaceTransform,
    videoWidth: number,
    timestamp = performance.now(),
    landmarks?: readonly NormalizedLandmark[],
    videoHeight = 0,
  ) {
    if (!pose.detected || !(videoWidth > 0) || !(pose.eyeDistance > 0)) {
      this.faceAnchor.visible = false;
      this.occluder.visible = false;
      this.lastPoseTime = null;
      return;
    }
    this.faceAnchor.visible = true;
    const elapsed = this.lastPoseTime === null ? POSE_RESET_MS : timestamp - this.lastPoseTime;
    const reset = elapsed >= POSE_RESET_MS || elapsed <= 0;
    const alpha = reset ? 1 : 1 - Math.exp(-elapsed / POSE_SMOOTHING_MS);
    const positionAlpha = reset ? 1 : 1 - Math.exp(-elapsed / POSITION_SMOOTHING_MS);
    this.lastPoseTime = timestamp;

    // --- Position (landmarks 2D → NDC) ---
    // Mapear coords normalizadas del video [0..1] al área visible del contenedor.
    // El video se muestra con object-cover (recorta), así que ajustamos por el crop.
    // NOTA: el video y el canvas se espejan con la MISMA transformación CSS
    // (-scale-x-100), así que ya quedan sincronizados automáticamente.
    const visibleX = (pose.centerX - this.cropLeft) / (this.cropRight - this.cropLeft);
    const visibleY = (pose.centerY - this.cropTop) / (this.cropBottom - this.cropTop);
    const ndcX = visibleX * 2 - 1;
    const ndcY = -(visibleY * 2 - 1);

    // --- Scale (ancho facial 3D → ancho de montura en NDC) ---
    const visibleWidthFrac = (this.cropRight - this.cropLeft) * videoWidth;
    const faceWidth = pose.faceWidth > 0 ? pose.faceWidth : pose.eyeDistance * 2.4;
    const targetWidthNdc = faceWidth / visibleWidthFrac * 2 * FRAME_TO_FACE_RATIO;
    const trackingScale = targetWidthNdc / this.modelWidthMeters;

    // Aplicar position y scale al faceAnchor.
    // Z=0: el plano que mapea exactamente a NDC (ver resize()).
    this.targetPosition.set(ndcX, ndcY / this.camera.aspect, 0);
    this.faceAnchor.position.lerp(this.targetPosition, positionAlpha);
    this.faceAnchor.scale.setScalar(THREE.MathUtils.lerp(this.faceAnchor.scale.x, trackingScale, alpha));

    // --- Rotation (quaternion desde la matriz 4x4 de MediaPipe) ---
    if (transform.matrix) {
      // La matriz de MediaPipe viene en column-major (16 elementos, MatrixData).
      // Three.js Matrix4.fromArray() usa el mismo orden, sin transponer.
      // extractRotation() elimina la escala antes de construir el quaternion.
      //
      // Sistema de coordenadas de MediaPipe (convención OpenGL):
      //   X derecha, Y arriba, Z hacia la cámara.
      // Three.js usa la misma convención, así que NO hay conversión de ejes.
      //
      // El espejado selfie se maneja con CSS (-scale-x-100) en el <canvas>,
      // que invierte yaw y roll de la imagen final. Como el <video> también
      // está espejado con el mismo CSS, ambos se invierten igual y los lentes
      // quedan sincronizados con el rostro.
      this.tmpMatrix.fromArray(transform.matrix);
      this.tmpMatrix.extractRotation(this.tmpMatrix);
      this.tmpQuaternion.setFromRotationMatrix(this.tmpMatrix).normalize();
    } else {
      // Fallback: usar roll de landmarks (siempre disponible) y dejar
      // yaw/pitch en 0. Esto solo ocurre si MediaPipe no entrega la matriz.
      const halfRoll = -pose.roll * Math.PI / 360;
      this.tmpQuaternion.set(0, 0, Math.sin(halfRoll), Math.cos(halfRoll));
    }
    this.faceAnchor.quaternion.slerp(this.tmpQuaternion, alpha);

    // --- Calibración del GLB (glassesModel, hijo del faceAnchor) ---
    // Estos offsets corrigen cómo está construido/orientado cada modelo .glb
    // y se aplican en el espacio local del modelo (metros), escalado por
    // el faceAnchor. No se mezclan con el tracking de la cabeza.
    const r = Math.PI / 180;
    this.glassesModel.position.set(
      this.calibration.offsetX,
      this.calibration.offsetY,
      this.calibration.offsetZ,
    );
    this.glassesModel.rotation.set(
      this.calibration.rotationX * r,
      this.calibration.rotationY * r,
      this.calibration.rotationZ * r,
    );
    this.glassesModel.scale.setScalar(this.calibration.scale);
    this.occluder.update(
      transform.matrix ? landmarks : undefined,
      videoWidth,
      videoHeight,
      this.modelWidthMeters / FRAME_TO_FACE_RATIO,
      this.tmpQuaternion,
      alpha,
    );
  }

  /** Ajusta el tamaño del renderer y la cámara al contenedor. */
  resize(width: number, height: number, videoWidth?: number, videoHeight?: number) {
    this.renderer.setSize(width, height, false);
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);

    const containerAspect = width / height || 1;
    this.camera.aspect = containerAspect;
    this.camera.fov = this.fovDeg;
    this.camera.updateProjectionMatrix();

    // Colocar la cámara de forma que el plano Z=0 mapea exactamente a
    // NDC [-1, 1] en X (igual que la OrthographicCamera anterior).
    //
    // A distancia d del plano Z=0:
    //   ancho visible  = 2 * d * tan(fov/2) * aspect
    //   alto visible   = 2 * d * tan(fov/2)
    // Queremos ancho = 2 → d = 1 / (tan(fov/2) * aspect)
    // Entonces en Z=0: X ∈ [-1, 1], Y ∈ [-1/aspect, 1/aspect].
    const halfFovRad = (this.fovDeg * Math.PI) / 360;
    const d = 1 / (Math.tan(halfFovRad) * containerAspect);
    this.camera.position.set(0, 0, d);
    this.camera.lookAt(0, 0, 0);

    if (videoWidth && videoHeight) {
      this.updateCrop(videoWidth, videoHeight, width, height);
    }
  }

  /** Recalcula solo el recorte del video (sin cambiar el tamaño del canvas). */
  updateCrop(videoWidth: number, videoHeight: number, containerWidth: number, containerHeight: number) {
    const containerAspect = containerWidth / containerHeight || 1;
    const videoAspect = videoWidth / videoHeight || containerAspect;
    if (videoAspect > containerAspect) {
      this.cropLeft = (videoAspect - containerAspect) / (2 * videoAspect);
      this.cropRight = 1 - this.cropLeft;
      this.cropTop = 0;
      this.cropBottom = 1;
    } else {
      this.cropLeft = 0;
      this.cropRight = 1;
      this.cropTop = (1 / videoAspect - 1 / containerAspect) / (2 / videoAspect);
      this.cropBottom = 1 - this.cropTop;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  private disposeGlassesContent() {
    if (!this.glassesContent) return;
    this.glassesModel.remove(this.glassesContent);
    this.glassesContent.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) (mat as THREE.Material).dispose();
    });
    this.glassesContent = null;
  }

  dispose() {
    this.disposeGlassesContent();
    this.occluder.dispose();
    this.renderer.dispose();
  }
}

const FACE_VERTEX_COUNT = 468;
const OCCLUSION_INSET_RATIO = 0.025;
const EYE_CAPS = [FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE]
  .map((connections, index) => ({
    center: FACE_VERTEX_COUNT + index,
    vertices: [...new Set(connections.flatMap(({ start, end }) => [start, end]))],
    triangles: connections.flatMap(({ start, end }) => [FACE_VERTEX_COUNT + index, start, end]),
  }));

export class FaceOccluder extends THREE.Group {
  private material = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
  });
  private positions = new THREE.BufferAttribute(new Float32Array((FACE_VERTEX_COUNT + EYE_CAPS.length) * 3), 3)
    .setUsage(THREE.DynamicDrawUsage);
  private faceGeometry = new THREE.BufferGeometry();
  private faceMesh = new THREE.Mesh(this.faceGeometry, this.material);
  private headMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), this.material);
  private inverseRotation = new THREE.Quaternion();
  private point = new THREE.Vector3();
  private lastHeadWidth = 0;

  constructor() {
    super();
    this.name = "faceOccluder";
    this.visible = false;
    this.renderOrder = -1;
    this.faceGeometry.setAttribute("position", this.positions);
    this.faceGeometry.setIndex([
      ...FaceLandmarker.FACE_LANDMARKS_TESSELATION.map(({ start }) => start),
      ...EYE_CAPS.flatMap(({ triangles }) => triangles),
    ]);
    this.faceMesh.name = "faceDepthMask";
    this.faceMesh.frustumCulled = false;
    this.headMesh.name = "headDepthMask";
    this.faceMesh.renderOrder = this.headMesh.renderOrder = -1;
    this.add(this.faceMesh, this.headMesh);
  }

  update(
    landmarks: readonly NormalizedLandmark[] | undefined,
    videoWidth: number,
    videoHeight: number,
    headWidth: number,
    rotation: THREE.Quaternion,
    alpha: number,
  ) {
    const wasVisible = this.visible;
    this.visible = false;
    if (!landmarks || landmarks.length < FACE_VERTEX_COUNT || !(videoWidth > 0) || !(videoHeight > 0) || !(headWidth > 0)) return;
    for (let i = 0; i < FACE_VERTEX_COUNT; i++) {
      const point = landmarks[i];
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) return;
    }
    const nose = landmarks[168];
    const left = landmarks[234];
    const right = landmarks[454];
    const faceWidth = Math.hypot(
      (right.x - left.x) * videoWidth,
      (right.y - left.y) * videoHeight,
      (right.z - left.z) * videoWidth,
    );
    if (!(faceWidth > 0)) return;
    const scale = headWidth / faceWidth;
    const inset = headWidth * OCCLUSION_INSET_RATIO;
    const smoothing = wasVisible && this.lastHeadWidth === headWidth ? alpha : 1;
    this.inverseRotation.copy(rotation).invert();
    for (let i = 0; i < FACE_VERTEX_COUNT; i++) {
      const landmark = landmarks[i];
      this.point.set(
        (landmark.x - nose.x) * videoWidth * scale,
        -(landmark.y - nose.y) * videoHeight * scale,
        -(landmark.z - nose.z) * videoWidth * scale,
      ).applyQuaternion(this.inverseRotation);
      this.point.z -= inset;
      this.positions.setXYZ(
        i,
        THREE.MathUtils.lerp(this.positions.getX(i), this.point.x, smoothing),
        THREE.MathUtils.lerp(this.positions.getY(i), this.point.y, smoothing),
        THREE.MathUtils.lerp(this.positions.getZ(i), this.point.z, smoothing),
      );
    }
    for (const cap of EYE_CAPS) {
      this.point.set(0, 0, 0);
      for (const vertex of cap.vertices) {
        this.point.x += this.positions.getX(vertex);
        this.point.y += this.positions.getY(vertex);
        this.point.z += this.positions.getZ(vertex);
      }
      this.point.divideScalar(cap.vertices.length);
      this.positions.setXYZ(cap.center, this.point.x, this.point.y, this.point.z);
    }
    this.positions.needsUpdate = true;
    const radiusZ = headWidth * 0.6;
    const cheekZ = (this.positions.getZ(234) + this.positions.getZ(454)) / 2;
    this.headMesh.scale.set(
      headWidth * 0.5,
      Math.max(Math.abs(this.positions.getY(10) - this.positions.getY(152)) * 0.65, headWidth * 0.6),
      radiusZ,
    );
    this.headMesh.position.set(
      (this.positions.getX(234) + this.positions.getX(454)) / 2,
      (this.positions.getY(10) + this.positions.getY(152)) / 2,
      Math.min(-inset, cheekZ) - inset - radiusZ,
    );
    this.lastHeadWidth = headWidth;
    this.visible = true;
  }

  dispose() {
    this.visible = false;
    this.faceGeometry.dispose();
    this.headMesh.geometry.dispose();
    this.material.dispose();
  }
}

const AXIS_COMPONENT = { x: 0, y: 1, z: 2 } as const;

/**
 * Recorte opcional de las patillas ("temple_*") desde la bisagra.
 * Con oclusión de profundidad se conserva la geometría completa por defecto.
 * Una fracción menor que 1 permite reutilizar el recorte para un overlay
 * sin máscara facial, pero no se usa en el probador con oclusión.
 */
function trimTemples(root: THREE.Object3D, keepFraction = 1) {
  if (keepFraction >= 1) return;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.name.toLowerCase().includes("temple")) return;
    const geometry = mesh.geometry;
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    if (!bbox) return;

    const size = new THREE.Vector3();
    bbox.getSize(size);
    // Eje dominante = el largo de la patilla.
    const axis: keyof typeof AXIS_COMPONENT =
      size.x >= size.y && size.x >= size.z ? "x" : size.y >= size.z ? "y" : "z";
    const component = AXIS_COMPONENT[axis];
    const min = bbox.min[axis];
    const max = bbox.max[axis];
    // El extremo más cercano al origen del modelo es la bisagra (se conserva fija);
    // el otro extremo es la punta de la patilla (se recorta).
    const hinge = Math.abs(min) <= Math.abs(max) ? min : max;
    const length = (hinge === min ? max : min) - hinge;
    if (length === 0) return;
    const cutoff = hinge + length * keepFraction;

    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      const value = position.getComponent(i, component);
      const t = (value - hinge) / length;
      if (t > keepFraction) {
        position.setComponent(i, component, cutoff);
      }
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  });
}
