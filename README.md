# GlowFace AI

GlowFace AI is a React + Vite web app for experimenting with real-time face glow filters using your browser camera.

## Features

- Real-time camera preview with glow-style face effects
- Optional MediaPipe hand landmark overlay (up to 2 hands)
- Stage-based loading UI with loading percent during camera/model initialization
- Filter presets and slider-based adjustments
- Capture and download processed snapshots
- Lightweight TypeScript + React codebase

## Tech stack

- React 18
- TypeScript
- Vite

## Getting started

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Install and run

```bash
pnpm install
pnpm dev
```

Open the local URL shown in terminal (usually `http://localhost:5173`) and allow camera access.

Note: the app loads MediaPipe scripts from jsDelivr CDN at runtime, so internet access is required.

## Scripts

```bash
pnpm dev      # start local dev server
pnpm build    # type-check and create production build
pnpm preview  # preview production build locally
```

## Project structure

- `src/features/glow-face/GlowFaceApp.tsx`: core feature implementation
- `src/App.tsx`: app wrapper
- `src/main.tsx`: entry point

## Manual QA checklist

- Camera permission prompt and denied state
- Staged loading UI displays stage text and loading percent
- Filter preset switching
- Slider updates and reset behavior
- Hand toggle and hand landmark overlay visibility
- Capture + download flow
- Browser check in Chrome + one additional browser

## Open source notes

Contributions are welcome. Please open an issue for major feature changes before starting implementation.

1. Create a feature branch.
2. Keep commits focused and descriptive.
3. Submit a pull request with screenshots or a short recording for UI changes.
4. Include manual verification steps in the PR description.

## License

No license file is included yet. Add a `LICENSE` file (for example MIT) before publishing this repository publicly.
