# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint
npm run test     # Vitest
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
- Prefer using specialized subagents, including: the debugger agent when fixing bugs; the javascript-typescript and frontend-mobile-development agents; or any others that you feel are appropriate for the job.
- Use appropriate specialized subagents: frontend-mobile-development, javascript-typescript, error-diagnostics.
- Use prettier to ensure that all committed changes meet style guidelines