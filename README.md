# GlowFace AI

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Add%20LICENSE%20file-orange)](#license)

GlowFace AI is a browser-based real-time beauty filter app built with React + Vite.
It applies face glow effects from your webcam stream and can optionally render MediaPipe hand landmarks.

## Why this project

- Fast, local-first webcam processing in the browser
- Lightweight codebase with a single main feature module
- Practical baseline for AR filter experiments with MediaPipe

## Highlights

- Real-time glow face filter on live camera feed
- Preset-based style switching + per-preset fine tuning
- Stage-based startup loader with progress percentage
- Optional hand landmark overlay (up to 2 hands)
- Capture and download processed snapshots
- JSON export/import for filter config sharing

## Tech Stack

- React 18
- TypeScript
- Vite
- MediaPipe FaceMesh + Hands (loaded from CDN)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm

### Install

```bash
pnpm install
```

### Run dev server

```bash
pnpm dev
```

Open the URL printed in terminal (usually `http://localhost:5173`) and allow camera access.

### Production build

```bash
pnpm build
pnpm preview
```

## Controls

- `Mesh`: show/hide face oval guide
- `Filter`: enable/disable glow filter
- `H`: enable/disable hand landmark overlay
- Shutter button: capture current frame
- Sliders panel: tune filter parameters

## Performance Benchmark (Dev)

The app includes a dev-only benchmark panel to measure runtime camera performance.

1. Run `pnpm dev`
2. Open `Perf Benchmark (DEV)` panel
3. Click `Start`, run your scenario for 20-60 seconds, then click `Stop`
4. Use `Copy JSON` to export metrics

Reported metrics:

- Current FPS and average FPS
- P95 frame time
- Average FaceMesh and Hands processing latency
- Dropped frame ratio
- Pass/fail status against desktop target (30 FPS)

## Project Structure

- `src/features/glow-face/GlowFaceApp.tsx`: main camera/model/render/UI logic
- `src/App.tsx`: app wrapper
- `src/main.tsx`: application entrypoint

## Browser Support

Primary target is desktop Chrome. Also test at least one additional browser for camera + model loading behavior.

## Troubleshooting

- `tsc: command not found` during build:
  - Run `pnpm install` to install local dependencies.
- MediaPipe wasm/data load errors or 404s:
  - Hard refresh and retry.
  - Confirm network access to `cdn.jsdelivr.net`.
- `Hand overlay ไม่พร้อมใช้งานในอุปกรณ์นี้`:
  - Hands model failed to initialize; face filter still works.

## Contributing

Contributions are welcome.

1. Open an issue for major changes.
2. Create a feature branch.
3. Keep commits focused and descriptive.
4. Submit a PR with manual test steps and UI screenshots/recording when relevant.

## Roadmap

- Better gesture interactions (hands-free capture/toggle)
- More filter packs and export presets
- Performance tuning for low-power devices

## License

No license file is currently included.
Add a `LICENSE` file (for example MIT) before publishing publicly.
