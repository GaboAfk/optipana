import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import portalFieldSource from "./sources/portal-field.html?raw";
import flowFieldSource from "./sources/flow-field.html?raw";

type FocusRole = "background" | "ui";
type NeuformMode = "dark" | "light";
type NeuformModePreference = NeuformMode | "auto";

type FocusTarget = {
  selector: string;
  role: FocusRole;
  width?: string;
};

type BakeKnobs = {
  variant: string;
  size: number;
  gap: number;
  length: number;
  density: number;
  strokeWidth: number;
  mode: NeuformMode;
};

type EffectDefinition = {
  title: string;
  source: string;
  background: string | ((mode: NeuformMode) => string);
  defaultMode?: NeuformModePreference;
  supportsMode?: boolean;
  targets: readonly FocusTarget[];
  focusCss?: string;
  patch?: (source: string, knobs: BakeKnobs) => string;
};

export type NeuformBatchEffectProps = {
  variant?: string;
  mode?: NeuformModePreference;
  speed?: number;
  size?: number;
  gap?: number;
  length?: number;
  density?: number;
  strokeWidth?: number;
  opacity?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
};

export const NEUFORM_BATCH_DEFAULTS = {
  mode: "dark" as NeuformMode,
  speed: 1,
  size: 1,
  gap: 2,
  length: 1,
  density: 1,
  strokeWidth: 1,
  opacity: 1,
  hue: 0,
  saturation: 1,
  brightness: 1,
} as const;

const LIGHT_PAPER = "#eef1f6";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function scaleCount(base: number, density: number, minimum = 1) {
  return Math.max(minimum, Math.round(base * density));
}

/** WebGL1 GLSL ES requires float literals (10.0), not ints (10). */
function glslFloat(value: number, digits = 3) {
  const fixed = Number(value).toFixed(digits);
  return fixed.includes(".") ? fixed : `${fixed}.0`;
}

function resolveMode(mode: NeuformMode | number | string | undefined, fallback: NeuformMode = "dark"): NeuformMode {
  if (mode === undefined || mode === null) return fallback;
  if (mode === "light" || mode === 1 || mode === "1") return "light";
  return "dark";
}

function readAutomaticMode(): NeuformMode {
  if (typeof document === "undefined" || typeof window === "undefined") return "dark";
  const root = document.documentElement;
  const declared = root.dataset.scheme ?? root.dataset.theme;
  if (declared === "light" || declared === "dark") return declared;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useAutomaticMode(enabled: boolean) {
  const [mode, setMode] = useState<NeuformMode>(readAutomaticMode);

  useEffect(() => {
    if (!enabled || typeof document === "undefined" || typeof window === "undefined") return undefined;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setMode(readAutomaticMode());
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-scheme", "data-theme"] });
    media.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, [enabled]);

  return mode;
}

function resolveBackground(background: EffectDefinition["background"], mode: NeuformMode) {
  return typeof background === "function" ? background(mode) : background;
}

const EFFECTS = {
  portalField: {
    title: "Portal Field",
    source: portalFieldSource,
    background: "#ffffff",
    targets: [{ selector: "#webgl-container", role: "background" }],
    patch(source, { size, length }) {
      return source
        .replace(
          "float d1 = sdArc(st, center, 0.6, 0.02, 0.15);",
          `float d1 = sdArc(st, center, ${glslFloat(0.6 * length, 3)}, ${glslFloat(0.02 * size, 4)}, 0.15);`,
        )
        .replace(
          "float d2 = sdArc(st, center, 0.65, 0.06, 0.2);",
          `float d2 = sdArc(st, center, ${glslFloat(0.65 * length, 3)}, ${glslFloat(0.06 * size, 4)}, 0.2);`,
        );
    },
  },
  flowField: {
    title: "Flow Field",
    source: flowFieldSource,
    background: "#0a0a0a",
    targets: [{ selector: "#canvas", role: "background" }],
    patch(source, { size, length, density }) {
      return source
        .replace(/<script defer src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js[^>]*><\/script>/, "")
        .replace("const PARTICLE_COUNT = 2500;", `const PARTICLE_COUNT = ${scaleCount(2500, density, 300)};`)
        .replace("let NOISE_SCALE = 0.0025;", `let NOISE_SCALE = ${Number((0.0025 / length).toFixed(6))};`)
        .replace("time += 0.0008;", "time += 0.0008 * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||0);")
        .replace(
          "let vx = Math.cos(angle) * p.speed * SPEED;",
          "let vx = Math.cos(angle) * p.speed * SPEED * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||0);",
        )
        .replace(
          "let vy = Math.sin(angle) * p.speed * SPEED;",
          "let vy = Math.sin(angle) * p.speed * SPEED * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||0);",
        )
        .replace("ctx.lineWidth = p.size;", `ctx.lineWidth = p.size * ${Number(size.toFixed(3))};`);
    },
  },
} as const satisfies Record<string, EffectDefinition>;

function buildFocusedDocument(
  definition: EffectDefinition,
  knobs: BakeKnobs & {
    speed: number;
    opacity: number;
  },
) {
  const mode = knobs.mode;
  const background = resolveBackground(definition.background, mode);
  const targetJson = JSON.stringify(definition.targets).replace(/</g, "\\u003c");
  const controlsJson = JSON.stringify({
    mode,
    speed: knobs.speed,
    size: knobs.size,
    gap: knobs.gap,
    length: knobs.length,
    density: knobs.density,
    strokeWidth: knobs.strokeWidth,
    opacity: knobs.opacity,
  }).replace(/</g, "\\u003c");
  const patchedSource = definition.patch
    ? definition.patch(definition.source, {
        variant: knobs.variant,
        size: knobs.size,
        gap: knobs.gap,
        length: knobs.length,
        density: knobs.density,
        strokeWidth: knobs.strokeWidth,
        mode,
      })
    : definition.source;
  const focusStyle = `<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${background} !important; }
body { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
body > * { visibility: hidden !important; }
body[data-threeui-ready] > [data-threeui-role] { visibility: visible !important; }
[data-threeui-residual] { display: none !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; }
[data-threeui-role="ui"] { position: relative !important; z-index: 1 !important; width: min(calc(100% - 32px), var(--threeui-target-width, 1040px)) !important; max-width: none !important; max-height: calc(100% - 32px) !important; margin: auto !important; overflow: auto !important; opacity: 1 !important; transform: none !important; filter: none !important; flex: none !important; box-sizing: border-box !important; }
${definition.focusCss ?? ""}
</style>`;
  const controlScript = `<script data-threeui-controls>
(function () {
  var controls = ${controlsJson};
  window.__SF_CONTROLS = controls;
  var origin = performance.now();
  var virtual = 0;
  var last = origin;
  var performanceNow = performance.now.bind(performance);
  var dateNow = Date.now.bind(Date);
  var dateOrigin = dateNow();
  performance.now = function () {
    var real = performanceNow();
    virtual += (real - last) * (controls.speed || 1);
    last = real;
    return origin + virtual;
  };
  Date.now = function () {
    return dateOrigin + (performance.now() - origin);
  };
  var raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (callback) {
    return raf(function () {
      callback(performance.now());
    });
  };
  function applyVisual() {
    var opacity = controls.opacity == null ? 1 : controls.opacity;
    var size = controls.size == null ? 1 : controls.size;
    Array.prototype.forEach.call(document.querySelectorAll('[data-threeui-role]'), function (element) {
      element.style.opacity = String(opacity);
      if (element.getAttribute('data-threeui-role') === 'ui') {
        element.style.transform = 'scale(' + size + ')';
        element.style.transformOrigin = 'center center';
      }
    });
  }
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'threeui-controls') return;
    var next = event.data.controls || {};
    Object.keys(next).forEach(function (key) { controls[key] = next[key]; });
    applyVisual();
  });
  window.__SF_APPLY_CONTROLS = applyVisual;
})();
</script>`;
  const focusScript = `<script data-threeui-focus>
(function () {
  var isolated = false;
  function isolate() {
    if (isolated) return;
    var specs = ${targetJson};
    var roots = [];
    specs.forEach(function (spec) {
      var element = document.querySelector(spec.selector);
      if (!element) return;
      element.setAttribute('data-threeui-role', spec.role);
      if (spec.width) element.style.setProperty('--threeui-target-width', spec.width);
      if (!roots.some(function (root) { return root.contains(element); })) roots.push(element);
    });
    if (!roots.length) return;
    isolated = true;
    roots.forEach(function (root) { document.body.appendChild(root); });
    Array.from(document.body.children).forEach(function (element) {
      if (roots.indexOf(element) !== -1) return;
      element.setAttribute('data-threeui-residual', '');
      element.setAttribute('aria-hidden', 'true');
      if ('inert' in element) element.inert = true;
    });
    document.body.setAttribute('data-threeui-ready', '');
    if (window.__SF_APPLY_CONTROLS) window.__SF_APPLY_CONTROLS();
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }
  function scheduleIsolation() { setTimeout(isolate, 100); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleIsolation, { once: true });
  else scheduleIsolation();
  window.addEventListener('load', isolate, { once: true });
})();
</script>`;
  return patchedSource
    .replace(/<head([^>]*)>/i, `<head$1>${controlScript}${focusStyle}`)
    .replace(/<\/body>/i, `${focusScript}</body>`);
}

function NeuformBatchEffect({
  definition,
  variant = "cube",
  mode,
  speed = NEUFORM_BATCH_DEFAULTS.speed,
  size = NEUFORM_BATCH_DEFAULTS.size,
  gap = NEUFORM_BATCH_DEFAULTS.gap,
  length = NEUFORM_BATCH_DEFAULTS.length,
  density = NEUFORM_BATCH_DEFAULTS.density,
  strokeWidth = NEUFORM_BATCH_DEFAULTS.strokeWidth,
  opacity = NEUFORM_BATCH_DEFAULTS.opacity,
  hue = NEUFORM_BATCH_DEFAULTS.hue,
  saturation = NEUFORM_BATCH_DEFAULTS.saturation,
  brightness = NEUFORM_BATCH_DEFAULTS.brightness,
  className,
  style,
}: NeuformBatchEffectProps & { definition: EffectDefinition }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const requestedMode = mode ?? definition.defaultMode ?? NEUFORM_BATCH_DEFAULTS.mode;
  const automaticMode = useAutomaticMode(requestedMode === "auto");
  const resolvedMode = requestedMode === "auto"
    ? automaticMode
    : resolveMode(requestedMode, NEUFORM_BATCH_DEFAULTS.mode);
  const background = resolveBackground(definition.background, resolvedMode);
  const safeSpeed = clamp(speed, 0, 3);
  // Size accepts both multipliers (most effects) and absolute pixels (override grid).
  const safeSize = clamp(size, 0.05, 200);
  const safeGap = clamp(gap, 0, 64);
  const safeLength = clamp(length, 0.05, 2.5);
  const safeDensity = clamp(density, 0.25, 2.5);
  const safeStrokeWidth = clamp(strokeWidth, 0.25, 8);
  const safeOpacity = clamp(opacity, 0.05, 1);
  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);

  // Rebuild when baked geometry/mode knobs change. Speed/opacity stay live via postMessage + time wrap.
  const source = useMemo(
    () =>
      buildFocusedDocument(definition, {
        variant,
        mode: resolvedMode,
        speed: NEUFORM_BATCH_DEFAULTS.speed,
        size: safeSize,
        gap: safeGap,
        length: safeLength,
        density: safeDensity,
        strokeWidth: safeStrokeWidth,
        opacity: NEUFORM_BATCH_DEFAULTS.opacity,
      }),
    [definition, resolvedMode, safeDensity, safeGap, safeLength, safeSize, safeStrokeWidth, variant],
  );

  useEffect(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      {
        type: "threeui-controls",
        controls: {
          mode: resolvedMode,
          speed: safeSpeed,
          size: safeSize,
          gap: safeGap,
          length: safeLength,
          density: safeDensity,
          strokeWidth: safeStrokeWidth,
          opacity: safeOpacity,
        },
      },
      "*",
    );
  }, [resolvedMode, safeDensity, safeGap, safeLength, safeOpacity, safeSize, safeSpeed, safeStrokeWidth, source]);

  // Forward parent-level mouse position to the iframe so the shader reacts
  // even when the iframe itself has pointer-events:none and never sees the
  // native mousemove event.
  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    const onMove = (e: MouseEvent) => {
      const win = frame.contentWindow;
      if (!win) return;
      const rect = frame.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      if (x >= -0.2 && x <= 1.2 && y >= -0.2 && y <= 1.2) {
        win.postMessage({ type: "threeui-mouse", x, y }, "*");
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [source]);

  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title={definition.title}
      srcDoc={source}
      sandbox="allow-scripts"
      loading="eager"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        border: 0,
        background,
        filter,
        ...style,
      }}
    />
  );
}

function createEffectComponent(definition: EffectDefinition) {
  return function EffectComponent(props: NeuformBatchEffectProps) {
    return <NeuformBatchEffect {...props} definition={definition} />;
  };
}

export const PortalField = createEffectComponent(EFFECTS.portalField);
export const FlowField = createEffectComponent(EFFECTS.flowField);
