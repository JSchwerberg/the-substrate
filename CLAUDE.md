# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**Current Phase:** MVP Complete (Phases 1-6) with Sprint 1 fixes applied
**Overall Grade:** B (78/100) from comprehensive review (2025-12-03)
**Test Coverage:** ~2.5% (critical gap - see PLAN.md for testing roadmap)

### Recent Changes (Sprint 1 - 2025-12-03)
- Removed `unsafe-eval` from CSP (security fix)
- Added integer overflow protection for rewards (`SAFE_LIMITS` in GameConfig.ts)
- Fixed units unable to move after victory
- Fixed grid not rendering on initial page load (PixiJS timing)
- Applied Prettier formatting to all source files

## Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier format all files
npm run format:check # Check Prettier formatting (CI)
npm run type-check   # TypeScript type checking only
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run, CI)
npm run test:coverage # Vitest with coverage report
```

## Architecture

This is "The Substrate" - a web-based incremental/idle game with tactical grid-based exploration, built as a PWA.

### Tech Stack
- **React 19 + TypeScript 5** with strict mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **PixiJS 8 + @pixi/react** for WebGL rendering
- **Zustand** for game state, **Jotai** for UI state
- **Vite 7** with PWA plugin

### Path Aliases (tsconfig.json)
```
@/*        → ./src/*
@core/*    → ./src/core/*
@game/*    → ./src/game/*
@renderer/* → ./src/renderer/*
@ui/*      → ./src/ui/*
```

### Core Separation Principle
Game logic in `/src/core/` is **pure TypeScript with no React/framework dependencies**. This enables isolated unit testing and clean separation:

- **`/src/core/models/`** - Data interfaces (Process, Malware, Grid, Behavior rules)
- **`/src/core/systems/`** - Game systems (Pathfinding, FogOfWar, Combat, BehaviorSystem, MalwareAI)
- **`/src/core/generation/`** - Procedural sector generation with seeded RNG
- **`/src/game/state/gameStore.ts`** - Zustand store, single source of truth
- **`/src/renderer/`** - PixiJS components (GameCanvas, Grid, ProcessSprite, MalwareSprite)

### Game Loop
The tick-based game loop runs in `gameStore.ts` at 500ms intervals:
1. Process movement (pathfinding-based)
2. Process combat (auto-attack adjacent malware)
3. Malware AI (attack, chase, aggro detection)
4. Dormant activation (trojans wake on proximity)
5. Victory/defeat checking

### Key Patterns
- **Immutable state updates** - Always create new objects/arrays for Zustand, never mutate
- **Deep clone grid** before fog of war updates to trigger React re-renders
- **Two-layer visibility**: Tile fog of war (hidden/revealed/visible) + Malware `isRevealed` (trojans hide until triggered)

### Entity Types
- **Process** (player units): Scout (fast, high sight), Purifier (high damage, slow)
- **Malware** (enemies): Worm (mobile), Trojan (dormant ambusher), Rootkit (stationary, corrupts), Logic Bomb (explodes)

## CI/CD Pipeline

GitHub Actions workflow in `.github/workflows/ci.yml`:

| Job | Purpose |
|-----|---------|
| quality | Type check, lint, format check, tests |
| security | npm audit |
| build | Vite production build + artifact upload |

**Pre-commit checklist:**
1. `npm run type-check` - Verify TypeScript compiles
2. `npm run lint` - Check for lint errors
3. `npm run format` - Apply Prettier formatting
4. `npm run test:run` - Run tests

## Known Issues (Backlog)

See `PLAN.md` for full details. Key items:
- **Test coverage ~2.5%** - Only SaveManager.test.ts exists
- **Unused Expedition model** (246 lines) - `src/core/models/expedition.ts` creates confusion
- **BehaviorSystem not integrated** - Feature exists in UI but rules never execute in game loop
- **664-line monolithic store** - `gameStore.ts` should be split into domain stores

## Development Guidelines

- Prefer using specialized subagents, including: the debugger agent when fixing bugs; the javascript-typescript and frontend-mobile-development agents; or any others that you feel are appropriate for the job.
- Use appropriate specialized subagents: frontend-mobile-development, javascript-typescript, error-diagnostics.
- Use prettier to ensure that all committed changes meet style guidelines
- Always run `npm run format` before committing to pass CI checks