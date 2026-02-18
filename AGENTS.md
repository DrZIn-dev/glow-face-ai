# Repository Guidelines

## Project Structure & Module Organization
This repository is intentionally minimal:
- `src/features/glow-face/GlowFaceApp.tsx`: Main React component containing camera setup, MediaPipe FaceMesh integration, filter presets, and UI logic.
- `src/main.tsx` and `src/App.tsx`: React entry and app wiring.
- `README.md`: Project title and high-level description.

Keep related logic grouped by concern inside `src/features/glow-face/GlowFaceApp.tsx` (constants, hooks, handlers, rendering). If the file grows, split into `src/components/`, `src/hooks/`, and `src/utils/` before adding new features.

## Build, Test, and Development Commands
There is currently no committed build toolchain (`package.json` is not present). Use lightweight local checks while developing:
- `npx prettier --check src/features/glow-face/GlowFaceApp.tsx`: Validate formatting.
- `npx eslint src/features/glow-face/GlowFaceApp.tsx`: Run lint checks (if ESLint config exists locally).
- `npx tsc --noEmit`: Type-check without output.

If you add a full app scaffold, document canonical commands in `README.md` (for example: `npm run dev`, `npm test`, `npm run build`).

## Coding Style & Naming Conventions
- Use functional React components and hooks.
- Prefer `const` + arrow functions for handlers/utilities.
- Use clear camelCase names (`selectedFilterId`, `handleResetConfig`).
- Keep preset/config constants in UPPER_SNAKE_CASE (`FILTER_PRESETS`, `SLIDER_DEFS`).
- Use 2-space indentation, semicolons, and single quotes to match current file style.
- Keep implementations KISS: avoid premature abstraction and duplicate only when it improves readability.

## Testing Guidelines
No automated test suite is currently committed. For each change:
- Verify camera permission flow and error states.
- Verify each filter preset, slider adjustment, capture, and download behavior.
- Re-test on desktop Chrome (primary target) and at least one additional browser.

When adding tests, prefer React Testing Library + Vitest/Jest and name files `*.test.tsx` next to source files.

## Commit & Pull Request Guidelines
Current history uses short, imperative commit messages (example: `Update project name in README`). Keep commits focused and small.

For pull requests:
- Describe user-visible changes and technical approach.
- Link related issue/task IDs.
- Include before/after screenshots or short recordings for UI changes.
- List manual verification steps performed.
