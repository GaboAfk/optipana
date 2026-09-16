// Tipos del probador virtual en tiempo real.

/** Modelo de lentes disponible para el probador (viene de manifest.json). */
export interface GlassesModel {
  id: string;
  name: string;
  url: string;
  preview: string;
  referenceImage?: string;
  /** Bounds aproximados en mm [ancho, alto, profundo]. */
  estimatedBoundsMm?: [number, number, number];
}

/**
 * Calibración por modelo. Permite corregir GLBs con orígenes, escalas
 * u orientaciones ligeramente distintas. Los valores son en metros
 * (unidad de los modelos) y grados para rotación.
 */
export interface GlassesCalibration {
  scale: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

export const DEFAULT_CALIBRATION: GlassesCalibration = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
};

/** Resultado del tracking facial de un frame. */
export interface FacePose {
  /** Centro entre los ojos (puente), en coords normalizadas [0..1] del video. */
  centerX: number;
  centerY: number;
  /** Distancia entre centros oculares, en px del video. */
  eyeDistance: number;
  /** Rotación de cabeza en grados. */
  roll: number;
  yaw: number;
  pitch: number;
  /** Ancho del rostro en px (para escalar la montura). */
  faceWidth: number;
  /** Confianza de detección. */
  detected: boolean;
}
