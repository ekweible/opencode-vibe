# @opencode-vibe/router - API Design

**Date**: 2025-01-29  
**Status**: DRAFT  
**Purpose**: Public API surface design for extracting the Effect router from `apps/web/src/core/router/`

---

## Executive Summary

`@opencode-vibe/router` is a **framework-agnostic Effect-based router** with zero React dependencies. It provides:

- **Fluent route builder** - Type-safe, chainable API for defining routes
- **Effect runtime integration** - Timeout, retry, streaming via Effect primitives
- **Multiple adapters** - RSC direct caller, Next.js API routes, Server Actions
- **Schema validation** - Effect Schema for input validation
- **Streaming support** - AsyncGenerator → Effect.Stream → SSE/AsyncIterable

**Why extract?** The router is already decoupled from React, Next.js, and OpenCode-specific code. It's a reusable pattern for any Effect-based API client.

---

## Package Metadata

### package.json

```json
{
  "name": "@opencode-vibe/router",
  "version": "0.1.0",
  "description": "Framework-agnostic Effect-based router with streaming, retry, and middleware",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs"
    },
    "./adapters/direct": {
      "types": "./dist/adapters/direct.d.mts",
      "import": "./dist/adapters/direct.mjs"
    },
    "./adapters/next": {
      "types": "./dist/adapters/next.d.mts",
      "import": "./dist/adapters/next.mjs"
    },
    "./routes": {
      "types": "./dist/routes.d.mts",
      "import": "./dist/routes.mjs"
    }
  },
  "files": ["dist", "src", "README.md"],
  "scripts": {
    "build": "tsc --project tsconfig.build.json",
    "test": "bun test",
    "type-check": "tsc --noEmit"
  },
  "peerDependencies": {
    "effect": "^3.19.0"
  },
  "devDependencies": {
    "effect": "^3.19.13",
    "typescript": "^5.7.3",
    "@types/bun": "latest"
  },
  "keywords": [
    "effect",
    "router",
    "streaming",
    "sse",
    "retry",
    "timeout",
    "middleware"
  ],
  "author": "Joel Hooks",
  "license": "MIT"
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "emitDeclarationOnly": false,
    "declarationMap": false
  },
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

---

## Package Structure

```
@opencode-vibe/router/
├── src/
│   ├── index.ts           # Main entry point (public API)
│   ├── builder.ts         # Fluent route builder
│   ├── router.ts          # Router factory & resolution
│   ├── executor.ts        # Route execution engine
│   ├── stream.ts          # Streaming support (Effect.Stream ↔ ReadableStream/AsyncIterable)
│   ├── types.ts           # Core types (Duration, RetryConfig, Route, HandlerContext)
│   ├── errors.ts          # Tagged errors (Data.TaggedError)
│   ├── schedule.ts        # Duration parsing, retry schedules
│   ├── routes.ts          # Example route definitions (OPTIONAL - users define their own)
│   └── adapters/
│       ├── direct.ts      # RSC/CLI direct caller
│       └── next.ts        # Next.js API handler & Server Actions
├── dist/                  # Unbundled ESM build output
│   ├── index.mjs
│   ├── index.d.mts
│   ├── builder.mjs
│   ├── builder.d.mts
│   └── ... (mirrors src/ structure)
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── README.md
└── LICENSE
```

**Build strategy**: **Unbundled ESM**

- Copy `.ts` → `.mjs` with type declarations (`.d.mts`)
- Tree-shakeable (consumers import only what they need)
- Fast builds (no bundling overhead)
- Source maps for debugging
- Works everywhere (Bun, Node 18+, browsers, Deno)

**Why `.mjs` and `.d.mts`?**

- Explicit ESM signaling (no ambiguity with `type: "module"`)
- Dual package hazard avoidance
- Better IDE support across ecosystems

---

## Public API

### Core Exports (`index.ts`)

```typescript
// Router factory
export { createRouter, type Router } from "./router.js";

// Route builder
export { createOpencodeRoute } from "./builder.js";

// Adapters
export {
  createCaller,
  type Caller,
  type CallerContext,
} from "./adapters/direct.js";
export {
  createNextHandler,
  createAction,
  type NextHandlerOptions,
  type ActionOptions,
} from "./adapters/next.js";

// Example routes (OPTIONAL - users can define their own)
export { createRoutes, type Routes } from "./routes.js";

// Error types
export {
  RouteError,
  ValidationError,
  TimeoutError,
  HandlerError,
  StreamError,
  HeartbeatTimeoutError,
  MiddlewareError,
  RouteNotFoundError,
} from "./errors.js";

// Schedule utilities
export { parseDuration, buildSchedule } from "./schedule.js";

// Core types
export type {
  Duration,
  RetryConfig,
  RouteConfig,
  HandlerContext,
  HandlerFn,
  MiddlewareFn,
  ErrorHandlerFn,
  Route,
  RouteBuilder,
} from "./types.js";
```

**NOT exported** (internal implementation details):

- `executeRoute()` - Used by adapters only
- `executeRequestHandler()` - Internal to executor
- `executeStreamHandler()` - Used by adapters only
- `streamToReadable()` - Used by Next adapter only
- `streamToAsyncIterable()` - Used by direct adapter only
- `OpencodeRouteBuilder` class - Internal builder implementation

---

## Type Definitions

### Core Types (`types.ts`)

```typescript
import type { Schema } from "effect";
import type { Context } from "effect";
import type { OpencodeClient } from "@opencode-ai/sdk/client"; // Peer dependency for typing

/**
 * Duration with unit suffix
 * Examples: "5s", "30s", "5m", "1h", "100ms"
 */
export type Duration = `${number}${"ms" | "s" | "m" | "h"}`;

/**
 * Retry configuration
 * - "none": No retries
 * - "exponential": 100ms base, 2x backoff, 3 retries
 * - "linear": 100ms fixed, 3 retries
 * - Custom: { maxAttempts, delay, backoff? }
 */
export type RetryConfig =
  | "none"
  | "exponential"
  | "linear"
  | {
      maxAttempts: number;
      delay: Duration;
      backoff?: number; // Multiplier for exponential backoff
    };

/**
 * Route-level configuration
 */
export interface RouteConfig {
  timeout?: Duration;
  retry?: RetryConfig;
  concurrency?: number; // Reserved for future use
  stream?: boolean;
  heartbeat?: Duration; // For streaming routes only
  cache?: { ttl: Duration; key?: (input: unknown) => string }; // Reserved for future use
}

/**
 * Handler execution context
 * Injected into every handler and middleware
 */
export interface HandlerContext<TInput = unknown, TCtx = unknown> {
  input: TInput;
  sdk: OpencodeClient; // Or generic - users can type this
  signal: AbortSignal;
  ctx: TCtx; // Middleware context (mutable)
}

/**
 * Handler function signature
 * Returns Promise for request-response or AsyncGenerator for streaming
 */
export type HandlerFn<TInput, TOutput, TCtx = unknown> = (
  context: HandlerContext<TInput, TCtx>,
) => Promise<TOutput> | AsyncGenerator<TOutput, void, unknown>;

/**
 * Middleware function signature
 * Onion-style composition: middleware wraps next() call
 */
export type MiddlewareFn<TInput, TCtx = unknown> = (
  context: HandlerContext<TInput, TCtx>,
  next: () => Promise<unknown>,
) => Promise<unknown>;

/**
 * Error handler function signature
 * Can return fallback value or re-throw
 */
export type ErrorHandlerFn<TInput, TOutput, TCtx = unknown> = (
  error: unknown,
  context: HandlerContext<TInput, TCtx>,
) => Promise<TOutput> | TOutput;

/**
 * Compiled route (internal representation)
 */
export interface Route<TInput = unknown, TOutput = unknown> {
  _config: RouteConfig;
  _inputSchema?: Schema.Schema<TInput, unknown>;
  _middleware: MiddlewareFn<TInput, unknown>[];
  _handler?: HandlerFn<TInput, TOutput, unknown>; // Optional during build, required at execution
  _errorHandler?: ErrorHandlerFn<TInput, TOutput, unknown>;
}

/**
 * Fluent route builder interface
 */
export interface RouteBuilder<TInput = unknown, TOutput = unknown> {
  input<T>(schema: Schema.Schema.All & { Type: T }): RouteBuilder<T, TOutput>;
  timeout(duration: Duration): RouteBuilder<TInput, TOutput>;
  retry(config: RetryConfig): RouteBuilder<TInput, TOutput>;
  concurrency(limit: number): RouteBuilder<TInput, TOutput>;
  stream(): RouteBuilder<TInput, TOutput>;
  heartbeat(interval: Duration): RouteBuilder<TInput, TOutput>;
  cache(config: {
    ttl: Duration;
    key?: (input: TInput) => string;
  }): RouteBuilder<TInput, TOutput>;
  middleware<TCtx>(
    fn: MiddlewareFn<TInput, TCtx>,
  ): RouteBuilder<TInput, TOutput>;
  handler<T>(fn: HandlerFn<TInput, T, unknown>): Route<TInput, T>; // Terminal method
  onError(
    fn: ErrorHandlerFn<TInput, TOutput, unknown>,
  ): RouteBuilder<TInput, TOutput>;
}

/**
 * Router environment (Effect Context tag)
 * Users can extend this with their own context
 */
export interface RouterEnv {
  readonly directory: string;
  readonly baseUrl: string;
}

export const RouterEnv = Context.GenericTag<RouterEnv>("@opencode/RouterEnv");
```

### Error Types (`errors.ts`)

```typescript
import { Data } from "effect";
import type { ParseIssue } from "effect/ParseResult";

/**
 * Base route error
 */
export class RouteError extends Data.TaggedError("RouteError")<{
  message: string;
  route?: string;
}> {}

/**
 * Schema validation failed
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  message: string;
  issues: readonly ParseIssue[];
  route?: string;
}> {}

/**
 * Request timed out
 */
export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  message: string;
  duration: number; // milliseconds
  route?: string;
}> {}

/**
 * Handler threw error
 */
export class HandlerError extends Data.TaggedError("HandlerError")<{
  message: string;
  cause: unknown;
  route?: string;
}> {}

/**
 * Streaming error
 */
export class StreamError extends Data.TaggedError("StreamError")<{
  message: string;
  cause: unknown;
  route?: string;
}> {}

/**
 * No heartbeat within interval (streaming only)
 */
export class HeartbeatTimeoutError extends Data.TaggedError(
  "HeartbeatTimeoutError",
)<{
  message: string;
  duration: number; // milliseconds
  route?: string;
}> {}

/**
 * Middleware threw error
 */
export class MiddlewareError extends Data.TaggedError("MiddlewareError")<{
  message: string;
  cause: unknown;
  route?: string;
}> {}

/**
 * Route not found
 */
export class RouteNotFoundError extends Data.TaggedError("RouteNotFoundError")<{
  message: string;
  path: string;
}> {}
```

---

## API Surface

### 1. Route Builder (`createOpencodeRoute`)

**Factory function that returns a builder factory.**

```typescript
import { Schema } from "effect";
import { createOpencodeRoute } from "@opencode-vibe/router";

const o = createOpencodeRoute();

// Minimal route (no config)
const simple = o().handler(async ({ sdk }) => {
  return await sdk.someMethod();
});

// Full-featured route
const advanced = o({ timeout: "30s" })
  .input(Schema.Struct({ id: Schema.String }))
  .retry("exponential")
  .timeout("5s") // Override initial timeout
  .middleware(loggingMiddleware)
  .middleware(authMiddleware)
  .onError((error, ctx) => {
    console.error("Route error:", error);
    return { error: "Something went wrong" };
  })
  .handler(async ({ input, sdk, signal, ctx }) => {
    // ctx has types from middleware
    return await sdk.session.get({ path: { id: input.id } });
  });

// Streaming route
const stream = o({ stream: true, heartbeat: "60s" }).handler(async function* ({
  sdk,
  signal,
}) {
  for await (const event of sdk.global.event()) {
    if (signal.aborted) break;
    yield event;
  }
});
```

**Builder Methods**:

| Method                 | Purpose                                    | Chainable | Terminal |
| ---------------------- | ------------------------------------------ | --------- | -------- |
| `.input(schema)`       | Define input schema (Effect Schema)        | ✅        | ❌       |
| `.timeout(duration)`   | Set request timeout                        | ✅        | ❌       |
| `.retry(config)`       | Configure retry policy                     | ✅        | ❌       |
| `.concurrency(limit)`  | Max concurrent requests (reserved)         | ✅        | ❌       |
| `.stream()`            | Mark as streaming route                    | ✅        | ❌       |
| `.heartbeat(interval)` | Heartbeat timeout for streaming            | ✅        | ❌       |
| `.cache(config)`       | Cache config (reserved)                    | ✅        | ❌       |
| `.middleware(fn)`      | Add middleware (onion-style composition)   | ✅        | ❌       |
| `.onError(fn)`         | Custom error handler (can return fallback) | ✅        | ❌       |
| `.handler(fn)`         | Define handler logic (REQUIRED, terminal)  | ❌        | ✅       |

**Type Inference**:

```typescript
// TypeScript infers input/output types
const route = o()
  .input(Schema.Struct({ id: Schema.String }))
  .handler(async ({ input }) => {
    input.id; // string (inferred from schema)
    return { result: "success" };
  });

// route is Route<{ id: string }, { result: string }>
```

---

### 2. Router Factory (`createRouter`)

**Creates a router from a nested route object.**

```typescript
import { createRouter } from "@opencode-vibe/router";
import { routes } from "./routes";

const router = createRouter(routes);

// Resolve route by path
const route = router.resolve("session.get"); // Returns Route<{ id: string }, Session>

// Type error - route not found (at compile time if routes object is typed)
const invalid = router.resolve("nonexistent.route"); // Throws RouteNotFoundError at runtime
```

**Router Interface**:

```typescript
interface Router {
  resolve<TInput = unknown, TOutput = unknown>(
    path: string,
  ): Route<TInput, TOutput>;
}
```

**Path Resolution**:

- Dot-notation: `"session.get"` → `routes.session.get`
- Nested objects: `routes.session.get` → resolved route
- Throws `RouteNotFoundError` if path not found

---

### 3. Direct Caller (`createCaller`)

**Invoke routes directly without HTTP (for RSC, CLI, desktop apps).**

```typescript
import { createCaller } from "@opencode-vibe/router/adapters/direct";
import { createClient } from "@opencode-ai/sdk/client";

const caller = createCaller(router, {
  sdk: createClient({ baseUrl: "http://localhost:4056" }),
});

// Request-response
const session = await caller("session.get", { id: "ses_123" });

// Streaming (returns AsyncIterable)
const stream = await caller("subscribe.events", {});
for await (const event of stream) {
  console.log(event);
}
```

**Caller Interface**:

```typescript
type Caller = <TOutput = unknown>(
  path: string,
  input?: unknown,
) => Promise<TOutput>;

interface CallerContext {
  sdk: OpencodeClient; // Or any type
}
```

**Error Handling**:

- Throws typed errors directly (ValidationError, TimeoutError, HandlerError, etc.)
- Effect Exit unwrapping (Success → return value, Failure → throw error)

---

### 4. Next.js API Handler (`createNextHandler`)

**HTTP handler for Next.js API routes.**

```typescript
// app/api/router/route.ts
import { createNextHandler } from "@opencode-vibe/router/adapters/next";
import { createRouter } from "@opencode-vibe/router";
import { routes } from "@/core/router/routes";
import { createClient } from "@/core/client";

const router = createRouter(routes);

const handler = createNextHandler({
  router,
  createContext: async (req) => ({
    sdk: createClient("/path/to/project"),
  }),
});

export { handler as GET, handler as POST };
```

**Request Format**:

- **Path**: Query param `?path=session.get`
- **Input**: JSON body (POST) or query params (GET, excluding `path`)

**Response Format**:

- **Request-response**: JSON (`Content-Type: application/json`)
- **Streaming**: SSE (`Content-Type: text/event-stream`)

**SSE Format**:

```
data: {"type":"session.status","sessionId":"ses_123","status":"running"}

data: {"type":"message.created","message":{...}}

```

**Error Responses**:

| Error Type         | HTTP Status | Response Body                                 |
| ------------------ | ----------- | --------------------------------------------- |
| ValidationError    | 400         | `{ error: "ValidationError", issues: [...] }` |
| TimeoutError       | 504         | `{ error: "TimeoutError", duration: 30000 }`  |
| HandlerError       | 500         | `{ error: "HandlerError", message: "..." }`   |
| RouteNotFoundError | 404         | `{ error: "Route not found", path: "..." }`   |
| Unknown            | 500         | `{ error: "Internal Server Error" }`          |

---

### 5. Server Action Wrapper (`createAction`)

**Wraps a route as a Next.js Server Action.**

```typescript
// app/actions.ts
"use server";
import { createAction } from "@opencode-vibe/router/adapters/next";
import { routes } from "@/core/router/routes";
import { createClient } from "@/core/client";

export const getSession = createAction(routes.session.get, {
  createContext: async () => ({
    sdk: createClient(),
  }),
});

export const listMessages = createAction(routes.messages.list, {
  createContext: async () => ({
    sdk: createClient(),
  }),
});
```

**Usage in Client Component**:

```typescript
// app/session/[id]/page.tsx
"use client";
import { getSession, listMessages } from "@/app/actions";

export default function SessionPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    getSession({ id: params.id }).then(setSession);
  }, [params.id]);

  return <div>{session?.title}</div>;
}
```

**Error Handling**:

- Throws errors directly (no HTTP mapping)
- Next.js error boundary handles it

---

## Usage Examples

### Example 1: Basic Route Definitions

```typescript
import { createOpencodeRoute } from "@opencode-vibe/router";
import { Schema } from "effect";

const o = createOpencodeRoute();

export const routes = {
  session: {
    get: o({ timeout: "30s" })
      .input(Schema.Struct({ id: Schema.String }))
      .handler(async ({ input, sdk }) => {
        return await sdk.session.get({ path: { id: input.id } });
      }),

    list: o({ timeout: "10s" }).handler(async ({ sdk }) => {
      return await sdk.session.list();
    }),

    create: o({ timeout: "30s" })
      .input(Schema.Struct({ title: Schema.optional(Schema.String) }))
      .handler(async ({ input, sdk }) => {
        return await sdk.session.create({ body: input });
      }),

    delete: o({ timeout: "10s" })
      .input(Schema.Struct({ id: Schema.String }))
      .handler(async ({ input, sdk }) => {
        return await sdk.session.delete({ path: { id: input.id } });
      }),
  },

  provider: {
    list: o({ timeout: "10s" }).handler(async ({ sdk }) => {
      return await sdk.provider.list();
    }),
  },
};
```

---

### Example 2: Streaming Route

```typescript
const streamRoute = o({ stream: true, heartbeat: "60s" }).handler(
  async function* ({ sdk, signal }) {
    const stream = await sdk.global.event();

    for await (const event of stream) {
      if (signal.aborted) {
        break;
      }
      yield event;
    }
  },
);

// Usage with direct caller (returns AsyncIterable)
const caller = createCaller(router, { sdk });
const stream = await caller("subscribe.events", {});

for await (const event of stream) {
  console.log("Event:", event);
}

// Usage with Next.js API handler (returns SSE Response)
// GET /api/router?path=subscribe.events
// Response: text/event-stream
```

---

### Example 3: Middleware Chain

```typescript
const loggingMiddleware = async (ctx, next) => {
  console.log("Request:", ctx.input);
  const start = Date.now();
  try {
    const result = await next();
    console.log("Success:", Date.now() - start, "ms");
    return result;
  } catch (error) {
    console.error("Error:", Date.now() - start, "ms", error);
    throw error;
  }
};

const authMiddleware = async (ctx, next) => {
  const token = ctx.input.token;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await verifyToken(token);
  ctx.ctx.user = user; // Mutate context for downstream

  return next();
};

const route = o({ timeout: "30s" })
  .input(
    Schema.Struct({
      token: Schema.String,
      id: Schema.String,
    }),
  )
  .middleware(loggingMiddleware)
  .middleware(authMiddleware)
  .handler(async ({ input, ctx }) => {
    // ctx.user is available from authMiddleware
    return { user: ctx.user, id: input.id };
  });
```

---

### Example 4: Retry with Custom Config

```typescript
// Exponential backoff preset
const autoRetry = o({ retry: "exponential" }).handler(async ({ sdk }) => {
  return await sdk.someFlakeyOperation();
});

// Linear retry preset
const linearRetry = o({ retry: "linear" }).handler(async ({ sdk }) => {
  return await sdk.someOperation();
});

// Custom retry config
const customRetry = o()
  .retry({
    maxAttempts: 5,
    delay: "200ms",
    backoff: 1.5, // 200ms → 300ms → 450ms → 675ms → 1012ms
  })
  .handler(async ({ sdk }) => {
    return await sdk.someOperation();
  });
```

---

### Example 5: Error Handling

```typescript
const routeWithFallback = o({ timeout: "5s" })
  .input(Schema.Struct({ id: Schema.String }))
  .onError((error, ctx) => {
    if (error instanceof NotFoundError) {
      return { id: ctx.input.id, notFound: true };
    }
    // Re-throw for default error handling
    throw error;
  })
  .handler(async ({ input, sdk }) => {
    return await sdk.session.get({ path: { id: input.id } });
  });

// Usage
const result = await caller("session.get", { id: "nonexistent" });
// Returns: { id: "nonexistent", notFound: true }
```

---

### Example 6: RSC Usage (Server Components)

```typescript
// app/session/[id]/page.tsx
import { createRouter, createCaller } from "@opencode-vibe/router";
import { createClient } from "@/core/client";
import { routes } from "@/core/router/routes";

const router = createRouter(routes);

export default async function SessionPage({ params }: { params: { id: string } }) {
  const caller = createCaller(router, {
    sdk: createClient("/path/to/project")
  });

  const [session, messages] = await Promise.all([
    caller("session.get", { id: params.id }),
    caller("messages.list", { sessionId: params.id, limit: 50 })
  ]);

  return (
    <div>
      <h1>{session.title}</h1>
      <MessageList messages={messages} />
    </div>
  );
}
```

---

## Schedule Utilities

### Duration Parsing

```typescript
import { parseDuration } from "@opencode-vibe/router";

parseDuration("5s"); // 5000
parseDuration("30s"); // 30000
parseDuration("5m"); // 300000
parseDuration("1h"); // 3600000
parseDuration("100ms"); // 100
```

**Format**: `/^(\d+)(ms|s|m|h)$/`

**Units**:

- `ms` → 1
- `s` → 1000
- `m` → 60000
- `h` → 3600000

### Retry Schedule Builder

```typescript
import { buildSchedule } from "@opencode-vibe/router";
import { Schedule } from "effect";

// Presets
buildSchedule("none"); // Schedule.recurs(0)
buildSchedule("exponential"); // 100ms, 2x backoff, 3 retries
buildSchedule("linear"); // 100ms fixed, 3 retries

// Custom
buildSchedule({
  maxAttempts: 2,
  delay: "50ms",
  backoff: 2,
});
// Returns: Schedule.exponential("50ms") | Schedule.recurs(2)
```

---

## Distribution

### Build Process

**Unbundled ESM** (no bundler):

1. TypeScript compiles `.ts` → `.mjs` + `.d.mts`
2. Source maps generated for debugging
3. No bundling (tree-shakeable)

```bash
# Build
bun run build  # tsc --project tsconfig.build.json

# Output
dist/
├── index.mjs
├── index.d.mts
├── builder.mjs
├── builder.d.mts
├── router.mjs
├── router.d.mts
├── executor.mjs
├── executor.d.mts
├── types.mjs
├── types.d.mts
├── errors.mjs
├── errors.d.mts
├── schedule.mjs
├── schedule.d.mts
├── stream.mjs
├── stream.d.mts
├── routes.mjs
├── routes.d.mts
└── adapters/
    ├── direct.mjs
    ├── direct.d.mts
    ├── next.mjs
    └── next.d.mts
```

**Why unbundled?**

- Tree-shakeable (consumers import only what they use)
- Fast builds (no bundling overhead)
- Source maps work correctly
- Works everywhere (Bun, Node 18+, browsers, Deno)

---

## Import Paths

### Main Entry

```typescript
import {
  createRouter,
  createOpencodeRoute,
  ValidationError,
  parseDuration,
} from "@opencode-vibe/router";
```

### Adapters

```typescript
// Direct caller (RSC, CLI, desktop)
import { createCaller } from "@opencode-vibe/router/adapters/direct";

// Next.js adapter
import {
  createNextHandler,
  createAction,
} from "@opencode-vibe/router/adapters/next";
```

### Example Routes

```typescript
// Optional - users typically define their own
import { createRoutes } from "@opencode-vibe/router/routes";
```

---

## Dependencies

### Peer Dependencies

```json
{
  "effect": "^3.19.0"
}
```

**Why peer dependency?** Effect Schema API is tightly coupled to Effect version. User's project should control the Effect version.

### Runtime Dependencies

**None.** The package has zero runtime dependencies beyond `effect` (peer).

### Dev Dependencies

```json
{
  "effect": "^3.19.13",
  "typescript": "^5.7.3",
  "@types/bun": "latest"
}
```

---

## Known Gotchas

### 1. Effect Schema Version Compatibility

**Issue**: Effect Schema is part of `effect` package, API changes between versions  
**Mitigation**: Lock peer dependency to `^3.19.0` (allows patches, not minors)  
**User action**: Ensure `effect` version matches peer dependency

### 2. Streaming Routes Return Different Types

**Direct caller**: Returns `AsyncIterable<T>`  
**Next.js handler**: Returns `Response` with SSE stream  
**Server Action**: Returns `AsyncIterable<T>`

**Type signature is the same** (`Promise<TOutput>`), but runtime return type differs.

**TypeScript inference handles this correctly** - users get the right type based on adapter.

### 3. Middleware Context is Untyped

**Current**: Middleware mutates `ctx.ctx` object (typed as `unknown`)  
**Workaround**: Type assertion in handler  
**Future**: Use Effect Context layers for type-safe middleware context

### 4. .js Extensions in Imports

**Pattern**: Relative imports use `.js` extensions (ESM requirement)

```typescript
import type { OpencodeClient } from "../../client.js";
```

**Why?** ESM spec requires file extensions for relative imports. TypeScript resolves `.js` to `.ts` during compilation, and final output has `.mjs`.

---

## Future Enhancements

### 1. Cache Implementation

**Current**: `cache` config exists but not implemented  
**Proposal**: LRU cache in executor with TTL-based invalidation

```typescript
const route = o({ timeout: "30s" })
  .cache({ ttl: "5m", key: (input) => input.id })
  .handler(async ({ input, sdk }) => {
    // Cached for 5 minutes, keyed by input.id
    return await sdk.session.get({ path: { id: input.id } });
  });
```

### 2. Concurrency Limiting

**Current**: `concurrency` config exists but not implemented  
**Proposal**: Effect Semaphore for limiting concurrent requests

```typescript
const route = o({ concurrency: 5 }).handler(async ({ sdk }) => {
  // Max 5 concurrent executions
  return await heavyOperation();
});
```

### 3. Type-Safe Route Paths

**Current**: Route paths are strings (`"session.get"`)  
**Proposal**: Type-safe helpers from routes object

```typescript
// Instead of:
const session = await caller("session.get", { id: "123" });

// Type-safe API:
const session = await call(routes).session.get({ id: "123" });
```

### 4. OpenTelemetry Integration

**Proposal**: Auto-instrument routes with tracing

```typescript
const route = o({ timeout: "30s", trace: true }).handler(
  async ({ input, sdk }) => {
    // Automatic span creation: "session.get"
    return await sdk.session.get({ path: { id: input.id } });
  },
);
```

### 5. Effect Context Middleware

**Current**: Middleware mutates `ctx.ctx` object (untyped)  
**Proposal**: Use Effect Context layers for type-safe context

```typescript
const AuthContext = Context.GenericTag<{ user: User }>("Auth");

const authMiddleware = Effect.gen(function* () {
  const user = yield* authenticateUser();
  return Layer.succeed(AuthContext, { user });
});

const route = o({ timeout: "30s" })
  .middleware(authMiddleware)
  .handler(async ({ ... }) => {
    const auth = yield* AuthContext;
    return auth.user;
  });
```

---

## Migration from opencode-next

### Before (in app)

```typescript
import { createRouter } from "@/core/router";
import { createCaller } from "@/core/router/adapters/direct";
import { createNextHandler } from "@/core/router/adapters/next";
```

### After (extracted package)

```typescript
import { createRouter } from "@opencode-vibe/router";
import { createCaller } from "@opencode-vibe/router/adapters/direct";
import { createNextHandler } from "@joelhools/router/adapters/next";
```

### Files Affected

**In opencode-next app** (update imports):

- `apps/web/src/app/api/router/route.ts` - Next.js handler
- `apps/web/src/app/actions.ts` - Server Actions
- Any RSC pages using `createCaller`

**Keep in app** (OpenCode-specific):

- `apps/web/src/core/client.ts` - SDK client factory
- `apps/web/src/core/discovery.ts` - Browser discovery
- `apps/web/src/core/server-discovery.ts` - Node.js lsof discovery
- `apps/web/src/core/server-routing.ts` - Pure routing logic
- `apps/web/src/core/multi-server-sse.ts` - SSE manager

---

## Testing

### Test Strategy

**TDD (red-green-refactor)**:

1. Write failing test
2. Minimum code to pass
3. Refactor while green

**Test coverage**: 100% (1:1 test-to-source ratio)

### Test Files

```
src/
├── builder.test.ts         # 50+ tests (fluent API, chaining)
├── router.test.ts          # 15+ tests (resolution, errors)
├── executor.test.ts        # 30+ tests (validation, timeout, retry)
├── stream.test.ts          # 20+ tests (streaming, heartbeat)
├── schedule.test.ts        # 10+ tests (duration parsing, schedules)
├── errors.test.ts          # 5+ tests (error construction)
└── adapters/
    ├── direct.test.ts      # 15+ tests (caller execution)
    └── next.test.ts        # 20+ tests (HTTP responses, SSE)
```

### Test Runner

```bash
bun test           # Run all tests
bun test --watch   # Watch mode
```

---

## Documentation Needs

### README.md

- What is router?
- Why Effect?
- Quick start (5 lines of code)
- Comparison with tRPC/Hono/Express

### API Reference

- `createOpencodeRoute()` - All builder methods
- `createRouter()` - Route resolution
- `createCaller()` - Direct invocation
- `createNextHandler()` - Next.js API routes
- `createAction()` - Server Actions
- Error types and handling
- Streaming routes
- Middleware patterns

### Examples

- Basic CRUD routes
- Streaming SSE
- Middleware chain
- Error handling with fallbacks
- Custom retry configs
- Testing with Effect Test

### Migration Guide

- Before/after imports
- File structure changes
- Testing changes

---

## Success Criteria

Extraction is successful when:

1. ✅ **Zero breaking changes** - Existing opencode-next code works with new package
2. ✅ **100% test coverage** - All tests pass in extracted package
3. ✅ **Published to npm** - `@opencode-vibe/router@0.1.0`
4. ✅ **Integrated in opencode-next** - App uses published package
5. ✅ **Documentation complete** - README, API docs, examples
6. ✅ **No React dependencies** - Truly framework-agnostic
7. ✅ **Works in multiple runtimes** - Bun, Node 18+, browsers, Deno

---

## Conclusion

`@opencode-vibe/router` is a **production-ready, framework-agnostic Effect router** extracted from `opencode-next`. It provides:

- ✅ **Fluent API** - Type-safe route builder with chaining
- ✅ **Effect integration** - Timeout, retry, streaming via Effect primitives
- ✅ **Multiple adapters** - RSC, Next.js, Server Actions
- ✅ **Schema validation** - Effect Schema for input validation
- ✅ **Streaming** - AsyncGenerator → Effect.Stream → SSE/AsyncIterable
- ✅ **Middleware** - Onion-style composition
- ✅ **Error handling** - Tagged errors with typed causes
- ✅ **100% test coverage** - TDD from the start

**Ready for extraction and publication.**
