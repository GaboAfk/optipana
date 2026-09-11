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
