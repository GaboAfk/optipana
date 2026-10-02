<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Glasses model assets

- `npm run models:generate` regenerates the two procedural GLBs, geometric SVG previews, and `manifest.json` in `public/glasses_models/`. The source is `scripts/generate-glasses.mjs`; Three.js and gltf-validator are pinned development dependencies, not app runtime integrations.
- `npm run models:check` validates committed assets with the Khronos glTF validator, reloads them with GLTFLoader, and checks dimensions, geometry, anchors, lens openings, transparency, triangle budget, and manifest consistency. `npx eslint scripts/generate-glasses.mjs` lints the generator.
- Models use meters, +Y up, +Z forward away from the wearer, open temples toward -Z, and a `bridge_anchor` at the origin. `negative_x` and `positive_x` refer to model coordinates, not anatomical sides. Lens-center anchors are geometric centers, not measured pupil positions.
- These are photo-based approximations with estimated dimensions, opaque PBR acetate, and alpha-blended lenses for camera compositing. SVGs use simplified lighting and are not photorealistic material renders. Live tracking, face occlusion, and optical fitting are not implemented by these assets; the existing image-generation try-on is unchanged.

## Live virtual try-on

- `/probador-virtual` uses MediaPipe Tasks Vision and Three.js in `src/components/virtual-try-on/`, separately from the image-generation try-on. Both video and canvas are mirrored with CSS; do not mirror the tracking coordinates again.
- MediaPipe facial transformation arrays are column-major. Load with `Matrix4.fromArray` and remove scale before extracting rotation. Landmark X and Z use video width; Y uses video height. Eye separation is estimated from eye-corner midpoints in 3D, not the distance between outer corners.
- `npm run test:tracking` runs synthetic tracking/renderer regression tests without a camera or WebGL using Node's native TypeScript stripping (Node 22.18+ or 24+). Also run `npx tsc --noEmit --incremental false` and `npx eslint src/components/virtual-try-on scripts/face-tracking.test.mjs`.
- The tracking origin follows the nasal bridge (landmark 168), not an average with the eye midpoint. Frame width follows the estimated 3D cheek-to-cheek width (234/454) with a 1.12 margin to give the temples lateral clearance; the occluder is inversely normalized by this ratio so its world-space head width does not grow with the frame. Position smoothing responds faster than rotation/scale to reduce nasal-anchor lag.
- `FaceOccluder` in `glassesRenderer.ts` uses the 468-vertex MediaPipe tessellation plus an approximate ellipsoidal head volume. Both share the smoothed `faceAnchor` and render before glasses with `colorWrite: false`, `depthWrite: true`; do not make their materials transparent or clear depth between them and the glasses. Raw landmarks are converted to nose-relative, unrotated model coordinates, with a small inset to protect the front frame.
- MediaPipe tessellation leaves the eyes open. The depth mask fills each eyelid boundary with a triangle fan and a derived center vertex (470 vertices total); these extra vertices are not iris landmarks. Update the centers from smoothed eyelid positions so gaze changes cannot reopen the holes.
- Patillas are no longer shortened by default: depth occlusion hides their covered portions. The mask is hidden when landmarks or the 3D pose are unavailable, and its geometries/material are disposed with the renderer.
- Visual camera testing is still required for fit, jitter, lighting and device performance. Face-width fitting and the head occlusion volume are approximate, not optical measurements or exact hair/ear segmentation. Shadows on the wearer are not implemented.

## Navigation

- `Header` is mounted by both the home and virtual try-on pages, not by the root layout. Shared section links and the logo must use `/#section` URLs so they also work outside the home page.
- Desktop navigation starts at `xl` to accommodate the VR entry. The collapsed mobile menu is inert, supports Escape, and scrolls on short screens. The VR shimmer in `globals.css` runs only with `prefers-reduced-motion: no-preference`.
