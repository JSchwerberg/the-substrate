# The Substrate - Development Plan

## Summary

Web-based PWA incremental/idle game with tactical grid-based exploration. MVP focuses on a single expedition loop with meta-progression.

**Target:** Web PWA
**Visual Style:** 2D Pixel Art (placeholder shapes)
**Status:** Phases 1-6 complete (MVP)

---

## Tech Stack (Actual)

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 5 (strict mode) |
| Rendering | PixiJS 8 + @pixi/react |
| State | Zustand |
| Build | Vite 7 + vite-plugin-pwa |
| Styling | Inline styles (dark theme) |

---

## Completed Phases

### Phase 1-3: Foundation ✓
- Vite + React + TypeScript project with strict config
- PixiJS integration, pan/zoom controls
- Procedural sector generation (seeded RNG)
- Fog of war with line-of-sight
- A* pathfinding
- Process entities (Scout, Purifier) with movement
- Malware entities (Worm, Trojan, Rootkit, Logic Bomb)

### Phase 4: Combat & AI ✓
- Tick-based game loop (500ms)
- Auto-combat (processes attack adjacent malware)
- Malware AI (aggro, chase, attack)
- Dormant activation (Trojans wake on proximity)
- Victory/defeat conditions
- Combat log

### Phase 5: UI ✓
- ResourcePanel, DeploymentPanel, ProcessInfoPanel
- ExpeditionStatus with victory/defeat overlay
- CombatLog (auto-scroll)
- BehaviorRuleEditor (conditions, actions, templates)

### Phase 5.5: Core Loop & Progression ✓
- Deploy costs (Scout: 20, Purifier: 40 cycles)
- Data cache collection (+10 cycles)
- Worm replication (every 5 ticks)
- Persistent Data currency
- Expedition rewards calculation
- UpgradeShop (4 upgrades with exponential costs)
- Difficulty selector (Easy/Normal/Hard)

### Phase 6: Polish & PWA ✓
- Save/load system with IndexedDB (auto-save on rewards/upgrades)
- Offline caching via vite-plugin-pwa (precache all assets)
- Performance: PixiJS bundle acceptable, memoization in place
- Mobile touch: pinch-to-zoom, adequate touch targets
- Loading screen on app init

---

## Known Issues (Backlog)

- Units cannot move after victory (tick loop blocked)
- Grid not rendering on initial page load (PixiJS timing)
- Create legend for viruses/tile colors/symbols
- Balance: Worms replicate too fast (exponential growth overwhelms player)

---

## Comprehensive Review Results (2025-12-03)

**Overall Grade: B (78/100)**

### Critical Issues (P0)

| Issue | Location | Impact |
|-------|----------|--------|
| Minimal test coverage (~2.5%) | Only `SaveManager.test.ts` exists | High regression risk |
| Worm replication TODO incomplete | `MalwareAI.ts:350` | Core mechanic non-functional |
| Unused Expedition model (246 lines) | `src/core/models/expedition.ts` | Architectural confusion |
| BehaviorSystem not integrated | `BehaviorSystem.ts` | Feature exists but unused in game loop |

### High Priority (P1)

| Issue | Category | Location |
|-------|----------|----------|
| Grid cloning 184KB/tick | Performance | `gameStore.ts:27-35` |
| No React memoization | Performance | All UI components |
| 664-line monolithic store | Code Quality | `gameStore.ts` |
| CSP allows 'unsafe-eval' | Security | `index.html:10` |
| Integer overflow in rewards | Security | `gameStore.ts:519-530` |
| Service worker cache poisoning | Security | `vite.config.ts:41-56` |
| No pathfinding cache | Performance | `Pathfinding.ts` |
| Missing Error Boundaries | React | All components |
| No gameStore JSDoc | Documentation | `gameStore.ts:132-169` |
| Cross-tab state corruption | Security | `SaveManager.ts` |

### Phase Scores

| Phase | Category | Score |
|-------|----------|-------|
| 1A | Code Quality | 75/100 |
| 1B | Architecture | 85/100 |
| 2A | Security | 88/100 |
| 2B | Performance | 70/100 |
| 3A | Test Coverage | 25/100 |
| 3B | Documentation | 70/100 |
| 4A | Framework Best Practices | 82/100 |
| 4B | CI/CD & DevOps | 30/100 |

### Strengths Identified

- **Architecture:** Perfect framework independence in `/src/core/`
- **TypeScript:** Strict mode with `noUncheckedIndexedAccess`
- **Security:** Zero XSS vectors, comprehensive Zod validation
- **Game Loop:** Clean phase-based TickSystem

### Remediation Roadmap

**Week 1: Foundation** ✓ (Completed 2025-12-03)
- [x] Initialize git repository
- [x] Set up GitHub Actions CI pipeline
- [x] Add ESLint + Prettier
- [x] Fix unused Legend import

**Week 2: Performance & Security**
- [ ] Add Immer for grid cloning (2h)
- [ ] Add React.memo to UI components (4h)
- [ ] Remove CSP 'unsafe-eval' (2h)
- [ ] Add integer overflow protection (2h)

**Week 3-4: Testing**
- [ ] TickSystem tests - 50 tests (8h)
- [ ] gameStore tests - 80 tests (10h)
- [ ] Pathfinding tests - 30 tests (4h)
- [ ] MalwareAI tests - 40 tests (6h)

**Week 5-6: Architecture Cleanup**
- [ ] Remove/integrate Expedition model (4h)
- [ ] Integrate or remove BehaviorSystem (4h)
- [ ] Split gameStore into domain stores (8h)
- [ ] Add README.md and developer docs (8h)

### Test Coverage Gap

| Category | Current | Target |
|----------|---------|--------|
| Core Systems | 0% | 80% |
| Game State | 0% | 75% |
| Models | 0% | 70% |
| UI Components | 0% | 40% |
| Persistence | 78% | 85% |
| **Overall** | **~2.5%** | **70%** |

### Performance Optimizations

| Optimization | Memory Gain | CPU Gain | Effort |
|-------------|-------------|----------|--------|
| Immer for grid cloning | 75% | 60% | 2h |
| React.memo on components | 5% | 30% | 4h |
| Pathfinding cache | 15% | 60% | 3h |
| Granular Zustand selectors | 0% | 20% | 6h |

---

## CI/CD Status

**Pipeline:** `.github/workflows/ci.yml`

| Job | Status | Purpose |
|-----|--------|---------|
| quality | ✅ Passing | Type check, lint, format, tests |
| security | ✅ Passing | npm audit |
| build | ✅ Passing | Vite build + artifact upload |

**Tools Configured:**
- ESLint 9 + typescript-eslint
- Prettier
- Vitest with coverage

**Pending:**
- [ ] Set up GitHub Pages deployment (auto-deploy on push to main)

---

## Future (Out of Scope for MVP)

- Multiple sectors / campaign map
- Process modules / loadout customization
- Prestige / recompilation system
- Offline progression
- Sound / music
- Behavior rules executing automatically (currently UI-only)

---

## Key Architecture

```
src/
├── core/           # Pure game logic (no React)
│   ├── models/     # Grid, Process, Malware, Behavior
│   ├── systems/    # Pathfinding, FogOfWar, Combat, BehaviorSystem, MalwareAI
│   └── generation/ # SectorGenerator
├── game/state/     # Zustand store (gameStore.ts)
├── renderer/       # PixiJS components
└── ui/             # React UI panels
```

**Principle:** Core logic is framework-agnostic TypeScript.

---

## Resource Design

| Type | Scope | Usage |
|------|-------|-------|
| Cycles | Per-expedition | Deploy units, earned from caches |
| Data | Persistent | Earned from expeditions, spent on upgrades |

**Upgrades:** +Max HP, +Attack, +Defense, +Starting Cycles (exponential cost scaling)

**Difficulty:** Easy (0.5x malware, 0.75x rewards) / Normal / Hard (2x malware, 1.5x rewards)
