// Carga e inicializa MediaPipe FaceLandmarker (100% local en el navegador).
// Calcula la pose del rostro a partir de los landmarks.

import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { FacePose, FaceTransform } from "./types";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

/** Carga (una sola vez) el FaceLandmarker con el modelo desde CDN de Google. */
export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = createLandmarker("GPU").catch((err) => {
    console.warn("FaceLandmarker GPU init failed, retrying on CPU:", err);
    return createLandmarker("CPU");
  });
  return landmarkerPromise;
}

async function createLandmarker(delegate: "GPU" | "CPU"): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe-wasm");
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      // Modelo ligero optimizado para tiempo real en móviles.
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate,
    },
    runningMode: "VIDEO",
    numFaces: 1,
    // Habilita la matriz de transformación facial 4x4 (pose 3D de la cabeza).
    // Sin esto, solo se obtienen landmarks 2D/3D sin una orientación estable.
    outputFacialTransformationMatrixes: true,
  });
}

export function disposeFaceLandmarker() {
  if (landmarkerPromise) {
    landmarkerPromise.then((l) => l.close()).catch(() => {});
    landmarkerPromise = null;
  }
}

/**
 * Extrae la matriz de transformación facial 4x4 de MediaPipe.
 * Representa la pose 3D de la cabeza en el sistema de coordenadas de la cámara
 * (convención OpenGL: X derecha, Y arriba, Z hacia la cámara).
 * Los 16 elementos vienen en column-major (MatrixData de MediaPipe).
 */
export function extractFaceTransform(result: FaceLandmarkerResult): FaceTransform {
  const matrices = result.facialTransformationMatrixes;
  if (!matrices?.length) return { matrix: null, detected: false };
  const m = matrices[0];
  if (m?.rows !== 4 || m.columns !== 4 || m.data?.length !== 16 || !m.data.every(Number.isFinite)) {
    return { matrix: null, detected: false };
  }
  return { matrix: m.data, detected: true };
}

// Índices de landmarks de MediaPipe FaceLandmarker (478 puntos).
// Ojo izquierdo (del usuario) — esquina externa / interna.
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_INNER = 362;
const NOSE_BRIDGE = 168; // puente nasal, entre los ojos
const NOSE_TIP = 1;
const FOREHEAD = 10; // centro de la frente
const CHIN = 152; // mentón
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

type LM = { x: number; y: number; z: number };

function dist2D(a: LM, b: LM): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Convierte el resultado de MediaPipe en una FacePose.
 * Las coords x/y son normalizadas [0..1] respecto al frame del video.
 */
export function computeFacePose(result: FaceLandmarkerResult, videoWidth: number, videoHeight: number): FacePose {
  const empty: FacePose = {
    centerX: 0.5,
    centerY: 0.5,
    eyeDistance: 0,
    roll: 0,
    yaw: 0,
    pitch: 0,
    faceWidth: 0,
    detected: false,
  };
  if (!result.faceLandmarks?.length) return empty;
  const lm = result.faceLandmarks[0];
  if (!lm || lm.length < 478) return empty;

  const eyeCenter = (outer: number, inner: number): LM => ({
    x: (lm[outer].x + lm[inner].x) / 2,
    y: (lm[outer].y + lm[inner].y) / 2,
    z: (lm[outer].z + lm[inner].z) / 2,
  });
  const le = eyeCenter(LEFT_EYE_OUTER, LEFT_EYE_INNER);
  const re = eyeCenter(RIGHT_EYE_OUTER, RIGHT_EYE_INNER);
  const nose = lm[NOSE_BRIDGE] as LM;
  const noseTip = lm[NOSE_TIP] as LM;
  const forehead = lm[FOREHEAD] as LM;
  const chin = lm[CHIN] as LM;
  const lCheek = lm[LEFT_CHEEK] as LM;
  const rCheek = lm[RIGHT_CHEEK] as LM;

  // Centro: el puente nasal coincide con el bridge_anchor del modelo.
  // No mezclar con el midpoint ocular: ambos puntos tienen distinta profundidad
  // y se separan al girar. El renderer suaviza la posición temporalmente.
  const centerX = nose.x;
  const centerY = nose.y;

  // Distancia 3D entre centros oculares en px equivalentes; Z usa la escala de X.
  const dist3D = (a: LM, b: LM) => Math.hypot(
    (b.x - a.x) * videoWidth,
    (b.y - a.y) * videoHeight,
    (b.z - a.z) * videoWidth,
  );
  const eyeDistance = dist3D(le, re);

  // Roll: ángulo de la línea entre ojos respecto a la horizontal del video.
  const roll = (Math.atan2((re.y - le.y) * videoHeight, (re.x - le.x) * videoWidth) * 180) / Math.PI;

  // Yaw: asimetría entre distancia nariz→mejilla izquierda vs derecha.
  const dLeftCheek = dist2D(noseTip, lCheek);
  const dRightCheek = dist2D(noseTip, rCheek);
  const total = dLeftCheek + dRightCheek || 1;
  const yaw = ((dRightCheek - dLeftCheek) / total) * 90;

  // Pitch: asimetría entre distancia nariz→frente vs nariz→mentón.
  const dForehead = dist2D(noseTip, forehead);
  const dChin = dist2D(noseTip, chin);
  const totalV = dForehead + dChin || 1;
  const pitch = ((dChin - dForehead) / totalV) * 90;

  const faceWidth = dist3D(lCheek, rCheek);

  return {
    centerX,
    centerY,
    eyeDistance,
    roll,
    yaw: Math.max(-45, Math.min(45, yaw)),
    pitch: Math.max(-45, Math.min(45, pitch)),
    faceWidth,
    detected: true,
  };
}
