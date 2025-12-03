# The Substrate - Development Plan

## Summary

Web-based PWA incremental/idle game with tactical grid-based exploration. MVP focuses on a single expedition loop with meta-progression.

**Target:** Web PWA
**Visual Style:** 2D Pixel Art (placeholder shapes)
**Status:** Core systems complete, design alignment in progress

---

## Tech Stack (Actual)

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 5 (strict mode) |
| Rendering | PixiJS 8 + @pixi/react |
| State | Zustand (with slices) |
| Build | Vite 7 + vite-plugin-pwa |
| Styling | Inline styles (dark theme) |

---

## Design Document Alignment

### Current vs Design Doc (as of 2025-12-03)

| Feature | Design Doc | Current Implementation | Priority |
|---------|-----------|------------------------|----------|
| **Victory Condition** | Reach exit / reclaim sector | Kill all malware | P0 - Change |
| **Mid-Expedition Deployment** | Costs energy (intervention) | Costs cycles (unlimited) | P0 - Change |
| **Worm Replication** | Spread and multiply | 5-tick cooldown (too fast) | P0 - Balance |
| **Resource Triangle** | Cycles/Memory/Energy all meaningful | Only Cycles used | P1 - Enhance |
| **Intervention System** | Spend energy for directives | Not implemented | P1 - Add |
| **Corruption System** | Core pressure mechanic | Not implemented | P2 - Future |
| **Prestige/Recompilation** | Major progression system | Not implemented | P2 - Future |

### Design Decisions Made

1. **Victory Condition**: Change to "reach exit point" - strategic objective vs brute force
2. **Mid-Expedition Deployment**: Costs energy instead of cycles (aligns with intervention design)
3. **Worm Balance**: Increase cooldown (5 → 10 ticks) AND add max worm cap per sector

---

## Sprint 5: Design Alignment + gameStore Split

### Phase 5A: Balance & Victory (Priority)

**Objective:** Make the core loop playable and satisfying

1. **Worm Replication Balance**
   - [ ] Increase replication cooldown: 5 → 10 ticks (5 seconds)
   - [ ] Add max worm cap per sector: 8 worms (Easy), 12 (Normal), 16 (Hard)
   - [ ] Update GameConfig.ts with WORM.MAX_COUNT constant
   - [ ] Modify wormReplicationPhase to check cap before spawning

2. **Victory Condition: Exit Point**
   - [ ] Add `exitPoint: GridPosition` to Sector model
   - [ ] Generate exit point in SectorGenerator (opposite corner from spawn)
   - [ ] Render exit point on grid (distinct visual)
   - [ ] Add victory check: process reaches exit tile
   - [ ] Optional: require minimum caches collected for victory

3. **Mid-Expedition Deployment (Energy Cost)**
   - [ ] Change deployProcess to cost energy when expeditionActive is true
   - [ ] Keep cycles cost for pre-expedition deployment
   - [ ] Add energy regeneration: +5 energy per tick (capped at max)
   - [ ] Update DeploymentPanel to show energy cost during expedition

### Phase 5B: gameStore Split (Phases 2-5)

**Objective:** Complete modular store architecture

4. **EntitySlice** (processes, malware, selection)
   - [ ] Extract entity state and basic actions
   - [ ] Keep deployProcess in main store (cross-slice dependency)

5. **GridSlice** (sector, grid, visibility)
   - [ ] Extract sector management
   - [ ] Add exitPoint to sector state

6. **ExpeditionSlice** (active, result, score, tick, combatLog)
   - [ ] Extract expedition orchestration
   - [ ] Keep tick() as main orchestrator

7. **ProgressionSlice** (upgrades, persistentData, save/load)
   - [ ] Extract progression and persistence
   - [ ] Move claimExpeditionRewards logic

### Phase 5C: Energy System

**Objective:** Make energy meaningful per design doc

8. **Energy Mechanics**
   - [ ] Energy regeneration during expedition (+5/tick)
   - [ ] Energy cost for mid-expedition deployment (20 for Scout, 30 for Purifier)
   - [ ] Display energy in ResourcePanel with regeneration indicator
   - [ ] Add "low energy" warning when < 20

### Estimated Effort

| Task | Effort | Risk |
|------|--------|------|
| Worm balance (cooldown + cap) | 1h | Low |
| Victory condition (exit point) | 3h | Medium |
| Energy-based deployment | 2h | Low |
| gameStore Phases 2-5 | 8h | Medium |
| Energy regeneration system | 2h | Low |
| **Total** | **16h** | |

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
- Worm replication (every 5 ticks) - **needs rebalancing**
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

### Sprint 1-2: Quality & Performance ✓ (2025-12-03)
- CI/CD pipeline with GitHub Actions
- ESLint + Prettier configuration
- Immer for grid cloning (structural sharing)
- React.memo on 13 UI components
- CSP security (pixi.js/unsafe-eval for compliance)
- Integer overflow protection

### Sprint 3: Testing ✓ (2025-12-03)
- TickSystem tests - 78 tests (99% coverage)
- gameStore tests - 104 tests (90% coverage)
- Pathfinding tests - 82 tests (97% coverage)
- MalwareAI tests - 75 tests (75% coverage)
- **Total: 376 tests, ~53% coverage**

### Sprint 4: Architecture (In Progress)
- [x] Remove Expedition model - deleted 246 lines
- [x] Integrate BehaviorSystem into tick loop
- [x] Split gameStore Phase 1 - BehaviorSlice, ConfigSlice, ResourceSlice
- [ ] Split gameStore Phases 2-5 (merged into Sprint 5)

---

## Known Issues (Backlog)

### Critical (P0)
- [x] ~~Minimal test coverage~~ → Fixed: 376 tests, ~53% coverage
- [x] ~~BehaviorSystem not integrated~~ → Fixed: wired into tick loop
- [x] ~~Victory condition is "kill all" not strategic objective~~ → Fixed: exit point victory
- [x] ~~Worm replication too fast (5-tick cooldown)~~ → Fixed: 10-tick + max cap

### High Priority (P1)
- [x] ~~Energy resource unused (no regeneration, no cost)~~ → Fixed: regen + deployment cost
- [ ] Memory resource unused (no capacity gating) → Future
- [ ] No intervention system during expeditions → Sprint 5 partial

### Medium Priority (P2)
- [ ] Units cannot move after victory (tick loop stops)
- [ ] No pathfinding cache (performance)
- [ ] No error boundaries in React components
- [ ] 551-line gameStore still large → Sprint 5

### Low Priority (P3)
- [ ] Defeat screen redundant clicks (Claim Rewards → New Expedition could be one action)
- [ ] Legend for tile colors/symbols
- [ ] Service worker cache versioning
- [ ] Cross-tab state synchronization

---

## Resource Design (Updated)

### Per-Expedition Resources

| Resource | Function | Current | Target |
|----------|----------|---------|--------|
| **Cycles** | Deploy cost (pre-expedition) | ✅ Working | Maintain |
| **Energy** | Deploy cost (mid-expedition), interventions | ❌ Unused | Sprint 5 |
| **Memory** | Process capacity limit | ❌ Unused | Future |

### Persistent Resources

| Resource | Function | Status |
|----------|----------|--------|
| **Data** | Upgrade currency | ✅ Working |

### Energy System (Sprint 5 Target)

- **Starting Energy:** 75
- **Max Energy:** 100
- **Regeneration:** +5 per tick during expedition
- **Mid-Expedition Deploy Cost:** Scout 20, Purifier 30
- **Pre-Expedition Deploy:** Uses cycles (unchanged)

---

## Test Coverage

| Category | Current | Target |
|----------|---------|--------|
| TickSystem | 99% | 80% ✓ |
| Pathfinding | 97% | 80% ✓ |
| gameStore | 90% | 75% ✓ |
| MalwareAI | 75% | 80% |
| Models | 46% | 70% |
| UI Components | 0% | 40% |
| **Overall** | **~53%** | **70%** |

---

## CI/CD Status

**Pipeline:** `.github/workflows/ci.yml`

| Job | Status | Purpose |
|-----|--------|---------|
| quality | ✅ Passing | Type check, lint, format, tests |
| security | ✅ Passing | npm audit |
| build | ✅ Passing | Vite build + artifact upload |
| deploy | ✅ Configured | GitHub Pages (main branch) |

---

## Future (Post-MVP)

- Multiple sectors / campaign map
- Process modules / loadout customization
- Prestige / recompilation system (design doc core feature)
- Corruption system (design doc pressure mechanic)
- Offline progression
- Sound / music
- Full intervention system (retreat, emergency protocols)
- Memory capacity gating

---

## Key Architecture

```
src/
├── core/           # Pure game logic (no React)
│   ├── models/     # Grid, Process, Malware, Behavior
│   ├── systems/    # Pathfinding, FogOfWar, Combat, BehaviorSystem, MalwareAI, TickSystem
│   └── generation/ # SectorGenerator
├── game/state/     # Zustand store
│   ├── gameStore.ts      # Main store (composes slices)
│   ├── slices/           # Domain slices
│   └── types.ts          # Shared types
├── renderer/       # PixiJS components
└── ui/             # React UI panels
```

**Principle:** Core logic is framework-agnostic TypeScript.
