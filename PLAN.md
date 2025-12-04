# The Substrate - Development Plan

## Summary

Web-based PWA incremental/idle game with tactical grid-based exploration. MVP focuses on a single expedition loop with meta-progression.

**Target:** Web PWA
**Visual Style:** 2D Pixel Art (placeholder shapes)
**Status:** MVP Complete (2025-12-03) - Starting Post-MVP Phase 1: Campaign & Corruption

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

| Feature | Design Doc | Current Implementation | Status |
|---------|-----------|------------------------|--------|
| **Victory Condition** | Reclaim sector | Destroy all corruption nodes | ✓ Planned (Sprint 13) |
| **Mid-Expedition Deployment** | Costs energy | Energy with 1.5x scaling | ✓ Complete |
| **Worm Replication** | Spread and multiply | 10-tick cooldown + max cap | ✓ Complete |
| **Resource Triangle** | Cycles/Memory/Energy | All meaningful | ✓ Complete |
| **Intervention System** | Energy directives | Retreat (50E) + Scan (30E) | ✓ Complete |
| **Corruption System** | Core pressure mechanic | Planned | Sprint 13-14 |
| **Multi-Sector Campaign** | Sector map | Planned | Sprint 12 |
| **Prestige/Recompilation** | Major progression | Not implemented | Post-Corruption |

### Design Decisions Made

1. **Victory Condition**: Destroy all corruption nodes (replaces exit points)
2. **Mid-Expedition Deployment**: Costs energy with exponential scaling
3. **Worm Balance**: 10-tick cooldown + max worm cap per sector
4. **Campaign Structure**: Node map with 3 connected sectors
5. **Corruption Spread**: 20 ticks within sector, 1% chance between sectors

---

## Sprint 5: Design Alignment + gameStore Split ✓ (2025-12-03)

### Phase 5A: Balance & Victory ✓

**Objective:** Make the core loop playable and satisfying

1. **Worm Replication Balance** ✓
   - [x] Increase replication cooldown: 5 → 10 ticks (5 seconds)
   - [x] Add max worm cap per sector: 8 worms (Easy), 12 (Normal), 16 (Hard)
   - [x] Update GameConfig.ts with WORM.MAX_COUNT constant
   - [x] Modify wormReplicationPhase to check cap before spawning

2. **Victory Condition: Exit Point** ✓
   - [x] Add `exitPoints: GridPosition[]` to Sector model
   - [x] Generate exit points in SectorGenerator (opposite corner from spawn)
   - [x] Render exit points on grid (distinct visual)
   - [x] Add victory check: process reaches exit tile

3. **Mid-Expedition Deployment (Energy Cost)** ✓
   - [x] Change deployProcess to cost energy when expeditionActive is true
   - [x] Keep cycles cost for pre-expedition deployment
   - [x] Add energy regeneration: +5 energy per tick (capped at max)
   - [x] Update DeploymentPanel to show energy cost during expedition
   - [x] Exponential scaling: 1.5x per deployment (30 → 45 → 68 → ...)

### Phase 5B: gameStore Split ✓

**Objective:** Complete modular store architecture

4. **EntitySlice** (48 lines) ✓
   - [x] Extract processes, malware, selectedProcessId
   - [x] Keep deployProcess in main store (cross-slice orchestration)

5. **GridSlice** (70 lines) ✓
   - [x] Extract currentSector, updateVisibility
   - [x] Uses Immer for efficient fog updates

6. **ExpeditionSlice** (109 lines) ✓
   - [x] Extract expedition state, tick count, combat log
   - [x] Keep tick() as main orchestrator

7. **ProgressionSlice** (176 lines) ✓
   - [x] Extract persistentData, upgrades, save/load
   - [x] Moved claimExpeditionRewards logic

**Result:** gameStore reduced from 588 → 333 lines. 7 slices total (1043 lines with types).

### Phase 5C: Energy System ✓

**Objective:** Make energy meaningful per design doc

8. **Energy Mechanics** ✓
   - [x] Energy regeneration during expedition (+5/tick)
   - [x] Energy cost for mid-expedition deployment (30 Scout, 50 Purifier, 1.5x scaling)
   - [x] Display energy cost in DeploymentPanel during expedition
   - [ ] Add "low energy" warning when < 30 (future enhancement)

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
- [x] ~~Memory resource unused (no capacity gating)~~ → Fixed: Scout 20, Purifier 35 memory cost
- [x] ~~No intervention system during expeditions~~ → Fixed: Retreat (50E) + Scan (30E)

### Medium Priority (P2)
- [x] ~~Units cannot move after victory (tick loop stops)~~ → Fixed: tick allows victory continuation
- [x] ~~No pathfinding cache (performance)~~ → Deferred: low impact (grid/targets change frequently)
- [x] ~~No error boundaries in React components~~ → Fixed: ErrorBoundary wraps App + GameCanvas
- [x] ~~551-line gameStore still large~~ → Fixed: 333 lines + 7 slices

### Low Priority (P3)
- [x] ~~Defeat screen redundant clicks~~ → Fixed: "Claim & Continue" primary action
- [x] ~~Legend for tile colors/symbols~~ → Already implemented in Legend.tsx
- [x] ~~Service worker cache versioning~~ → Workbox auto-handles via asset hashing
- [ ] Cross-tab state synchronization → Deferred to post-MVP

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
| Models | ~80% | 70% ✓ |
| UI Components | 0% | 40% |
| **Overall** | **~60%** | **70%** |

**Total Tests: 512**

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

## Post-MVP Phase 1: Campaign & Corruption System

### Design Decisions

| Aspect | Decision |
|--------|----------|
| **Campaign structure** | Node map (3 sectors connected as graph) |
| **Sector selection** | Player picks which sector to expedition into |
| **Corruption source** | Corruption nodes (entities) generated on map |
| **Victory condition** | Destroy all corruption nodes (replaces exit points) |
| **Defeat condition** | Corruption reaches spawn points |
| **Sector persistence** | Fog ✓, Malware deaths ✓, Corruption frozen when cleared |
| **Process handling** | Return to pool after expedition, redeploy into next sector |
| **Spread within sector** | Every 20 ticks to adjacent tiles |
| **Spread between sectors** | 1% chance per tick, corrupts edge tiles |
| **Corrupted tile effects** | 5 HP damage/tick + blocks vision |
| **Spread timing** | Hybrid: slow real-time + burst on expedition end |
| **Campaign saves** | One campaign at a time |

---

### Sprint 12: Campaign Foundation ✓ (2025-12-03)

**Objective:** Multi-sector structure with persistence

1. **Campaign Data Model** ✓
   - [x] `Campaign` interface: sectors[], connections[], currentSectorId
   - [x] `SectorState`: id, name, grid, fog state, killed malware IDs, corruption state, status
   - [x] `CampaignSlice` in Zustand store
   - [x] Campaign generation (3 sectors, 2-3 connections)

2. **Sector Persistence** ✓
   - [x] Save/restore fog of war grid state
   - [x] Track killed malware IDs (don't respawn)
   - [x] Sector status: unexplored | in_progress | cleared | lost
   - [x] IndexedDB schema update for campaign data

3. **Process Pool** ✓
   - [x] Surviving processes return to pool after expedition
   - [x] Pool persists across sectors
   - [x] Deploy from pool OR create new (costs resources)

4. **Campaign Map UI** ✓
   - [x] New screen: CampaignMap component
   - [x] Node graph visualization (circles + connecting lines)
   - [x] Sector status indicators (color-coded)
   - [x] Click to select, "Deploy" button to start expedition
   - [x] Navigation: Campaign Map ↔ Expedition

**Exit Criteria:** Can select sector, complete expedition, return to map, select different sector with first sector's state preserved.

---

### Sprint 13: Corruption Core

**Objective:** Corruption mechanics within a single sector

5. **Corruption Node Entity**
   - [ ] New entity type: `CorruptionNode` (like Malware but stationary)
   - [ ] Stats: HP (e.g., 150), no attack, high defense
   - [ ] Generated during sector creation (2-4 per sector based on difficulty)
   - [ ] Attackable by processes, triggers combat system
   - [ ] On death: stop spreading from this node

6. **Tile Corruption State**
   - [ ] Add `corrupted: boolean` to Tile interface
   - [ ] Corrupted tiles render with distinct visual (purple overlay?)
   - [ ] Track corruption spread origin (which node)

7. **Corruption Spread Phase**
   - [ ] New tick phase: `corruptionSpreadPhase()` in TickSystem
   - [ ] Every 20 ticks: each living node corrupts one adjacent non-corrupted tile
   - [ ] Spread pattern: prioritize toward spawn points? Random?
   - [ ] Corrupted tiles stay corrupted (no purification for now)

8. **Corrupted Tile Effects**
   - [ ] Damage: 5 HP/tick to any process on corrupted tile
   - [ ] Vision: Corrupted tiles block line of sight (update FogOfWar)
   - [ ] Pathfinding: Treat as walkable but costly? Or avoid?

9. **Victory/Defeat Conditions**
   - [ ] Remove exit point victory
   - [ ] Victory: All corruption nodes destroyed
   - [ ] Defeat: Any spawn point tile corrupted OR all processes destroyed
   - [ ] Update ExpeditionStatus UI for new conditions

**Exit Criteria:** Corruption nodes spawn, spread corruption, can be killed. Victory when all nodes dead, defeat when spawn corrupted.

---

### Sprint 14: Cross-Sector Spread

**Objective:** Corruption pressure across the campaign

10. **Global Corruption Tick**
    - [ ] Background timer or expedition-end trigger
    - [ ] For each sector with living corruption nodes:
      - 1% chance per tick to spread to connected sector
    - [ ] Spreading = add corrupted tiles to edge of target sector
    - [ ] If target sector has no nodes, spawn one at corruption site

11. **Campaign Pressure**
    - [ ] While clearing one sector, others may worsen
    - [ ] Visual indicator on campaign map: corruption level per sector
    - [ ] Warning when sector corruption is critical

12. **Sector Loss**
    - [ ] If corruption reaches spawn in unattended sector = sector lost
    - [ ] Lost sectors: can attempt to reclaim (harder) or abandon
    - [ ] Game over if all sectors lost? Or home sector lost?

**Exit Criteria:** Corruption spreads between sectors. Leaving a sector too long has consequences.

---

### Sprint 15: Polish & Balance

13. **UI Enhancements**
    - [ ] Corruption node health bars
    - [ ] Spawn point danger indicator (corruption approaching)
    - [ ] Sector corruption percentage on campaign map
    - [ ] Combat log entries for corruption damage

14. **Balance Tuning**
    - [ ] Node HP vs process damage
    - [ ] Spread rate (20 ticks) - too fast? too slow?
    - [ ] Cross-sector spread (1%) - tune based on playtesting
    - [ ] Corruption damage (5 HP) - meaningful but not instant death

15. **Edge Cases**
    - [ ] What if player has no processes and no resources?
    - [ ] Corruption spreading while paused?
    - [ ] Save/load mid-expedition with corruption state

**Exit Criteria:** Playable, balanced corruption loop. Clear strategic tension.

---

## Future (Post-Corruption)

- Prestige / recompilation system (RP currency, permanent upgrades)
- Process modules / loadout customization
- More archetypes (Defender, Reclaimer)
- Anomaly sectors (rule modifiers)
- Offline progression
- Sound / music

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
