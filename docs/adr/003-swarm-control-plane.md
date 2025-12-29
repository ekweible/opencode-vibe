# ADR-003: OpenCode Vibe - Unified Control Plane Architecture

**Status:** Accepted  
**Date:** 2025-12-29  
**Deciders:** Joel Hooks, Architecture Team  
**Affected Components:** Control plane, Agent orchestration, Multi-user infrastructure

---

## Context

OpenCode currently operates as a **single-user, single-machine development assistant**. We need to transform this into a **multi-user cloud control plane** for AI agent swarms.

### The Key Insight

**We already built the hard parts.** They just need to be unified:

| Component           | Location                                      | What It Does                                      |
| ------------------- | --------------------------------------------- | ------------------------------------------------- |
| **Effect Router**   | `opencode-next/apps/web/src/core/router/`     | DAG workflows, typed routes, streaming, retry     |
| **Swarm Mail**      | `swarm-tools/packages/swarm-mail/`            | Actor model, event sourcing, file reservations    |
| **Hive**            | `swarm-tools/packages/swarm-mail/src/hive/`   | Git-backed work tracking, epics, dependencies     |
| **Semantic Memory** | `swarm-tools/packages/swarm-mail/src/memory/` | Vector search, smart upsert, temporal queries     |
| **Learning System** | `swarm-tools/packages/opencode-swarm-plugin/` | Confidence decay, pattern maturity, anti-patterns |

**Pulumi is the deployment layer, not the architecture.**

---

## Decision

**Position Effect Router + swarm-tools as the core orchestration architecture. Pulumi handles deployment to different runtimes (local, ECS, EKS).**

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: DEPLOYMENT                                            │
│  Local (dev) → ECS Fargate → EKS (scale)                       │
│  Same code, different runtime. Pulumi handles the plumbing.    │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: ORCHESTRATION                                         │
│  Effect Router (DAG workflows, typed routes, streaming)        │
│  Swarm Mail (actor model, event sourcing, file locks)          │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: COORDINATION                                          │
│  Hive (git-backed work tracking)                               │
│  Semantic Memory (vector search, learnings)                    │
│  Learning System (confidence decay, anti-patterns)             │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: PRIMITIVES                                            │
│  DurableMailbox, DurableLock, DurableCursor, EventStore        │
│  All built on Effect-TS + libSQL (embedded SQLite)             │
└─────────────────────────────────────────────────────────────────┘
```

**Full architecture details:** See [docs/architecture/control-plane.md](../architecture/control-plane.md)

---

## Why This Architecture

### 1. Effect Router = Portable Orchestration

Same route definitions work locally (Server Actions) and in cloud (Lambda/ECS):

```typescript
const getSession = o({ timeout: "30s", retry: "exponential" })
  .input(Schema.Struct({ id: Schema.String }))
  .handler(async ({ input, sdk }) => {
    return sdk.session.get(input.id);
  });

// Works via:
const caller = createCaller(router, { sdk }); // Direct (RSC)
const handler = createNextHandler(router); // API route
const action = createAction(getSession); // Server Action
```

**No rewrite when deploying.** Adapters handle runtime differences.

### 2. Swarm Mail = Actor Coordination

Agents communicate via DurableMailbox, not shared state:

```typescript
// Reserve files before editing
await agentmail_reserve({
  paths: ["src/auth/**"],
  reason: "bd-123.1: Auth service",
});

// Send progress updates
await agentmail_send({
  to: ["coordinator"],
  subject: "Progress: bd-123.1",
  body: "Schema defined, starting service layer",
});

// Complete via verification gate
await swarm_complete({
  bead_id: "bd-123.1",
  summary: "Auth service implemented",
  files_touched: ["src/auth/service.ts"],
});
```

**Agents can crash and resume.** Messages persist to libSQL.

### 3. Learning System = Agents Get Smarter

Feedback loops that improve decomposition over time:

- **Confidence Decay:** 90-day half-life prevents stale patterns
- **Pattern Maturity:** candidate → established → proven → deprecated
- **Anti-Pattern Inversion:** Patterns with >60% failure rate auto-invert

```typescript
// After 5 failures out of 7 attempts:
// "Split by file type" → "AVOID: Split by file type (71% failure rate)"
```

### 4. Pulumi = Deployment Layer

Same architecture, different runtime:

| Phase     | Runtime       | Storage     | Event Bus     |
| --------- | ------------- | ----------- | ------------- |
| **Local** | Next.js + Bun | libSQL file | In-process    |
| **Cloud** | ECS Fargate   | Turso       | Redis Streams |
| **Scale** | EKS           | Turso       | Redis Streams |

**Migration is config change, not code rewrite.**

---

## Phased Rollout

### Phase 0-2: Local Development (Current)

- Effect Router with Server Actions
- Swarm Mail with local libSQL
- Hive with git-backed JSONL
- Semantic Memory with Ollama

**No external dependencies. Everything runs in-process.**

### Phase 3: Multi-User

- Add `tenant_id` to all tables
- Per-user session isolation
- Shared project state

### Phase 4: Cloud Deployment (ECS Fargate)

```
┌─────────────────────────────────────────────────────────────────┐
│                    BASE STACK (Pulumi)                          │
│  VPC + RDS PostgreSQL + ElastiCache Redis + ALB + S3           │
├─────────────────────────────────────────────────────────────────┤
│                    TENANT STACKS (per team)                     │
│  Coordinator (1) + Workers (3-10) + Reviewer (1)               │
│  Auto-scaling based on CPU utilization                         │
└─────────────────────────────────────────────────────────────────┘
```

**Cost:** ~$100/month (dev), ~$1,100/month (10 tenants prod)

### Phase 5: Kubernetes (EKS)

Migrate when:

- > 50 tenants
- Need spot instances (30% cost savings)
- Need service mesh (canary, circuit breakers)
- Need persistent volumes (agent state)

---

## What Changes in Cloud

| Component      | Local           | Cloud                   |
| -------------- | --------------- | ----------------------- |
| **EventStore** | libSQL file     | Turso (libSQL cloud)    |
| **File Locks** | libSQL CAS      | Redis distributed locks |
| **Event Bus**  | In-process      | Redis Streams           |
| **Hive**       | Git + JSONL     | Git + JSONL (unchanged) |
| **Memory**     | Ollama + libSQL | Ollama + Turso          |

**What stays the same:**

- Effect Router API
- Swarm Mail API
- Hive API
- Learning System algorithms

---

## Key Architectural Constraints

From research and implementation experience:

1. **Event sourcing is source of truth** - Projections are caches
2. **Actor model for coordination** - No shared state between agents
3. **Git-backed work tracking** - Distributed without a server
4. **Learning with decay** - Patterns must prove themselves repeatedly
5. **Verification gates** - UBS scan + typecheck before accepting work

---

## Consequences

### Positive

- **Scales to teams** - Multi-user support enables collaboration
- **Agents get smarter** - Learning system improves over time
- **Fault tolerant** - Event sourcing + actor model survive crashes
- **Portable** - Same code runs locally and in cloud
- **Cost efficient** - Autoscaling reduces idle compute

### Negative

- **Complexity** - Four layers to understand
- **Learning curve** - Effect-TS, event sourcing, actor model
- **Migration risk** - Local → cloud storage migration

### Risks & Mitigations

| Risk                        | Mitigation                                 |
| --------------------------- | ------------------------------------------ |
| Event bus bottleneck        | Benchmark Redis Streams early              |
| Coordination overhead       | Hybrid orchestration (event + direct-call) |
| Storage migration data loss | Export to JSON before migration            |
| K8s complexity              | Start with ECS, migrate when needed        |

---

## Success Metrics

| Metric                        | Target            |
| ----------------------------- | ----------------- |
| Task decomposition latency    | <2s               |
| Worker spawn latency (cloud)  | <5s               |
| Coordination overhead         | <10% of work time |
| Conflict rate                 | <5%               |
| Token cost reduction (memory) | 90%               |

---

## References

### Architecture Documentation

- **[Control Plane Architecture](../architecture/control-plane.md)** - Full technical details
- **[ADR-001: Next.js Rebuild](001-nextjs-rebuild.md)** - Web UI foundation
- **[ADR-002: Effect Migration](002-effect-migration.md)** - Effect-TS patterns

### Code Locations

- **Effect Router:** `apps/web/src/core/router/`
- **Swarm Mail:** `github.com/joelhooks/swarm-tools/packages/swarm-mail/`
- **Learning System:** `github.com/joelhooks/swarm-tools/packages/opencode-swarm-plugin/`

### External

- **Effect-TS:** https://effect.website
- **libSQL/Turso:** https://turso.tech
- **Pulumi:** https://pulumi.com

---

## Changelog

| Date       | Author     | Change                                                                                                           |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| 2025-12-29 | BoldHawk   | Initial proposal                                                                                                 |
| 2025-12-29 | GreenCloud | Added Pulumi implementation                                                                                      |
| 2025-12-29 | CalmForest | Full ECS/EKS implementation code                                                                                 |
| 2025-12-29 | Claude     | **Reframe:** Effect Router + swarm-tools as core, Pulumi as deployment layer. Created separate architecture doc. |
