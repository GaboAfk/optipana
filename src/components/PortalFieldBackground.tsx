"use client";

import { PortalFieldCollection } from "@/effects/portal-field/PortalFieldCollection";
import "@/effects/portal-field/styles.css";

type PortalFieldBackgroundProps = {
  className?: string;
  opacity?: number;
  length?: number;
};

/**
 * Fondo ambiental del Portal Field (Three.js r134) adaptado a OptiPana:
 * fondo blanco y aura del aro en los colores primarios de la marca.
 */
export function PortalFieldBackground({
  className = "",
  opacity = 0.55,
  length = 0.5,
}: PortalFieldBackgroundProps) {
  return (
    <div className={className} aria-hidden="true">
      <div className="threeui-background portal-field h-full w-full">
        <PortalFieldCollection variant="portal-field" mode="light" opacity={opacity} length={length} />
      </div>
    </div>
  );
}
