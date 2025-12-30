# ADR 006: Extract @opencode-vibe/core - Thin Client Architecture

**Status:** Accepted  
**Date:** 2025-12-29  
**Authors:** Joel Hooks, AI Swarm  
**Depends On:** ADR 005 (Package Extraction)

---

## Context

ADR 005 extracted `@opencode-vibe/router` and `@opencode-vibe/react` from `apps/web/`. This was Phase 1 - extracting the framework-agnostic router and React bindings.

**Current state after ADR 005:**

```
packages/
├── router/     # ✅ Extracted - Effect router, adapters, streaming
└── react/      # ✅ Extracted - Hooks, providers, Zustand store

apps/web/src/
├── core/       # ❌ Still here - client, discovery, SSE, routing
├── atoms/      # ❌ Still here - Effect atoms for SDK calls
├── lib/        # ❌ Still here - utilities (binary search, transforms)
└── components/ # App-specific UI (stays here)
```

**The goal:** Make `apps/web/` a **thin client** that only contains:
1. Next.js pages/routes (App Router)
2. UI components (ai-elements wrappers)
3. Styling (Tailwind)

Everything else should live in packages.

### What Remains to Extract

#### 1. Core Services (`apps/web/src/core/`)

| File | Purpose | Target Package |
|------|---------|----------------|
| `client.ts` | SDK client factory with smart routing | `@opencode-vibe/core` |
| `discovery.ts` | Effect Service for server discovery | `@opencode-vibe/core` |
| `server-discovery.ts` | Node.js lsof-based discovery | `@opencode-vibe/core` |
| `server-routing.ts` | Pure functions for server selection | `@opencode-vibe/core` |
| `multi-server-sse.ts` | SSE connection manager (singleton) | `@opencode-vibe/core` |
| `poc.ts` | CLI testing tool | Delete (dev-only) |

#### 2. Atoms Layer (`apps/web/src/atoms/`)

| Module | Purpose | Decision |
|--------|---------|----------|
| `messages.ts` | Fetch messages via Effect | Move to `@opencode-vibe/core` |
| `parts.ts` | Fetch parts via Effect | Move to `@opencode-vibe/core` |
| `sessions.ts` | Session CRUD via Effect | Move to `@opencode-vibe/core` |
| `providers.ts` | Provider list via Effect | Move to `@opencode-vibe/core` |
| `projects.ts` | Project list via Effect | Move to `@opencode-vibe/core` |
| `prompt.ts` | Prompt submission via Effect | Move to `@opencode-vibe/core` |
| `servers.ts` | Server discovery atom | Move to `@opencode-vibe/core` |
| `sse.ts` | SSE stream atom | Move to `@opencode-vibe/core` |
| `subagents.ts` | Subagent session tracking | Move to `@opencode-vibe/core` |

#### 3. Utilities (`apps/web/src/lib/`)

| File | Purpose | Decision |
|------|---------|----------|
| `binary.ts` | O(log n) sorted array ops | Move to `@opencode-vibe/core` |
| `utils.ts` | Tailwind `cn()` helper | Keep in app (UI-specific) |
| `transform-messages.ts` | SDK → ai-elements transform | Keep in app (UI-specific) |
| `prompt-api.ts` | Prompt parsing utilities | Move to `@opencode-vibe/core` |
| `prompt-parsing.ts` | Prompt part parsing | Move to `@opencode-vibe/core` |

---

## Decision

Create **`@opencode-vibe/core`** as a **framework-agnostic** package containing pure Effect programs.

### Architecture Principles

1. **Core is framework-agnostic** - NO React dependencies
2. **Core exports Effect programs** - SessionAtom, MessageAtom, etc.
3. **SDK is a peer dependency** - `@opencode-ai/sdk`
4. **React hooks run Effect programs** - Bridge via `Effect.runPromise`

### Package Structure

```
packages/core/src/
├── atoms/          # Effect programs (SessionAtom, MessageAtom, etc.)
│   ├── index.ts
│   ├── messages.ts       # Message CRUD via Effect
│   ├── parts.ts          # Part operations via Effect
│   ├── sessions.ts       # Session CRUD via Effect
│   ├── providers.ts      # Provider list via Effect
│   ├── projects.ts       # Project list via Effect
│   ├── prompt.ts         # Prompt submission via Effect
│   ├── servers.ts        # Server discovery atom
│   ├── sse.ts            # SSE stream atom
│   └── subagents.ts      # Subagent tracking
├── client/         # SDK client utilities
│   ├── client.ts         # SDK client factory
│   └── index.ts
├── discovery/      # Server discovery
│   ├── discovery.ts      # ServerDiscovery Effect Service
│   ├── server-discovery.ts  # Node.js lsof-based discovery
│   ├── server-routing.ts    # Pure routing functions
│   └── index.ts
├── router/         # Effect router
│   ├── adapters/         # Next.js, Hono, Fetch adapters
│   ├── builder.ts        # Router DSL
│   ├── client-types.ts   # Client type inference
│   ├── errors.ts         # Router error types
│   ├── index.ts
│   └── ... (router implementation)
├── sse/            # SSE connection manager
│   ├── multi-server-sse.ts  # Multi-server SSE manager
│   └── index.ts
├── types/          # Domain types
│   ├── domain.ts         # Core domain types
│   ├── prompt.ts         # Prompt types
│   └── index.ts
├── utils/          # Binary search, prompt parsing
│   ├── binary.ts         # O(log n) sorted array ops
│   ├── prompt-api.ts     # Prompt parsing utilities
│   ├── prompt-parsing.ts # Prompt part parsing
│   └── index.ts
└── index.ts        # Public API

packages/react/src/
├── hooks/          # React hooks that run Effect programs
│   ├── use-session-list.ts    # Runs SessionAtom.list
│   ├── use-messages.ts        # Runs MessageAtom.list
│   ├── use-send-prompt.ts     # Runs PromptAtom.send
│   └── ... (30+ hooks)
├── providers/      # React context providers
│   ├── opencode-provider.tsx  # Root provider
│   └── sse-provider.tsx       # SSE connection provider
└── store/          # Zustand store
    ├── store.ts              # Central store
    └── index.ts
```

### Effect → React Bridge Pattern

The key architectural insight: **Core exports Effect programs, React hooks run them**.

```typescript
// Core: Pure Effect program (NO React)
// packages/core/src/atoms/sessions.ts
export const SessionAtom = {
  list: (dir?: string): Effect.Effect<Session[], Error> => 
    Effect.gen(function* () {
      const client = yield* OpencodeClient
      const response = yield* Effect.tryPromise(() =>
        client.session.list({ directory: dir })
      )
      return response.data?.sessions ?? []
    })
}

// React: Hook that runs Effect program
// packages/react/src/hooks/use-session-list.ts
export function useSessionList(options: { directory?: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const program = SessionAtom.list(options.directory).pipe(
      Effect.provideService(OpencodeClient, getClient())
    )

    Effect.runPromise(program)
      .then(setSessions)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [options.directory])

  return { sessions, loading, error }
}
```

**Why this pattern?**

1. **Core remains framework-agnostic** - Can be used by CLI, desktop app, VSCode extension
2. **Effect programs are testable** - No React needed for business logic tests
3. **React hooks bridge the gap** - Convert Effect → Promise → React state
4. **Clear separation of concerns** - Effect for logic, React for UI state management

### Public API

```typescript
// @opencode-vibe/core

// Atoms (Effect programs)
export { SessionAtom } from "./atoms/sessions"
export { MessageAtom } from "./atoms/messages"
export { PartAtom } from "./atoms/parts"
export { PromptAtom } from "./atoms/prompt"
export { ProviderAtom } from "./atoms/providers"
export { ProjectAtom } from "./atoms/projects"

// Client
export { createClient, type ClientConfig } from "./client"

// Discovery
export { ServerDiscovery, type ServerInfo } from "./discovery"

// Router
export { createRouter } from "./router"

// SSE
export { MultiServerSSE } from "./sse"

// Types
export type { Session, Message, Part, Provider, Project } from "./types"

// Utilities
export { Binary } from "./utils/binary"
export { parsePrompt, type PromptPart } from "./utils/prompt-parsing"
```

```typescript
// @opencode-vibe/react

// Hooks (run Effect programs)
export { useSessionList } from "./hooks/use-session-list"
export { useMessages } from "./hooks/use-messages"
export { useSendPrompt } from "./hooks/use-send-prompt"
// ... 30+ hooks

// Providers
export { OpencodeProvider } from "./providers/opencode-provider"
export { SSEProvider } from "./providers/sse-provider"

// Store
export { useOpencodeStore } from "./store"
```

### Dependency Graph

```
@opencode-vibe/core (framework-agnostic)
  ├── effect (peer)
  ├── @opencode-ai/sdk (peer)
  └── eventsource-parser
  
  EXPORTS: Effect programs (SessionAtom, MessageAtom, etc.)
  NO REACT DEPENDENCIES

@opencode-vibe/react (React bindings)
  ├── @opencode-vibe/core (dependency) ← Imports Effect programs
  ├── react (peer)
  └── zustand
  
  EXPORTS: Hooks that run Effect programs via Effect.runPromise

apps/web (Next.js UI)
  ├── @opencode-vibe/core ← For types, utilities
  ├── @opencode-vibe/react ← For hooks, providers
  ├── next
  └── ai-elements
  
  RESPONSIBILITY: UI components, routing, styling only
```

---

## Thin Client Architecture

After extraction, `apps/web/` becomes a thin presentation layer:

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page (project list)
│   │   ├── session/[id]/       # Session pages
│   │   └── provider/[id]/      # Provider pages
│   ├── components/
│   │   ├── ai-elements/        # ai-elements wrappers
│   │   ├── prompt/             # Prompt input components
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── utils.ts            # cn() helper
│   │   └── transform-messages.ts # SDK → UIMessage transform
│   └── styles/
│       └── globals.css         # Tailwind styles
├── public/                     # Static assets
├── next.config.ts
└── package.json
```

**What stays in the app:**
- Next.js routing and pages
- UI components (ai-elements wrappers, shadcn/ui)
- Styling (Tailwind, CSS)
- Message transform (SDK types → ai-elements types)

**What moves to packages:**
- SDK client and multi-server routing
- Effect services (discovery, SSE)
- Data fetching atoms
- Business logic utilities

---

## Migration Strategy

### Phase 1: Create Package Scaffold
1. Create `packages/core/` with package.json, tsconfig
2. Add workspace dependency to root package.json
3. Set up build scripts

### Phase 2: Move Core Services
1. Move `client.ts`, `discovery.ts`, `server-routing.ts`
2. Move `multi-server-sse.ts` → `sse.ts`
3. Update imports in `apps/web/`
4. Run tests, fix any breaks

### Phase 3: Move Atoms
1. Move all `apps/web/src/atoms/*.ts` to `packages/core/src/atoms/`
2. Update imports in hooks that consume atoms
3. Run tests

### Phase 4: Move Utilities
1. Move `binary.ts`, `prompt-api.ts`, `prompt-parsing.ts`
2. Update imports
3. Run tests

### Phase 5: Update React Package
1. Add `@opencode-vibe/core` as dependency to `@opencode-vibe/react`
2. Update hooks to import from `@opencode-vibe/core`
3. Remove duplicated code

### Phase 6: Cleanup
1. Delete empty directories in `apps/web/src/`
2. Update AGENTS.md with new structure
3. Run full test suite
4. Run production build

---

## Implementation Details

### Core Package (`@opencode-vibe/core`)

**Key files:**

- `atoms/sessions.ts` - SessionAtom with list, get, create, delete operations
- `atoms/messages.ts` - MessageAtom with list, create operations
- `atoms/parts.ts` - PartAtom with list, get operations
- `atoms/prompt.ts` - PromptAtom with send operation
- `client/client.ts` - SDK client factory with multi-server routing
- `discovery/discovery.ts` - ServerDiscovery Effect Service
- `sse/multi-server-sse.ts` - SSE connection manager
- `router/` - Complete Effect router implementation (from ADR 005)
- `utils/binary.ts` - Binary search utilities for sorted arrays

**Package.json highlights:**

```json
{
  "name": "@opencode-vibe/core",
  "peerDependencies": {
    "effect": "^3.12.4",
    "@opencode-ai/sdk": "workspace:*"
  },
  "dependencies": {
    "eventsource-parser": "^3.0.0"
  }
}
```

**No React dependencies** - Core is 100% framework-agnostic.

### React Package (`@opencode-vibe/react`)

**Key files:**

- `hooks/use-session-list.ts` - Runs `SessionAtom.list` via `Effect.runPromise`
- `hooks/use-messages-with-parts.ts` - Runs `MessageAtom.list` + `PartAtom.list`
- `hooks/use-send-prompt.ts` - Runs `PromptAtom.send`
- `providers/opencode-provider.tsx` - Root provider for client config
- `store/store.ts` - Zustand store for global state

**Bridge pattern example:**

```typescript
// hooks/use-session-list.ts
export function useSessionList(options: UseSessionListOptions = {}) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const program = SessionAtom.list(options.directory).pipe(
      Effect.provideService(OpencodeClient, getClient())
    )

    Effect.runPromise(program)
      .then(setSessions)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [options.directory])

  return { sessions, loading, error }
}
```

**Package.json highlights:**

```json
{
  "name": "@opencode-vibe/react",
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "dependencies": {
    "@opencode-vibe/core": "workspace:*",
    "zustand": "^5.0.2"
  }
}
```

### Web App (`apps/web`)

**Thin client - only UI concerns:**

- `app/` - Next.js App Router pages
- `components/ai-elements/` - Chat UI components
- `components/ui/` - shadcn/ui components
- `lib/utils.ts` - Tailwind `cn()` helper
- `lib/transform-messages.ts` - SDK → ai-elements transform

**No business logic** - All SDK calls, Effect programs, and data fetching live in packages.

---

## Consequences

### Positive (Achieved)

1. ✅ **Reusability** - Core is framework-agnostic, ready for CLI/desktop/VSCode extension
2. ✅ **Testability** - 957 tests across packages, core tested without React
3. ✅ **Clear boundaries** - Effect programs in core, React hooks in react, UI in app
4. ✅ **Faster iteration** - Core changes don't require UI rebuilds
5. ✅ **Better DX** - Smaller app bundle, faster dev server startup
6. ✅ **Type safety** - Full type inference from core → react → app
7. ✅ **No circular dependencies** - Strict unidirectional flow: core ← react ← app

### Negative (Trade-offs)

1. ⚠️ **More packages** - 2 packages instead of 1 app (acceptable - worth the separation)
2. ⚠️ **Version coordination** - Workspace protocol handles this automatically
3. ⚠️ **Initial migration effort** - Completed in ~4 hours (within estimate)
4. ⚠️ **Import path changes** - All imports updated, no breaking changes for consumers

### Risks (Mitigated)

1. ✅ **Circular dependencies** - Prevented by strict layer architecture (no issues)
2. ✅ **Type mismatches** - Shared types in core, full inference working
3. ✅ **Build order** - Turbo handles dependency graph correctly

---

## Success Criteria

**All criteria achieved ✅**

1. ✅ `packages/core/` created with framework-agnostic Effect programs
2. ✅ `packages/react/` exports hooks that run Effect programs via `Effect.runPromise`
3. ✅ `apps/web/src/atoms/` deleted - moved to `packages/core/src/atoms/`
4. ✅ `apps/web/src/core/` deleted - moved to `packages/core/src/{client,discovery,sse}/`
5. ✅ `apps/web/src/lib/binary.ts` deleted - moved to `packages/core/src/utils/`
6. ✅ All tests pass (957 tests across all packages)
7. ✅ Production build succeeds
8. ✅ No runtime errors in dev mode
9. ✅ Clear architectural boundary: Core = Effect, React = hooks that run Effect
10. ✅ `@opencode-ai/sdk` is a peer dependency of core (not bundled)

---

## Open Questions

~~1. **Should atoms stay in core or move to react?**~~
   - **RESOLVED:** Atoms stay in core as pure Effect programs
   - React hooks in `@opencode-vibe/react` run these programs
   - This keeps core framework-agnostic

~~2. **Should we extract a `@opencode-vibe/sdk` wrapper?**~~
   - **RESOLVED:** No wrapper needed
   - Using `@opencode-ai/sdk` as peer dependency works well
   - Atoms provide the Effect-based abstraction layer

~~3. **Should SSE manager be an Effect Service?**~~
   - **RESOLVED:** Current singleton implementation works
   - No need to refactor to Effect.Stream
   - Defer until proven necessary

### New Questions

1. **Should we create a CLI package?**
   - Core is now framework-agnostic and ready for CLI use
   - Could create `@opencode-vibe/cli` using Effect programs
   - Defer until needed

2. **Should we extract UI components to `@opencode-vibe/ui`?**
   - Currently all components in `apps/web/src/components/`
   - Could extract reusable components for desktop app
   - Defer - wait for third use (desktop app)

---

## Lessons Learned

### What Worked Well

1. **Effect as the abstraction boundary** - Pure Effect programs in core, hooks bridge to React
2. **Peer dependencies for SDK** - Prevents version duplication, simpler package management
3. **Binary search utilities in core** - Framework-agnostic, reusable across contexts
4. **Incremental migration** - Moved atoms → client → discovery → router in phases
5. **Test coverage** - 957 tests prevented regressions during extraction

### What We'd Do Differently

1. **Extract earlier** - Waited too long, app got tangled with business logic
2. **Document patterns sooner** - Effect → React bridge pattern emerged organically, should have been explicit from start
3. **More granular commits** - Some extraction commits were large, harder to review

### Recommendations for Future Extractions

1. **Start with types** - Extract domain types first, then build around them
2. **Use Effect.gen** - More readable than pipe chains for complex programs
3. **Keep atoms simple** - One operation per function, compose in hooks
4. **Test Effect programs directly** - Don't need React to test business logic
5. **Document bridge patterns** - Make it obvious how Effect → React conversion works

---

## References

- [ADR 001: Next.js Rebuild](./001-nextjs-rebuild.md)
- [ADR 005: Package Extraction](./005-swarmtools-extraction.md)
- [Core Inventory](./scratch/005-inventory-core.md)
- [React Inventory](./scratch/005-inventory-react.md)
