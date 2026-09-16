// Carga e inicializa MediaPipe FaceLandmarker (100% local en el navegador).
// Calcula la pose del rostro a partir de los landmarks.

import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { FacePose } from "./types";

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
  });
}

export function disposeFaceLandmarker() {
  if (landmarkerPromise) {
    landmarkerPromise.then((l) => l.close()).catch(() => {});
    landmarkerPromise = null;
  }
}

// Índices de landmarks de MediaPipe FaceLandmarker (478 puntos).
// Ojo izquierdo (del usuario) — esquina externa / interna.
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
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
export function computeFacePose(result: FaceLandmarkerResult, videoWidth: number): FacePose {
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

  const le = lm[LEFT_EYE_OUTER] as LM;
  const re = lm[RIGHT_EYE_OUTER] as LM;
  const nose = lm[NOSE_BRIDGE] as LM;
  const noseTip = lm[NOSE_TIP] as LM;
  const forehead = lm[FOREHEAD] as LM;
  const chin = lm[CHIN] as LM;
  const lCheek = lm[LEFT_CHEEK] as LM;
  const rCheek = lm[RIGHT_CHEEK] as LM;

  // Centro en el puente nasal.
  const centerX = nose.x;
  const centerY = nose.y;

  // Distancia entre ojos en px del video.
  const eyeDistance = dist2D(le, re) * videoWidth;

  // Roll: ángulo de la línea entre ojos respecto a la horizontal.
  const roll = (Math.atan2(re.y - le.y, re.x - le.x) * 180) / Math.PI;

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

  const faceWidth = dist2D(lCheek, rCheek) * videoWidth;

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
