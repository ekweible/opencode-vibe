# OpenCode Vibe: Unified Control Plane Architecture

> **Vision:** A multi-user cloud control plane for AI agent swarms. A fucking VIBE CODING platform for the future.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ██╗   ██╗██╗██████╗ ███████╗     ██████╗ ██████╗ ██████╗ ██╗███╗   ██╗   │
│   ██║   ██║██║██╔══██╗██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██║████╗  ██║   │
│   ██║   ██║██║██████╔╝█████╗      ██║     ██║   ██║██║  ██║██║██╔██╗ ██║   │
│   ╚██╗ ██╔╝██║██╔══██╗██╔══╝      ██║     ██║   ██║██║  ██║██║██║╚██╗██║   │
│    ╚████╔╝ ██║██████╔╝███████╗    ╚██████╗╚██████╔╝██████╔╝██║██║ ╚████║   │
│     ╚═══╝  ╚═╝╚═════╝ ╚══════╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝   │
│                                                                             │
│                    CONTROL PLANE ARCHITECTURE                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Core Insight

We already built the hard parts. They just need to be unified:

| Component           | Location                                      | What It Does                                      |
| ------------------- | --------------------------------------------- | ------------------------------------------------- |
| **Effect Router**   | `opencode-next/apps/web/src/core/router/`     | DAG workflows, typed routes, streaming, retry     |
| **Swarm Mail**      | `swarm-tools/packages/swarm-mail/`            | Actor model, event sourcing, file reservations    |
| **Hive**            | `swarm-tools/packages/swarm-mail/src/hive/`   | Git-backed work tracking, epics, dependencies     |
| **Semantic Memory** | `swarm-tools/packages/swarm-mail/src/memory/` | Vector search, smart upsert, temporal queries     |
| **Learning System** | `swarm-tools/packages/opencode-swarm-plugin/` | Confidence decay, pattern maturity, anti-patterns |

**The architecture is already here. Pulumi is just the deployment layer.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED CONTROL PLANE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      LAYER 4: DEPLOYMENT                             │   │
│  │                                                                      │   │
│  │   Local (dev)          ECS Fargate         EKS (scale)              │   │
│  │   ┌─────────┐          ┌─────────┐         ┌─────────┐              │   │
│  │   │ Next.js │          │ Pulumi  │         │ Pulumi  │              │   │
│  │   │ + Bun   │    →     │ + AWS   │    →    │ + K8s   │              │   │
│  │   └─────────┘          └─────────┘         └─────────┘              │   │
│  │                                                                      │   │
│  │   Same code, different runtime. Pulumi handles the plumbing.        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 3: ORCHESTRATION                            │   │
│  │                                                                      │   │
│  │   ┌─────────────────┐    ┌─────────────────┐                        │   │
│  │   │  EFFECT ROUTER  │    │  SWARM MAIL     │                        │   │
│  │   ├─────────────────┤    ├─────────────────┤                        │   │
│  │   │ • DAG workflows │    │ • Actor model   │                        │   │
│  │   │ • Typed routes  │    │ • Event sourcing│                        │   │
│  │   │ • SSE streaming │    │ • File locks    │                        │   │
│  │   │ • Timeout/retry │    │ • Message queue │                        │   │
│  │   │ • RSC + Actions │    │ • Reservations  │                        │   │
│  │   └────────┬────────┘    └────────┬────────┘                        │   │
│  │            │                      │                                  │   │
│  │            └──────────┬───────────┘                                  │   │
│  │                       │                                              │   │
│  │   Effect Router = portable orchestration (works local + cloud)      │   │
│  │   Swarm Mail = actor coordination (survives context death)          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     LAYER 2: COORDINATION                            │   │
│  │                                                                      │   │
│  │   ┌─────────────────┐    ┌─────────────────┐    ┌───────────────┐   │   │
│  │   │      HIVE       │    │ SEMANTIC MEMORY │    │   LEARNING    │   │   │
│  │   ├─────────────────┤    ├─────────────────┤    ├───────────────┤   │   │
│  │   │ • Git-backed    │    │ • Vector search │    │ • Confidence  │   │   │
│  │   │ • Epics/tasks   │    │ • Smart upsert  │    │   decay       │   │   │
│  │   │ • Dependencies  │    │ • Temporal      │    │ • Pattern     │   │   │
│  │   │ • Status flow   │    │   queries       │    │   maturity    │   │   │
│  │   │ • Sync to git   │    │ • Memory links  │    │ • Anti-pattern│   │   │
│  │   └─────────────────┘    └─────────────────┘    │   inversion   │   │   │
│  │                                                  └───────────────┘   │   │
│  │                                                                      │   │
│  │   Hive = work tracking (distributed without a server)               │   │
│  │   Memory = persistent learning (agents get smarter over time)       │   │
│  │   Learning = feedback loops (failed patterns auto-invert)           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     LAYER 1: PRIMITIVES                              │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │   │DurableMailbox│  │ DurableLock  │  │DurableCursor │              │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤              │   │
│  │   │Actor inbox   │  │CAS-based     │  │Checkpointed  │              │   │
│  │   │with envelope │  │mutex for     │  │stream reader │              │   │
│  │   │pattern       │  │file locks    │  │(exactly-once)│              │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │   │DurableDeferred│ │ EventStore   │  │  Projections │              │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤              │   │
│  │   │URL-addressable│ │Append-only   │  │Materialized  │              │   │
│  │   │distributed   │  │event log     │  │views from    │              │   │
│  │   │promises      │  │(libSQL)      │  │events        │              │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                      │   │
│  │   All primitives built on Effect-TS + libSQL (embedded SQLite)      │   │
│  │   Local-first, event-sourced, survives process death                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Primitives (swarm-tools)

The foundation. Everything else builds on these.

### DurableMailbox

**Location:** `swarm-mail/src/streams/effect/mailbox.ts`

Actor inbox with envelope pattern. Messages persist to libSQL, survive process death.

```typescript
// Actor receives messages via mailbox
const mailbox = await DurableMailbox.create("worker-1");

// Send message (persisted immediately)
await mailbox.send({
  from: "coordinator",
  to: "worker-1",
  subject: "Start task",
  body: { taskId: "bd-123.1", files: ["src/auth.ts"] },
});

// Receive (exactly-once delivery)
const message = await mailbox.receive();
await mailbox.ack(message.id); // Mark processed
```

**Why it matters:** Agents can crash and resume without losing messages. No RabbitMQ/Kafka required for local dev.

### DurableLock

**Location:** `swarm-mail/src/streams/effect/lock.ts`

CAS-based mutex for file reservations. Prevents edit conflicts between agents.

```typescript
// Reserve files before editing
const lock = await DurableLock.acquire({
  resource: "src/auth/**",
  holder: "worker-1",
  reason: "bd-123.1: Auth service implementation",
  ttl: 3600, // 1 hour
});

// Work on files...

// Release when done
await lock.release();
```

**Why it matters:** Multiple agents can work the same codebase without stepping on each other.

### DurableCursor

**Location:** `swarm-mail/src/streams/effect/cursor.ts`

Checkpointed stream reader. Exactly-once event consumption.

```typescript
// Read events from position
const cursor = await DurableCursor.create("events", "worker-1");

for await (const event of cursor.stream()) {
  await processEvent(event);
  await cursor.checkpoint(event.seq); // Persist position
}

// Crash and resume → continues from last checkpoint
```

**Why it matters:** Event processing is idempotent. Agents can crash mid-stream and resume correctly.

### EventStore

**Location:** `swarm-mail/src/adapter.ts`

Append-only event log. Source of truth for all state.

```typescript
// Append event
await eventStore.append({
  type: "subtask_completed",
  data: {
    bead_id: "bd-123.1",
    summary: "Auth service implemented",
    files_touched: ["src/auth/service.ts"],
  },
});

// Replay events to rebuild state
const events = await eventStore.read({ from: 0 });
const state = events.reduce(fold, initialState);
```

**Why it matters:** Full audit trail. Can reconstruct any historical state. Debugging is trivial.

---

## Layer 2: Coordination (swarm-tools)

Work tracking, memory, and learning. The "brain" of the swarm.

### Hive (Git-Backed Work Tracker)

**Location:** `swarm-mail/src/hive/`

Work items (cells) stored in `.hive/issues.jsonl`, synced via git.

```typescript
// Create epic with subtasks
await hive.createEpic({
  title: "Add OAuth authentication",
  subtasks: [
    { title: "Create auth service", files: ["src/auth/**"] },
    { title: "Add login UI", files: ["src/components/login.tsx"] },
    { title: "Write tests", files: ["tests/auth.test.ts"] },
  ],
});

// Query ready work
const ready = await hive.query({ ready: true });

// Start work
await hive.start("bd-123.1");

// Complete
await hive.close("bd-123.1", "Done: implemented auth flow");

// Sync to git (MANDATORY at session end)
await hive.sync();
```

**Why it matters:** Distributed work tracking without a server. Git provides conflict resolution, history, and offline support.

### Semantic Memory

**Location:** `swarm-mail/src/memory/`

Vector search + smart upsert. Agents learn from past sessions.

```typescript
// Store a learning
await memory.store({
  information:
    "OAuth refresh tokens need 5min buffer before expiry to avoid race conditions",
  tags: ["auth", "oauth", "tokens", "race-conditions"],
});

// Search by semantic similarity
const results = await memory.find({
  query: "token refresh timing",
  limit: 5,
});

// Smart upsert (LLM decides ADD/UPDATE/DELETE/NOOP)
const result = await memory.upsert(
  "OAuth tokens need 3min buffer (changed from 5min)",
  { useSmartOps: true },
);
// result.operation = "UPDATE"
// result.reason = "Refines timing from 5min to 3min"
```

**Why it matters:** Agents don't solve the same problem twice. Knowledge persists across sessions.

### Learning System

**Location:** `opencode-swarm-plugin/src/learning.ts`, `pattern-maturity.ts`, `anti-patterns.ts`

Feedback loops that make agents smarter over time.

#### Confidence Decay (90-day half-life)

```typescript
// Evaluation criteria weights fade unless revalidated
const decayedWeight = calculateDecayedValue(
  originalWeight,
  daysSinceValidation,
);
// After 90 days: weight = originalWeight * 0.5
// After 180 days: weight = originalWeight * 0.25
```

**Why it matters:** Prevents stale patterns from dominating. Knowledge must prove itself repeatedly.

#### Pattern Maturity Lifecycle

```
candidate → established → proven → deprecated
    ↑                                   │
    └───────────────────────────────────┘
         (anti-pattern inversion)
```

```typescript
// Patterns promoted based on success rate
if (successCount >= 5 && successRate > 0.8) {
  await promotePattern(patternId, "proven");
}

// Proven patterns get 1.5x weight in decomposition
const weight = pattern.maturity === "proven" ? 1.5 : 1.0;
```

#### Anti-Pattern Inversion

```typescript
// Patterns with >60% failure rate auto-invert
if (failureRatio > 0.6) {
  await invertToAntiPattern(pattern);
  // "Split by file type" → "AVOID: Split by file type (71% failure rate)"
}
```

**Why it matters:** The system learns from failures. Bad patterns become warnings for future agents.

---

## Layer 3: Orchestration (opencode-next + swarm-tools)

DAG workflows and actor coordination. The "muscles" of the swarm.

### Effect Router

**Location:** `opencode-next/apps/web/src/core/router/`

Type-safe, declarative async router. Hides Effect complexity behind fluent API.

```typescript
// Define route with timeout, retry, streaming
const getSession = o({ timeout: "30s", retry: "exponential" })
  .input(Schema.Struct({ id: Schema.String }))
  .handler(async ({ input, sdk }) => {
    return sdk.session.get(input.id);
  });

// Streaming route with heartbeat
const streamMessages = o({ stream: true, heartbeat: "60s" })
  .input(Schema.Struct({ sessionId: Schema.String }))
  .handler(async function* ({ input, sdk }) {
    for await (const event of sdk.session.events(input.sessionId)) {
      yield event;
    }
  });

// Create router
const router = createRouter({
  session: { get: getSession },
  messages: { stream: streamMessages },
});

// Execute via adapters
const caller = createCaller(router, { sdk }); // Direct (RSC)
const handler = createNextHandler(router); // API route
const action = createAction(getSession); // Server Action
```

**Key capabilities:**

| Feature           | Implementation                                  | Why                                     |
| ----------------- | ----------------------------------------------- | --------------------------------------- |
| **DAG workflows** | Builder + Executor pattern                      | Sequential + parallel task execution    |
| **Typed routes**  | Effect Schema validation                        | Compile-time safety, runtime validation |
| **SSE streaming** | AsyncGenerator → Effect.Stream → ReadableStream | Real-time updates                       |
| **Timeout/retry** | Effect.timeout + Effect.retry                   | Resilience without boilerplate          |
| **Heartbeat**     | Stream.timeoutFail                              | Detect stale connections                |
| **Middleware**    | Onion-style chain                               | Auth, logging, tracing                  |

**Why it matters:** Same route definitions work locally (Server Actions) and in cloud (Lambda/ECS). No rewrite when deploying.

### Swarm Coordination

**Location:** `opencode-swarm-plugin/src/swarm-*.ts`

Task decomposition, worker spawning, and completion gates.

```typescript
// 1. Decompose task (queries CASS for similar past tasks)
const decomposition = await swarm_decompose({
  task: "Add OAuth authentication",
  max_subtasks: 5,
  query_cass: true,
});

// 2. Validate decomposition
const validated = await swarm_validate_decomposition(decomposition);
// Detects file conflicts, instruction conflicts

// 3. Create epic atomically
const epic = await hive_create_epic({
  epic_title: "Add OAuth",
  subtasks: validated.subtasks,
});

// 4. Spawn workers (parallel)
for (const subtask of epic.subtasks) {
  await Task({
    subagent_type: "swarm-worker",
    prompt: await swarm_subtask_prompt({
      agent_name: generateAgentName(),
      bead_id: subtask.id,
      epic_id: epic.id,
      subtask_title: subtask.title,
      files: subtask.files,
    }),
  });
}

// 5. Workers complete via verification gate
await swarm_complete({
  project_key: "/path/to/repo",
  agent_name: "BlueLake",
  bead_id: "bd-123.1",
  summary: "Auth service implemented",
  files_touched: ["src/auth/service.ts"],
});
// Runs UBS scan, releases reservations, records outcome
```

**Why it matters:** Parallel work with coordination. Agents don't conflict. Learning signals captured.

---

## Layer 4: Deployment (Pulumi)

Same code, different runtime. Pulumi handles the plumbing.

### Local Development (Phase 0-2)

```
┌─────────────────────────────────────────┐
│           LOCAL DEVELOPMENT             │
├─────────────────────────────────────────┤
│                                         │
│  Next.js 16 + Bun                       │
│       │                                 │
│       ├── Effect Router (Server Actions)│
│       ├── Swarm Mail (libSQL file)      │
│       ├── Hive (.hive/issues.jsonl)     │
│       └── Semantic Memory (Ollama)      │
│                                         │
│  Storage: ~/.config/swarm-tools/        │
│  No external dependencies               │
│                                         │
└─────────────────────────────────────────┘
```

### Cloud Deployment (Phase 4: ECS Fargate)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECS FARGATE DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    BASE STACK                            │   │
│  │  VPC + RDS PostgreSQL + ElastiCache Redis + ALB + S3    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│           ┌───────────────┼───────────────┐                    │
│           ▼               ▼               ▼                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  TENANT A   │  │  TENANT B   │  │  TENANT C   │            │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤            │
│  │ Coordinator │  │ Coordinator │  │ Coordinator │            │
│  │ Workers (N) │  │ Workers (N) │  │ Workers (N) │            │
│  │ Reviewer    │  │ Reviewer    │  │ Reviewer    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  Same Effect Router + Swarm Mail code                          │
│  Different storage backend (Turso instead of local libSQL)     │
│  Redis Streams for cross-agent events                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Kubernetes (Phase 5: EKS)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EKS DEPLOYMENT                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Same architecture as ECS, plus:                               │
│                                                                 │
│  • Horizontal Pod Autoscaler (workers scale 3→10)              │
│  • Persistent Volumes (agent state, model cache)               │
│  • Service Mesh (Istio for canary, circuit breakers)           │
│  • GitOps (ArgoCD for declarative deployments)                 │
│  • Prometheus + Grafana + Jaeger (observability)               │
│                                                                 │
│  Migrate when: >50 tenants, need spot instances, need mesh     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: End-to-End

```
User: /swarm "Add OAuth authentication"
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. DECOMPOSITION (swarm_decompose)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Query CASS → "How did past agents solve similar tasks?"       │
│  Query Memory → "What learnings apply here?"                   │
│  Select Strategy → file-based / feature-based / risk-based     │
│  Generate Prompt → "Break this into 3-5 subtasks..."           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. VALIDATION (swarm_validate_decomposition)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Parse CellTree JSON                                           │
│  Detect file conflicts → "Worker A and B both touch auth.ts"   │
│  Detect instruction conflicts → "Contradictory requirements"   │
│  Return validated subtasks with file assignments               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. EPIC CREATION (hive_create_epic)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Create epic cell                                              │
│  Create subtask cells (linked to epic)                         │
│  Append cell_created events to EventStore                      │
│  Update Hive projections                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. WORKER SPAWNING (parallel Task agents)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  For each subtask:                                             │
│    Generate agent name (BlueLake, GreenCloud, etc.)            │
│    Generate subtask prompt with:                               │
│      - Epic context                                            │
│      - File assignments                                        │
│      - Swarm Mail instructions                                 │
│      - Verification gate requirements                          │
│    Spawn Task agent                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼ (parallel workers)
┌─────────────────────────────────────────────────────────────────┐
│ 5. WORKER EXECUTION                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  agentmail_init() → Register with Swarm Mail                   │
│  agentmail_reserve() → Acquire DurableLock on files            │
│                                                                 │
│  ... do work (read, edit, test) ...                            │
│                                                                 │
│  agentmail_send() → Progress updates to coordinator            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. COMPLETION GATE (swarm_complete)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Run UBS scan → Check for bugs before accepting                │
│  Run typecheck → Ensure no type errors                         │
│  Release DurableLock → Free files for other agents             │
│  Append subtask_completed event                                │
│  Record outcome → duration, errors, retries                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. LEARNING (swarm_record_outcome)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Score implicit feedback:                                      │
│    fast + success → helpful signal                             │
│    slow + errors + retries → harmful signal                    │
│                                                                 │
│  Update pattern maturity:                                      │
│    candidate → established → proven                            │
│                                                                 │
│  Check for anti-pattern inversion:                             │
│    if failure_ratio > 60% → invert to anti-pattern             │
│                                                                 │
│  Store learnings in Semantic Memory                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. SYNC (hive_sync)                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Commit .hive/issues.jsonl changes                             │
│  Push to git remote                                            │
│  Plane is landed when git push succeeds                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cloud Migration Path

### What Changes

| Component      | Local           | Cloud                   |
| -------------- | --------------- | ----------------------- |
| **EventStore** | libSQL file     | Turso (libSQL cloud)    |
| **File Locks** | libSQL CAS      | Redis distributed locks |
| **Event Bus**  | In-process      | Redis Streams           |
| **Hive**       | Git + JSONL     | Git + JSONL (unchanged) |
| **Memory**     | Ollama + libSQL | Ollama + Turso          |

### What Stays the Same

- **Effect Router** - Same route definitions, different adapter
- **Swarm Mail API** - Same interface, different storage backend
- **Hive API** - Same interface, git-backed everywhere
- **Learning System** - Same algorithms, same feedback loops

### Migration Steps

#### Phase 1: Turso Migration (1 day)

```typescript
// Before (local)
const client = createClient({ url: "file:swarm.db" });

// After (cloud)
const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

No code changes. Just config.

#### Phase 2: Redis Event Bus (3 days)

```typescript
// Add RedisEventBus implementation
class RedisEventBus implements EventBusAdapter {
  async publish(event: SwarmMailEvent) {
    await this.redis.xadd(
      `events:${event.project_key}`,
      "*",
      "type",
      event.type,
      "data",
      JSON.stringify(event),
    );
  }
}
```

#### Phase 3: Distributed Locks (2 days)

```typescript
// Replace libSQL CAS with Redis SET NX
const acquired = await redis.set(
  `lock:${resource}`,
  holder,
  "NX",
  "EX",
  ttlSeconds,
);
```

#### Phase 4: Multi-Tenancy (2 weeks)

- Add `tenant_id` to all tables
- Implement row-level security in Turso
- Add JWT-based auth to MCP tools

---

## Key Architectural Decisions

### 1. Event Sourcing is the Source of Truth

**Decision:** All state derived from events. Projections are caches.

**Why:**

- Full audit trail
- Can reconstruct any historical state
- Debugging is trivial (replay events)
- Enables temporal queries ("what did we know on Jan 1?")

**Gotcha:** Projections can be stale. Always fold over events for ground truth.

### 2. Actor Model for Agent Coordination

**Decision:** Agents communicate via DurableMailbox, not shared state.

**Why:**

- No race conditions
- Messages persist (survive crashes)
- Natural fit for distributed systems
- Easy to reason about

**Gotcha:** Must handle message ordering. Use thread_id for related messages.

### 3. Git-Backed Work Tracking

**Decision:** Hive stores cells in `.hive/issues.jsonl`, synced via git.

**Why:**

- Distributed without a server
- Git provides conflict resolution
- Full history via git log
- Works offline

**Gotcha:** `hive_sync()` is MANDATORY. The plane isn't landed until `git push` succeeds.

### 4. Learning System with Decay

**Decision:** Confidence decay (90-day half-life) + anti-pattern inversion (>60% failure).

**Why:**

- Prevents stale knowledge from dominating
- Patterns must prove themselves repeatedly
- Failed patterns become warnings
- System gets smarter over time

**Gotcha:** Validate memories you confirm are still accurate to reset decay timer.

### 5. Effect Router as Portable Orchestration

**Decision:** Same route definitions work locally and in cloud.

**Why:**

- No rewrite when deploying
- Type safety end-to-end
- Streaming, timeout, retry built-in
- Adapters handle runtime differences

**Gotcha:** Streaming routes don't work in Step Functions (request-response only).

---

## Integration Points

### Effect Router ↔ Swarm Mail

```typescript
// Route that uses Swarm Mail for coordination
const executeSubtask = o({ timeout: "5m" })
  .input(SubtaskSchema)
  .handler(async ({ input, ctx }) => {
    // Initialize Swarm Mail
    const swarmMail = await getSwarmMailLibSQL(input.projectPath);

    // Reserve files
    await swarmMail.reserve({
      paths: input.files,
      holder: ctx.agentName,
      reason: `${input.beadId}: ${input.title}`,
    });

    try {
      // Do work...
      const result = await doWork(input);

      // Complete via verification gate
      await swarm_complete({
        project_key: input.projectPath,
        agent_name: ctx.agentName,
        bead_id: input.beadId,
        summary: result.summary,
        files_touched: result.files,
      });

      return result;
    } finally {
      // Release on error or success
      await swarmMail.release({ holder: ctx.agentName });
    }
  });
```

### Hive ↔ Semantic Memory

```typescript
// After completing a task, store learnings
hive.on("cell_closed", async (cell) => {
  if (cell.metadata?.learnings) {
    await memory.store({
      information: cell.metadata.learnings,
      tags: ["hive", cell.type, ...cell.labels],
      metadata: { cell_id: cell.id, epic_id: cell.parent_id },
    });
  }
});
```

### Learning System ↔ Decomposition

```typescript
// Decomposition queries learning system for strategy insights
const insights = await swarm_get_strategy_insights({ task });

// Returns:
// {
//   recommended_strategy: "feature-based",
//   confidence: 0.85,
//   reasoning: "Similar tasks succeeded 85% with feature-based",
//   anti_patterns: ["AVOID: Split by file type (71% failure rate)"]
// }
```

---

## Success Metrics

| Metric                         | Target            | How to Measure                           |
| ------------------------------ | ----------------- | ---------------------------------------- |
| **Task decomposition latency** | <2s               | Time from /swarm to first worker spawned |
| **Worker spawn latency**       | <5s (cloud)       | Time from spawn to first file edit       |
| **Coordination overhead**      | <10% of work time | (total time - work time) / total time    |
| **Conflict rate**              | <5%               | File conflicts detected / total subtasks |
| **Learning retention**         | >80%              | Memories still valid after 90 days       |
| **Anti-pattern detection**     | >60% accuracy     | Inverted patterns that were actually bad |
| **Token cost reduction**       | 90%               | Via selective memory retrieval           |

---

## References

### Internal

- **Effect Router:** `apps/web/src/core/router/`
- **Swarm Mail:** `swarm-tools/packages/swarm-mail/`
- **Hive:** `swarm-tools/packages/swarm-mail/src/hive/`
- **Learning System:** `swarm-tools/packages/opencode-swarm-plugin/src/learning.ts`
- **ADR-001:** Next.js Rebuild
- **ADR-002:** Effect Migration
- **ADR-003:** Swarm Control Plane (this doc's companion)

### External

- **Effect-TS:** https://effect.website
- **libSQL/Turso:** https://turso.tech
- **Pulumi:** https://pulumi.com
- **Redis Streams:** https://redis.io/docs/data-types/streams/

---

## Changelog

| Date       | Author | Change                                                                |
| ---------- | ------ | --------------------------------------------------------------------- |
| 2025-12-29 | Claude | Initial architecture doc - unified Effect Router + swarm-tools vision |
