# The Substrate - Development Plan

## Summary

Web-based PWA incremental/idle game with tactical grid-based exploration. MVP complete. Now implementing quality improvements from comprehensive review.

**Status:** Post-MVP Quality Improvements (2025-12-03)
**Overall Grade:** B (78/100) from comprehensive review

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 5 (strict mode) |
| Rendering | PixiJS 8 + @pixi/react |
| State | Zustand (9 slices) + Immer |
| Build | Vite 7 + vite-plugin-pwa |
| Testing | Vitest (512 tests, 60% line / 30.4% branch) |

---

## Review Grades (2025-12-03)

| Category | Grade | Key Gap |
|----------|-------|---------|
| Code Quality | B (78) | 15 duplication patterns |
| Architecture | B+ (82) | Orchestration still monolithic |
| Security | B+ (82) | Needs CodeQL |
| Performance | B- (72) | Pathfinding bottleneck, 774KB bundle |
| Testing | 60%/30% | Branch coverage critical |
| Documentation | B (81) | Missing README.md |
| Framework | A- (87) | Unused Jotai |
| CI/CD | 2.5/5 | No coverage gates |

---

## Sprint 8: Quick Wins (Parallel Execution)

**Objective:** Address P0/P1 items with minimal effort, maximum impact

### Track A: Documentation ⏱️ 2.5 hours
| Task | Agent | Time |
|------|-------|------|
| A1. Create README.md | `docs-architect` | 2h |
| A2. Update CLAUDE.md known issues | `docs-architect` | 30m |

### Track B: CI/CD Hardening ⏱️ 1 hour
| Task | Agent | Time |
|------|-------|------|
| B1. Add coverage gates (70% threshold) | `deployment-engineer` | 15m |
| B2. Add pre-commit hooks (husky + lint-staged) | `deployment-engineer` | 20m |
| B3. Add deploy health checks | `deployment-engineer` | 10m |
| B4. Add commitlint | `deployment-engineer` | 10m |
| B5. Enable Dependabot | `deployment-engineer` | 5m |

### Track C: Dependency Cleanup ⏱️ 15 minutes
| Task | Agent | Time |
|------|-------|------|
| C1. Remove unused Jotai dependency | `typescript-pro` | 1m |
| C2. Verify no imports, update package.json | `typescript-pro` | 5m |
| C3. Run type-check and tests | `typescript-pro` | 9m |

### Track D: Entity Query Optimization ⏱️ 1 hour
| Task | Agent | Time |
|------|-------|------|
| D1. Create `/src/core/utils/entity-queries.ts` | `typescript-pro` | 30m |
| D2. Extract `getAliveProcesses`, `getAliveMalware`, `getEntitiesInRange` | `typescript-pro` | 15m |
| D3. Replace 15+ Array.from().filter() patterns | `typescript-pro` | 15m |

**Exit Criteria:** README exists, CI enforces coverage, Jotai removed, entity queries centralized.

---

## Sprint 9: Testing Gap Closure (Parallel Execution)

**Objective:** Raise branch coverage from 30.4% → 70%

### Track A: Core System Tests ⏱️ 8 hours
| Task | Agent | Time |
|------|-------|------|
| A1. BehaviorSystem.test.ts (40 tests) | `test-automator` | 4h |
| A2. CombatSystem.test.ts (30 tests) | `test-automator` | 2h |
| A3. FogOfWar.test.ts (20 tests) | `test-automator` | 2h |

### Track B: State Tests ⏱️ 4 hours
| Task | Agent | Time |
|------|-------|------|
| B1. Expand SaveManager tests (+20 branch coverage) | `test-automator` | 2h |
| B2. Expand gameStore edge cases (+15 tests) | `test-automator` | 2h |

### Track C: UI Component Tests ⏱️ 8 hours
| Task | Agent | Time |
|------|-------|------|
| C1. DeploymentPanel.test.tsx (25 tests) | `frontend-developer` | 3h |
| C2. ExpeditionRewards.test.tsx (20 tests) | `frontend-developer` | 2h |
| C3. CampaignMap.test.tsx (15 tests) | `frontend-developer` | 2h |
| C4. ResourcePanel.test.tsx (10 tests) | `frontend-developer` | 1h |

**Exit Criteria:** Branch coverage ≥ 70%, UI components have basic test coverage.

---

## Sprint 10: Performance Optimization (Parallel Execution)

**Objective:** Reduce bundle size, optimize tick performance

### Track A: Bundle Size ⏱️ 2 hours
| Task | Agent | Time |
|------|-------|------|
| A1. Add bundle analysis to CI | `deployment-engineer` | 30m |
| A2. Code-split PixiJS (React.lazy) | `frontend-developer` | 45m |
| A3. Code-split UpgradeShop, BehaviorRuleEditor | `frontend-developer` | 45m |

### Track B: Pathfinding Cache ⏱️ 4 hours
| Task | Agent | Time |
|------|-------|------|
| B1. Implement pathfinding result cache | `performance-engineer` | 2h |
| B2. Cache invalidation on grid/entity changes | `performance-engineer` | 1h |
| B3. Add pathfinding benchmarks | `performance-engineer` | 1h |

### Track C: React Optimization ⏱️ 2 hours
| Task | Agent | Time |
|------|-------|------|
| C1. Extract inline event handlers to useCallback | `frontend-developer` | 1h |
| C2. Add error state management to store | `typescript-pro` | 45m |
| C3. Fix touch event cleanup | `frontend-developer` | 15m |

**Exit Criteria:** Bundle <500KB, pathfinding cached, no inline handlers in memoized components.

---

## Sprint 11: Documentation & DevOps Polish

**Objective:** Complete documentation, enhance observability

### Track A: Documentation ⏱️ 4 hours
| Task | Agent | Time |
|------|-------|------|
| A1. Document Tutorial System in README | `docs-architect` | 1h |
| A2. Update game loop docs (9 phases) | `docs-architect` | 30m |
| A3. Add JSDoc to UI components | `docs-architect` | 2h |
| A4. Create .env.example | `docs-architect` | 10m |

### Track B: ADRs ⏱️ 2 hours
| Task | Agent | Time |
|------|-------|------|
| B1. ADR-001: Zustand for state management | `architect-review` | 30m |
| B2. ADR-002: PixiJS for rendering | `architect-review` | 30m |
| B3. ADR-003: Phase-based tick system | `architect-review` | 30m |
| B4. ADR-004: Core/framework separation | `architect-review` | 30m |

### Track C: Observability ⏱️ 1.5 hours
| Task | Agent | Time |
|------|-------|------|
| C1. Add Sentry error tracking | `deployment-engineer` | 45m |
| C2. Add branch protection rules | `deployment-engineer` | 10m |
| C3. Configure performance monitoring | `performance-engineer` | 35m |

**Exit Criteria:** Full documentation, ADRs created, error tracking live.

---

## Known Issues (Backlog)

### Critical (P0)
- [ ] **Branch coverage 30.4%** - Edge cases untested (target: 70%)
- [ ] **Missing README.md** - Blocks external contributors
- [ ] **No coverage enforcement in CI** - Regressions possible
- [ ] **Pathfinding cache missing** - 8ms bottleneck @ 50 entities

### High Priority (P1)
- [ ] **Bundle size 774KB** (target <500KB) - Need code splitting
- [ ] **15+ Array.from().filter() patterns** - 3x slower than cached
- [ ] **Unused Jotai dependency** - 28KB bloat
- [ ] **CLAUDE.md outdated** - Claims 2.5% coverage, mentions deleted model
- [ ] **UI components 0% test coverage** - 18 components untested
- [ ] **No pre-commit hooks** - Manual format/lint

### Medium Priority (P2)
- [ ] No error state management in store (silent failures)
- [ ] Inline event handlers reduce React.memo effectiveness
- [ ] No deploy health checks
- [ ] No Dependabot for dependency updates
- [ ] Missing ADRs (Architecture Decision Records)

### Low Priority (P3)
- [ ] Cross-tab state synchronization
- [ ] No Sentry error tracking
- [ ] Missing .env.example

---

## Post-MVP: Campaign & Corruption System

### Sprint 12: Campaign Foundation ✓
- [x] Campaign data model with sectors, connections
- [x] Sector persistence (fog, killed malware, status)
- [x] Process pool (survivors carry over)
- [x] Campaign map UI

### Sprint 13: Corruption Core (Next Feature Sprint)
- [ ] Corruption node entity (stationary, attackable)
- [ ] Tile corruption state + spread phase (20 ticks)
- [ ] Corrupted tile effects (5 HP/tick damage, blocks vision)
- [ ] Victory: all nodes destroyed; Defeat: spawn corrupted

### Sprint 14: Cross-Sector Spread
- [ ] Global corruption tick (1% chance to spread between sectors)
- [ ] Campaign pressure (unattended sectors worsen)
- [ ] Sector loss mechanics

### Sprint 15: Polish & Balance
- [ ] Corruption node health bars
- [ ] Spawn danger indicators
- [ ] Balance tuning (spread rate, damage, cross-sector %)

---

## Future (Post-Corruption)

- Prestige / recompilation system
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
│   ├── gameStore.ts      # Main store (333 lines, composes slices)
│   └── slices/           # 9 domain slices
├── renderer/       # PixiJS components
└── ui/             # React UI panels (18 components)
```

**Principle:** Core logic is framework-agnostic TypeScript.
