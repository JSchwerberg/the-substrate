# The Substrate — Game Design Document

## High Concept

You oversee a post-biological civilization existing as patterns in a planet-sized computational substrate. Your people are *processes* competing for cycles, memory, and energy. You allocate resources, design process behaviors, and send exploration threads into corrupted sectors to reclaim lost data and fight malware-like entities.

**Genre:** Incremental / Idle with active tactical elements  
**Core fantasies:** Optimization, exploration, automation mastery  
**Tone:** Tense but not grim; cosmic-scale digital survival  

---

## Core Loop

```
┌─────────────────────────────────────────────────────────┐
│  ALLOCATE → DESIGN → DEPLOY → OBSERVE → HARVEST → ↻    │
└─────────────────────────────────────────────────────────┘
```

1. **Allocate** resources (cycles/memory/energy) to your economy and expeditions
2. **Design** process behaviors using simple programming rules + loadout modules
3. **Deploy** exploration threads into corrupted grid sectors
4. **Observe** passive combat and exploration unfold (with limited intervention)
5. **Harvest** reclaimed data, new modules, and sector control
6. Corruption spreads; repeat with improved processes

---

## Resource Triangle

| Resource | Function | Scarcity Driver |
|----------|----------|-----------------|
| **Cycles** | Action speed; how many processes can run per tick | Finite per tick; must prioritize |
| **Memory** | Capacity; how many processes/modules you can field | Expands slowly; corruption eats it |
| **Energy** | Fuel for exploration and combat abilities | Regenerates, but spikes deplete it |

Tension comes from the triangle: you always want more of all three, but allocation means trade-offs.

---

## Main Systems

### 1. Process Design (Programming-lite + Loadout)

Processes are your units. Each has:

- **Archetype** (base stats + role): Scout, Defender, Reclaimer, Purifier, etc.
- **Behavior Rules** (priority list): Simple IF-THEN logic
  - *Example:* `IF adjacent_corruption > 2 THEN retreat ELSE attack_nearest`
  - *Example:* `IF health < 30% THEN seek_healer ELSE hold_position`
- **Modules** (loadout slots): Passive bonuses or active abilities
  - *Examples:* +memory efficiency, AoE purge, data siphon, self-repair

Early game: Limited archetypes, few rule slots, basic modules  
Progression unlocks: New archetypes, more rule complexity, rare modules

### 2. Exploration (Tile/Grid-Based)

Corrupted sectors are procedurally generated grids. You deploy a thread (squad of processes) and watch them navigate.

- **Fog of war** reveals as processes move
- **Tiles contain:** Empty space, data caches, corruption nodes, malware entities, anomalies
- **Spatial positioning matters:** Flanking, chokepoints, retreat paths
- **Limited intervention:** You can issue occasional directives (spend energy), but mostly your behavior rules play out

Each expedition is a "run" — success means reclaiming the sector; failure means losing processes (but gaining intel for next attempt).

### 3. Passive Combat

Combat resolves automatically based on process stats + behavior rules.

- Processes and malware entities take turns (or act simultaneously in ticks)
- Behavior rules determine targeting, positioning, ability use
- You watch, learn, and tweak rules for next deployment
- Intervention points: Spend energy to force an action, call retreat, trigger emergency protocols

**Malware entity types:**
- **Worms:** Spread and multiply; weak individually
- **Trojans:** Disguised as data caches; ambush
- **Rootkits:** Entrench in tiles; hard to remove but don't spread
- **Logic Bombs:** Dormant until triggered; massive spike damage

### 4. Corruption System

Corruption is the core pressure/tension mechanic.

**Passive spread:** Every N ticks, corruption creeps outward from existing nodes (slow but constant)

**Reactive spikes:** 
- Reclaiming sectors can destabilize adjacent ones
- Some malware deaths trigger corruption bursts
- Ignoring corrupted sectors too long spawns stronger entities

**Consequences of unchecked corruption:**
- Corrupted memory becomes unusable (shrinks your capacity)
- Corruption reaching your core = forced recompilation (prestige)

---

## Prestige System: Recompilation

When corruption overwhelms you (or you trigger it voluntarily), the substrate reboots.

**You lose:**
- All active processes
- Sector control
- Current resources

**You keep:**
- Unlocked archetypes and modules
- Behavior rule templates you've saved
- Recompilation Points (RP) based on run performance

**RP buys permanent upgrades:**
- Architecture improvements (base cycle/memory/energy capacity)
- New archetype unlocks
- Rule complexity upgrades (more slots, new conditions/actions)
- Corruption resistance
- Starting bonuses for next run

**Voluntary recompilation bonus:** If you trigger it yourself (before being overwhelmed), you get an RP multiplier — risk/reward of pushing further vs. banking progress.

---

## Automation Progression

Automation is earned, not given. As you prove mastery of a system, you unlock ways to make it self-managing.

| Milestone | Automation Unlocked |
|-----------|---------------------|
| Reclaim 10 sectors | Auto-patrol: Processes defend cleared sectors without orders |
| Defeat 50 worms | Auto-contain: Basic corruption spread auto-managed in secured zones |
| Design a process that survives 5 runs | Self-repair: That process type maintains itself |
| Reach recompilation 5 | Batch deployment: Queue multiple expeditions |
| Master all basic archetypes | Process breeding: Auto-generate optimized variants |

Late-game fantasy: Older sectors run themselves while you push into deeper, weirder corruption zones.

---

## Progression Arc (Rough Sketch)

**Early game (Runs 1-5):**
- Learn basic resource loop
- Simple processes, simple sectors
- Corruption feels manageable
- First recompilation is forced (tutorial)

**Mid game (Runs 5-20):**
- Unlock most archetypes
- Behavior rules get complex
- Corruption pressure ramps up
- Automation starts kicking in for early zones
- Introduce anomaly sectors (weird rule modifiers)

**Late game (Runs 20+):**
- Deep corruption zones with unique threats
- Meta-optimization: Breed perfect processes
- Most early systems automated
- Hunt for rare modules and anomalies
- Optional challenge: Hold off recompilation as long as possible for multipliers

---

## Open Questions / To Decide

- [ ] Grid size and generation rules for sectors
- [ ] Exact behavior rule syntax/UI (visual node-based? text? cards?)
- [ ] How many archetypes? What roles?
- [ ] Combat tick speed and balance
- [ ] What are anomalies? (Sector modifiers, rare encounters, ???)
- [ ] Narrative framing for corruption (is it external? internal? philosophical?)
- [ ] Idle/offline progression — what ticks while you're away?

---

## Next Steps

1. Lock in core loop feel (what does a single expedition look like moment-to-moment?)
2. Define 4-6 starting archetypes
3. Sketch behavior rule UI/UX
4. Prototype resource balance

---

*Document version: 0.1 — Initial concept*
