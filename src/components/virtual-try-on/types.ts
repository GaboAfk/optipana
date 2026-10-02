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
  /** Puente nasal (landmark 168), en coords normalizadas [0..1] del video. */
  centerX: number;
  centerY: number;
  /** Distancia 3D entre centros oculares, en px equivalentes del video. */
  eyeDistance: number;
  /** Rotación de cabeza en grados (fallback si no hay matriz 3D). */
  roll: number;
  yaw: number;
  pitch: number;
  /** Ancho 3D del rostro en px equivalentes (para escalar la montura). */
  faceWidth: number;
  /** Confianza de detección. */
  detected: boolean;
}

/**
 * Transformación facial 3D de MediaPipe.
 * La matriz 4x4 proviene de `facialTransformationMatrixes` y representa
 * la pose de la cabeza en el sistema de coordenadas de la cámara
 * (convención OpenGL: X derecha, Y arriba, Z hacia la cámara).
 * Los 16 elementos están en orden column-major (formato nativo de MediaPipe C++).
 */
export interface FaceTransform {
  /** Matriz 4x4 en column-major (16 elementos) o null si no disponible. */
  matrix: number[] | null;
  detected: boolean;
}
