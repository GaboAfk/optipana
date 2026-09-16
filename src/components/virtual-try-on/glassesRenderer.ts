// Escena Three.js que renderiza los lentes (.glb) sobre el video.
// Usa una cámara ortográfica para un overlay estable y rotaciones 3D
// que dan la sensación de filtro facial.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { FacePose, GlassesCalibration } from "./types";

const FRAME_TO_EYE_RATIO = 2.4; // ancho de montura aprox. vs distancia entre ojos

export class GlassesRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private loader: GLTFLoader;
  private glasses: THREE.Group | null = null;
  private modelWidthMeters = 0.14; // valor por defecto hasta conocer el bounds real
  private calibration: GlassesCalibration;
  // Recorte del video al mostrarse con object-cover (en coords normalizadas del video).
  private cropLeft = 0;
  private cropRight = 1;
  private cropTop = 0;
  private cropBottom = 1;

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

    // Cámara ortográfica: NDC -1..1 en X, -1..1 en Y (luego se ajusta el aspect).
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    this.loader = new GLTFLoader();
  }

  /** Carga un GLB y reemplaza el modelo actual. */
  async loadModel(url: string, estimatedBoundsMm?: [number, number, number]) {
    const gltf = await this.loader.loadAsync(url);
    this.disposeGlasses();
    this.glasses = gltf.scene as THREE.Group;
    trimTemples(this.glasses);
    // Centrar el modelo en su bridge_anchor si existe; si no, en su bbox.
    const anchor = this.glasses.getObjectByName("bridge_anchor");
    if (anchor) {
      // Mover el grupo para que el bridge quede en el origen del grupo.
      const p = new THREE.Vector3();
      anchor.getWorldPosition(p);
      this.glasses.position.sub(p);
      // Reempaquetar: crear wrapper para que el offset no afecte la pose.
      const wrapper = new THREE.Group();
      wrapper.add(this.glasses);
      this.glasses = wrapper;
    }
    this.scene.add(this.glasses);

    if (estimatedBoundsMm) {
      this.modelWidthMeters = estimatedBoundsMm[0] / 1000;
    }
  }

  setCalibration(c: GlassesCalibration) {
    this.calibration = c;
  }

  /** Aplica la pose del rostro al modelo de lentes. */
  applyPose(pose: FacePose, videoWidth: number) {
    if (!this.glasses) return;
    if (!pose.detected) {
      this.glasses.visible = false;
      return;
    }
    this.glasses.visible = true;

    // Mapear coords normalizadas del video [0..1] al área visible del contenedor.
    // El video se muestra con object-cover (recorta), así que ajustamos por el crop.
    // NOTA: el video y el canvas se espejan con la MISMA transformación CSS
    // (-scale-x-100), así que ya quedan sincronizados automáticamente: no hay
    // que invertir X aquí (invertirlo causaría un doble espejado y el modelo
    // dejaría de coincidir con la posición real del rostro).
    const visibleX = (pose.centerX - this.cropLeft) / (this.cropRight - this.cropLeft);
    const visibleY = (pose.centerY - this.cropTop) / (this.cropBottom - this.cropTop);
    const ndcX = visibleX * 2 - 1;
    const ndcY = -(visibleY * 2 - 1);

    // Escala: ancho deseado de la montura en NDC.
    // eyeDistance está en px del video; lo pasamos a fracción del ancho visible y a NDC (*2).
    const visibleWidthFrac = (this.cropRight - this.cropLeft) * videoWidth;
    const eyeFrac = pose.eyeDistance / visibleWidthFrac;
    const targetWidthNdc = eyeFrac * 2 * FRAME_TO_EYE_RATIO;
    const scale = (targetWidthNdc / this.modelWidthMeters) * this.calibration.scale;

    this.glasses.position.set(
      ndcX + this.calibration.offsetX,
      ndcY + this.calibration.offsetY,
      this.calibration.offsetZ,
    );
    this.glasses.scale.setScalar(scale);

    // Rotación: roll (Z), yaw (Y), pitch (X). Convertimos grados a radianes.
    // Igual que con la posición, no se invierte nada: el espejado CSS ya
    // mantiene al canvas sincronizado con el video.
    const r = Math.PI / 180;
    this.glasses.rotation.set(
      pose.pitch * r + this.calibration.rotationX * r,
      pose.yaw * r + this.calibration.rotationY * r,
      pose.roll * r + this.calibration.rotationZ * r,
    );
  }

  /** Ajusta el tamaño del renderer y el aspect de la cámara al contenedor. */
  resize(width: number, height: number, videoWidth?: number, videoHeight?: number) {
    this.renderer.setSize(width, height, false);
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);

    const containerAspect = width / height || 1;
    // Cámara ortográfica: X en [-1, 1], Y en [-1/aspect, 1/aspect].
    this.camera.left = -1;
    this.camera.right = 1;
    this.camera.top = 1 / containerAspect;
    this.camera.bottom = -1 / containerAspect;
    this.camera.updateProjectionMatrix();

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

  private disposeGlasses() {
    if (!this.glasses) return;
    this.scene.remove(this.glasses);
    this.glasses.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) (mat as THREE.Material).dispose();
    });
    this.glasses = null;
  }

  dispose() {
    this.disposeGlasses();
    this.renderer.dispose();
  }
}

const AXIS_COMPONENT = { x: 0, y: 1, z: 2 } as const;

/**
 * Acorta las patillas ("temple_*") del modelo para el overlay 2D de cámara.
 * En un try-on frontal no se ve el largo real de la patilla (iría hacia la
 * oreja, fuera de cámara o "flotando" sin una cabeza 3D real detrás), así
 * que se recorta dejando solo un tramo corto desde la bisagra.
 */
function trimTemples(root: THREE.Object3D, keepFraction = 0.45) {
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
