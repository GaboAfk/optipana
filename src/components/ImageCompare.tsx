"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { MotionValue } from "framer-motion";

type ImageCompareProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number;
  sliderColor?: string;
  className?: string;
  scrollPosition?: MotionValue<number>;
};

const PATHS = {
  arrowLeft:
    "M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z",
  arrowRight:
    "M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z",
};

export function ImageCompare({
  beforeSrc,
  afterSrc,
  beforeAlt = "Antes",
  afterAlt = "Después",
  beforeLabel = "Sin lentes",
  afterLabel = "Con lentes",
  initialPosition = 100,
  sliderColor = "#ffffff",
  className = "",
  scrollPosition,
}: ImageCompareProps) {
  const [position, setPosition] = useState(initialPosition);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detectar touch device después del mount para evitar hydration mismatch
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window);
  }, []);

  // El scroll controla la posición cuando el usuario no está arrastrando
  const scrollPos = scrollPosition as MotionValue<number> | undefined;
  useEffect(() => {
    if (!scrollPos) return;
    const unsubscribe = scrollPos.on("change", (latest) => {
      if (!isDragging.current) {
        setPosition(Math.min(100, Math.max(0, latest)));
      }
    });
    return () => unsubscribe();
  }, [scrollPos]);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, raw)));
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isTouchDevice) return;
      isDragging.current = true;
      updatePosition(e.clientX);
    },
    [isTouchDevice, updatePosition],
  );

  const onTouchStart = useCallback(
    (_e: React.TouchEvent) => {
      // En mobile no se arrastra — solo el scroll controla la barra
      return;
    },
    [],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging.current) updatePosition(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current) updatePosition(e.touches[0].clientX);
    };
    const onUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [updatePosition]);

  const sharedImgStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    pointerEvents: "none",
    userSelect: "none",
  };

  const beforeClip: CSSProperties = {
    clipPath: `inset(0 ${100 - position}% 0 0)`,
  };

  const labelBase: CSSProperties = {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.45)",
    color: "#ffffff",
    padding: "4px 12px",
    borderRadius: "6px",
    pointerEvents: "none",
    userSelect: "none",
    lineHeight: 1.4,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "var(--font-sans)",
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ cursor: isTouchDevice ? "default" : "ew-resize", touchAction: "pan-y", userSelect: "none" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* After image (fondo — con lentes) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={afterSrc} alt={afterAlt} draggable={false} style={sharedImgStyle} />

      {/* Before image (recortada — sin lentes) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beforeSrc}
        alt={beforeAlt}
        draggable={false}
        style={{ ...sharedImgStyle, ...beforeClip }}
      />

      {/* Divisor */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: `${position}%`,
          width: 2,
          height: "100%",
          backgroundColor: sliderColor,
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      />

      {/* Handle circular */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${position}%`,
          transform: "translate(-50%, -50%)",
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          background: "transparent",
          border: `2px solid ${sliderColor}`,
          boxShadow: "0 0 15px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.1)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
          <svg width={14} height={14} viewBox="0 0 256 256" fill={sliderColor}>
            <path d={PATHS.arrowLeft} />
          </svg>
          <svg width={14} height={14} viewBox="0 0 256 256" fill={sliderColor}>
            <path d={PATHS.arrowRight} />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div
        style={{
          ...labelBase,
          top: 12,
          left: 12,
          opacity: position < 15 ? 0 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        {beforeLabel}
      </div>
      <div
        style={{
          ...labelBase,
          top: 12,
          right: 12,
          opacity: position > 85 ? 0 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        {afterLabel}
      </div>
    </div>
  );
}
