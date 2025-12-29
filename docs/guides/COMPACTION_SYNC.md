# Compaction & Context Sync Guide

```
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   ┌─────────────────────────────────────────────────────┐    ║
    ║   │   ██████╗ ██████╗ ███╗   ███╗██████╗  █████╗  ██████╗│    ║
    ║   │  ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔══██╗██╔════╝│    ║
    ║   │  ██║     ██║   ██║██╔████╔██║██████╔╝███████║██║     │    ║
    ║   │  ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██╔══██║██║     │    ║
    ║   │  ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║  ██║╚██████╗│    ║
    ║   │   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝│    ║
    ║   │                                                     │    ║
    ║   │         COMPACTION & CONTEXT SYNC GUIDE             │    ║
    ║   └─────────────────────────────────────────────────────┘    ║
    ║                                                               ║
    ║   Stop the freeze. Show context usage. Track compaction.     ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
```

---

## The Problem

When OpenCode runs out of context, it triggers **compaction** - a summarization process that:

1. Creates a summary of the conversation
2. Prunes old tool outputs
3. Continues with a fresh context window

During this, your web client shows **nothing** - it just freezes because:

- No visual indicator that compaction is happening
- No context usage meter to see it coming
- No progress feedback during the summarization

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CURRENT STATE (FROZEN UI)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User: "Continue implementing the feature..."                       │
│                                                                     │
│  Assistant: [Thinking...]                                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                    (nothing happens)                        │   │
│  │                                                             │   │
│  │              User thinks it's broken                        │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  (Actually: compaction is running, summarizing 200k tokens...)      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Solution

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DESIRED STATE (INFORMED UI)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Context: ████████████████████░░░░  156k / 200k (78%)       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  User: "Continue implementing the feature..."                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ⟳ Compacting context...                                    │   │
│  │                                                             │   │
│  │  Summarizing conversation to continue with fresh context.   │   │
│  │  This may take a moment.                                    │   │
│  │                                                             │   │
│  │  ████████████░░░░░░░░░░░░░░░░░░  Generating summary...      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [How Compaction Works](#1-how-compaction-works)
2. [Detecting Compaction State](#2-detecting-compaction-state)
3. [Tracking Context Usage](#3-tracking-context-usage)
4. [SSE Events Reference](#4-sse-events-reference)
5. [React Implementation](#5-react-implementation)
6. [UI Components](#6-ui-components)

---

## 1. How Compaction Works

### Compaction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COMPACTION LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Context overflow detected                                        │
│     └─► tokens.input + tokens.cache.read + tokens.output > limit    │
│     └─► Triggers when: count > (context_limit - output_reserve)     │
│                                                                     │
│  2. Compaction message created                                       │
│     └─► User message with CompactionPart (type: "compaction")       │
│     └─► This is your signal that compaction is starting!            │
│                                                                     │
│  3. Compaction agent runs                                            │
│     └─► Creates assistant message with agent: "compaction"          │
│     └─► Generates summary of conversation                           │
│     └─► Streams text like normal (you can show progress!)           │
│                                                                     │
│  4. Pruning (optional)                                               │
│     └─► Old tool outputs marked with time.compacted                 │
│     └─► Protects last 40k tokens of tool calls                      │
│     └─► Clears outputs older than that threshold                    │
│                                                                     │
│  5. Compaction complete                                              │
│     └─► session.compacted event emitted                             │
│     └─► Session continues with fresh context                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Insight

Compaction is **just another message exchange** - it creates:

1. A user message with `CompactionPart` (type: "compaction")
2. An assistant message with `agent: "compaction"` and `summary: true`

You can detect and display this like any other message!

---

## 2. Detecting Compaction State

### Method 1: Detect CompactionPart in Messages

When compaction starts, a user message is created with a `CompactionPart`:

```typescript
// From MessageV2 types
interface CompactionPart {
  id: string;
  type: "compaction";
  sessionID: string;
  messageID: string;
  auto: boolean; // true = automatic, false = manual /compact command
}
```

### Method 2: Detect Compaction Agent in Assistant Message

The compaction summary is generated by an assistant message with special flags:

```typescript
interface AssistantMessage {
  id: string;
  role: "assistant";
  agent: string; // "compaction" during compaction
  summary: boolean; // true during compaction
  mode: string; // "compaction" during compaction
  // ... other fields
}
```

### Method 3: Listen for session.compacted Event

When compaction completes:

```typescript
interface SessionCompactedEvent {
  type: "session.compacted";
  properties: {
    sessionID: string;
  };
}
```

### Detection Logic

```typescript
interface CompactionState {
  isCompacting: boolean;
  isAutomatic: boolean;
  startedAt?: number;
  progress?: {
    hasStarted: boolean;
    hasText: boolean;
    isComplete: boolean;
  };
}

function detectCompactionState(messages: MessageWithParts[]): CompactionState {
  // Find the last user message with a compaction part
  const lastUserMsg = messages.findLast((m) => m.info.role === "user");
  const compactionPart = lastUserMsg?.parts.find(
    (p): p is CompactionPart => p.type === "compaction",
  );

  if (!compactionPart) {
    return { isCompacting: false, isAutomatic: false };
  }

  // Find the corresponding assistant message
  const compactionAssistant = messages.find(
    (m) =>
      m.info.role === "assistant" &&
      m.info.parentID === lastUserMsg.info.id &&
      m.info.agent === "compaction",
  );

  const hasText =
    compactionAssistant?.parts.some((p) => p.type === "text") ?? false;
  const isComplete = compactionAssistant?.info.finish !== undefined;

  return {
    isCompacting: !isComplete,
    isAutomatic: compactionPart.auto,
    startedAt: lastUserMsg.info.time.created,
    progress: {
      hasStarted: !!compactionAssistant,
      hasText,
      isComplete,
    },
  };
}
```

---

## 3. Tracking Context Usage

### Where Token Counts Come From

Every `AssistantMessage` includes token usage:

```typescript
interface AssistantMessage {
  // ... other fields
  tokens: {
    input: number; // Input tokens (prompt)
    output: number; // Output tokens (response)
    reasoning: number; // Reasoning tokens (if applicable)
    cache: {
      read: number; // Cached tokens read
      write: number; // Cached tokens written
    };
  };
  cost: number; // Cost in dollars
}
```

### Calculating Context Usage

```typescript
interface ContextUsage {
  used: number; // Tokens used
  limit: number; // Model's context limit
  percentage: number; // 0-100
  remaining: number; // Tokens remaining
  isNearLimit: boolean; // Warning threshold (e.g., 80%)
  willTriggerCompaction: boolean;
}

function calculateContextUsage(
  lastAssistantMessage: AssistantMessage,
  model: ModelInfo,
): ContextUsage {
  const tokens = lastAssistantMessage.tokens;

  // Total tokens used in this turn
  const used = tokens.input + tokens.cache.read + tokens.output;

  // Model's context limit
  const contextLimit = model.limit.context;

  // Reserve for output (max 32k or model's output limit)
  const outputReserve = Math.min(model.limit.output, 32_000);

  // Usable context (what triggers compaction)
  const usableContext = contextLimit - outputReserve;

  const percentage = Math.round((used / usableContext) * 100);
  const remaining = usableContext - used;

  return {
    used,
    limit: usableContext,
    percentage: Math.min(percentage, 100),
    remaining: Math.max(remaining, 0),
    isNearLimit: percentage >= 80,
    willTriggerCompaction: used > usableContext,
  };
}
```

### Getting Model Limits

Fetch model info from the provider endpoint:

```typescript
// GET /provider
interface ProviderResponse {
  all: ProviderInfo[];
  default: Record<string, string>;
  connected: string[];
}

interface ProviderInfo {
  id: string;
  name: string;
  models: Record<string, ModelInfo>;
}

interface ModelInfo {
  id: string;
  name: string;
  limit: {
    context: number; // e.g., 200000 for Claude
    output: number; // e.g., 8192
  };
  cost?: {
    input: number;
    output: number;
    cache?: { read: number; write: number };
  };
}
```

---

## 4. SSE Events Reference

### Events for Context & Compaction Tracking

| Event                  | When                    | Use For                                       |
| ---------------------- | ----------------------- | --------------------------------------------- |
| `message.updated`      | Message created/updated | Detect compaction messages                    |
| `message.part.updated` | Part created/updated    | Detect CompactionPart, track summary progress |
| `session.compacted`    | Compaction complete     | Clear compaction UI state                     |
| `session.status`       | Session state change    | Show busy/idle status                         |

### Event Payloads

```typescript
// Detect compaction starting
interface MessagePartUpdatedEvent {
  type: "message.part.updated";
  properties: {
    part: Part;
    delta?: string;
  };
}

// Check if part is CompactionPart
function isCompactionPart(part: Part): part is CompactionPart {
  return part.type === "compaction";
}

// Detect compaction complete
interface SessionCompactedEvent {
  type: "session.compacted";
  properties: {
    sessionID: string;
  };
}

// Detect compaction agent message
interface MessageUpdatedEvent {
  type: "message.updated";
  properties: {
    info: Message;
  };
}

function isCompactionMessage(msg: Message): boolean {
  return msg.role === "assistant" && msg.agent === "compaction";
}
```

---

## 5. React Implementation

### Context Usage Store

```typescript
// stores/context.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ContextState {
  // Per-session context usage
  usage: Record<string, ContextUsage>;

  // Per-session compaction state
  compaction: Record<string, CompactionState>;

  // Model limits cache
  modelLimits: Record<string, { context: number; output: number }>;

  // Actions
  updateUsage: (sessionId: string, tokens: TokenUsage, modelId: string) => void;
  setCompacting: (sessionId: string, state: CompactionState) => void;
  clearCompaction: (sessionId: string) => void;
  setModelLimits: (
    modelId: string,
    limits: { context: number; output: number },
  ) => void;
}

interface ContextUsage {
  used: number;
  limit: number;
  percentage: number;
  remaining: number;
  isNearLimit: boolean;
  tokens: {
    input: number;
    output: number;
    cached: number;
  };
  lastUpdated: number;
}

interface CompactionState {
  isCompacting: boolean;
  isAutomatic: boolean;
  startedAt: number;
  messageId?: string;
  progress: "pending" | "generating" | "complete";
}

export const useContextStore = create<ContextState>()(
  immer((set, get) => ({
    usage: {},
    compaction: {},
    modelLimits: {},

    updateUsage: (sessionId, tokens, modelId) =>
      set((state) => {
        const limits = state.modelLimits[modelId] || {
          context: 200000,
          output: 32000,
        };
        const used = tokens.input + tokens.cache.read + tokens.output;
        const usableContext = limits.context - Math.min(limits.output, 32000);

        state.usage[sessionId] = {
          used,
          limit: usableContext,
          percentage: Math.min(Math.round((used / usableContext) * 100), 100),
          remaining: Math.max(usableContext - used, 0),
          isNearLimit: used / usableContext >= 0.8,
          tokens: {
            input: tokens.input,
            output: tokens.output,
            cached: tokens.cache.read,
          },
          lastUpdated: Date.now(),
        };
      }),

    setCompacting: (sessionId, compactionState) =>
      set((state) => {
        state.compaction[sessionId] = compactionState;
      }),

    clearCompaction: (sessionId) =>
      set((state) => {
        delete state.compaction[sessionId];
      }),

    setModelLimits: (modelId, limits) =>
      set((state) => {
        state.modelLimits[modelId] = limits;
      }),
  })),
);
```

### SSE Event Handler for Context Tracking

```typescript
// hooks/useContextSync.ts
import { useEffect } from "react";
import { useContextStore } from "@/stores/context";

export function useContextSync(sessionId: string) {
  const updateUsage = useContextStore((s) => s.updateUsage);
  const setCompacting = useContextStore((s) => s.setCompacting);
  const clearCompaction = useContextStore((s) => s.clearCompaction);

  useEffect(() => {
    const handleEvent = (event: SSEEvent) => {
      const { type, properties } = event.payload;

      switch (type) {
        // Track token usage from assistant messages
        case "message.updated": {
          const msg = properties.info;
          if (msg.sessionID !== sessionId) break;

          if (msg.role === "assistant" && msg.tokens) {
            const modelId = `${msg.providerID}/${msg.modelID}`;
            updateUsage(sessionId, msg.tokens, modelId);

            // Detect compaction agent starting
            if (msg.agent === "compaction" && !msg.finish) {
              setCompacting(sessionId, {
                isCompacting: true,
                isAutomatic: true, // Will be updated by part event
                startedAt: msg.time.created,
                messageId: msg.id,
                progress: "generating",
              });
            }

            // Detect compaction complete
            if (msg.agent === "compaction" && msg.finish) {
              setCompacting(sessionId, {
                isCompacting: false,
                isAutomatic: false,
                startedAt: 0,
                progress: "complete",
              });
            }
          }
          break;
        }

        // Detect compaction part (compaction starting)
        case "message.part.updated": {
          const part = properties.part;
          if (part.sessionID !== sessionId) break;

          if (part.type === "compaction") {
            setCompacting(sessionId, {
              isCompacting: true,
              isAutomatic: part.auto,
              startedAt: Date.now(),
              progress: "pending",
            });
          }
          break;
        }

        // Compaction complete event
        case "session.compacted": {
          if (properties.sessionID !== sessionId) break;
          clearCompaction(sessionId);
          break;
        }
      }
    };

    return subscribeToSSE(handleEvent);
  }, [sessionId]);
}
```

### Fetch Model Limits on Mount

```typescript
// hooks/useModelLimits.ts
import { useEffect } from "react";
import { useContextStore } from "@/stores/context";

export function useModelLimits() {
  const setModelLimits = useContextStore((s) => s.setModelLimits);

  useEffect(() => {
    async function fetchLimits() {
      const response = await fetch("/provider");
      const data = await response.json();

      for (const provider of data.all) {
        for (const [modelId, model] of Object.entries(provider.models)) {
          const fullId = `${provider.id}/${modelId}`;
          setModelLimits(fullId, {
            context: model.limit.context,
            output: model.limit.output,
          });
        }
      }
    }

    fetchLimits();
  }, []);
}
```

---

## 6. UI Components

### Context Usage Bar

```tsx
// components/ContextUsageBar.tsx
import { useContextStore } from "@/stores/context";
import { AlertTriangle } from "lucide-react";

interface ContextUsageBarProps {
  sessionId: string;
}

export function ContextUsageBar({ sessionId }: ContextUsageBarProps) {
  const usage = useContextStore((s) => s.usage[sessionId]);

  if (!usage) return null;

  const formatTokens = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="context-usage-bar">
      <div className="context-label">
        <span>Context</span>
        {usage.isNearLimit && (
          <AlertTriangle className="h-3 w-3 text-amber-500" />
        )}
      </div>

      <div className="context-bar-container">
        <div
          className={`context-bar-fill ${usage.isNearLimit ? "near-limit" : ""}`}
          style={{ width: `${usage.percentage}%` }}
        />
      </div>

      <div className="context-stats">
        <span>
          {formatTokens(usage.used)} / {formatTokens(usage.limit)}
        </span>
        <span className="context-percentage">{usage.percentage}%</span>
      </div>
    </div>
  );
}
```

### Compaction Indicator

```tsx
// components/CompactionIndicator.tsx
import { useContextStore } from "@/stores/context";
import { Loader2, Sparkles } from "lucide-react";

interface CompactionIndicatorProps {
  sessionId: string;
}

export function CompactionIndicator({ sessionId }: CompactionIndicatorProps) {
  const compaction = useContextStore((s) => s.compaction[sessionId]);

  if (!compaction?.isCompacting) return null;

  return (
    <div className="compaction-indicator">
      <div className="compaction-header">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="compaction-title">
          {compaction.isAutomatic
            ? "Auto-compacting context..."
            : "Compacting context..."}
        </span>
      </div>

      <p className="compaction-description">
        Summarizing conversation to continue with fresh context. This may take a
        moment.
      </p>

      <div className="compaction-progress">
        {compaction.progress === "pending" && (
          <span className="text-muted">Preparing summary...</span>
        )}
        {compaction.progress === "generating" && (
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span>Generating summary...</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Compaction Message Renderer

Show the compaction summary as it streams:

```tsx
// components/CompactionMessage.tsx
interface CompactionMessageProps {
  message: MessageWithParts;
}

export function CompactionMessage({ message }: CompactionMessageProps) {
  const isComplete = message.info.finish !== undefined;
  const textPart = message.parts.find((p): p is TextPart => p.type === "text");

  return (
    <div className="compaction-message">
      <div className="compaction-message-header">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span>Context Summary</span>
        {!isComplete && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>

      {textPart && (
        <div className="compaction-message-content">
          <Markdown content={textPart.text} />
        </div>
      )}

      {isComplete && (
        <div className="compaction-message-footer">
          <Check className="h-3 w-3 text-green-500" />
          <span>Context compacted successfully</span>
        </div>
      )}
    </div>
  );
}
```

### Inline Compaction Notice (in message list)

```tsx
// components/MessageList.tsx
function MessageList({ messages }: { messages: MessageWithParts[] }) {
  return (
    <div className="message-list">
      {messages.map((msg) => {
        // Check for compaction part in user message
        const compactionPart = msg.parts.find(
          (p): p is CompactionPart => p.type === "compaction",
        );

        if (compactionPart) {
          return (
            <CompactionNotice
              key={msg.info.id}
              isAutomatic={compactionPart.auto}
            />
          );
        }

        // Check for compaction agent message
        if (msg.info.role === "assistant" && msg.info.agent === "compaction") {
          return <CompactionMessage key={msg.info.id} message={msg} />;
        }

        // Regular message
        return <Message key={msg.info.id} message={msg} />;
      })}
    </div>
  );
}

function CompactionNotice({ isAutomatic }: { isAutomatic: boolean }) {
  return (
    <div className="compaction-notice">
      <div className="compaction-notice-icon">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="compaction-notice-text">
        {isAutomatic
          ? "Context limit reached. Auto-compacting..."
          : "Manual compaction requested."}
      </div>
    </div>
  );
}
```

### CSS Styles

```css
/* styles/context.css */

.context-usage-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg-element);
  border-radius: 6px;
  font-size: 12px;
}

.context-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  min-width: 60px;
}

.context-bar-container {
  flex: 1;
  height: 6px;
  background: var(--color-bg-panel);
  border-radius: 3px;
  overflow: hidden;
}

.context-bar-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.context-bar-fill.near-limit {
  background: var(--color-warning);
}

.context-stats {
  display: flex;
  gap: 8px;
  color: var(--color-text-muted);
  min-width: 100px;
  justify-content: flex-end;
}

.context-percentage {
  font-weight: 600;
  color: var(--color-text);
}

/* Compaction Indicator */
.compaction-indicator {
  padding: 16px;
  background: var(--color-bg-element);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin: 12px 0;
}

.compaction-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.compaction-title {
  font-weight: 600;
  color: var(--color-text);
}

.compaction-description {
  color: var(--color-text-muted);
  font-size: 14px;
  margin-bottom: 12px;
}

.compaction-progress {
  font-size: 13px;
  color: var(--color-text-muted);
}

/* Compaction Message */
.compaction-message {
  background: linear-gradient(
    135deg,
    var(--color-bg-element),
    var(--color-bg-panel)
  );
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  margin: 12px 0;
}

.compaction-message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-panel);
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
}

.compaction-message-content {
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.compaction-message-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: var(--color-bg-panel);
  border-top: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-muted);
}

/* Compaction Notice (inline) */
.compaction-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-element);
  border-left: 3px solid var(--color-primary);
  margin: 8px 0;
}

.compaction-notice-icon {
  color: var(--color-primary);
}

.compaction-notice-text {
  color: var(--color-text-muted);
  font-size: 14px;
}
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                  COMPACTION SYNC CHECKLIST                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Context Usage Tracking                                             │
│  ──────────────────────                                             │
│  [x] Extract tokens from AssistantMessage.tokens                    │
│  [x] Calculate: input + cache.read + output                         │
│  [x] Get model limits from /provider endpoint                       │
│  [x] Show percentage bar with warning at 80%                        │
│                                                                     │
│  Compaction Detection                                               │
│  ────────────────────                                               │
│  [x] Detect CompactionPart (type: "compaction") in user message     │
│  [x] Detect agent: "compaction" in assistant message                │
│  [x] Track progress: pending → generating → complete                │
│  [x] Listen for session.compacted event                             │
│                                                                     │
│  UI Feedback                                                        │
│  ───────────                                                        │
│  [x] Context usage bar (always visible)                             │
│  [x] Compaction indicator (during compaction)                       │
│  [x] Compaction message renderer (shows summary)                    │
│  [x] Inline notice in message list                                  │
│                                                                     │
│  SSE Events                                                         │
│  ──────────                                                         │
│  [x] message.updated → token usage, compaction agent                │
│  [x] message.part.updated → CompactionPart detection                │
│  [x] session.compacted → clear compaction state                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Points

1. **Token counts are in every AssistantMessage** - No extra API calls needed
2. **CompactionPart signals start** - Look for `type: "compaction"` in user message parts
3. **Compaction agent is identifiable** - `agent: "compaction"` and `summary: true`
4. **Summary streams like normal text** - Show it as it generates
5. **session.compacted signals end** - Clear your compaction UI state

### Quick Reference

| What                | Where                                     | How to Detect           |
| ------------------- | ----------------------------------------- | ----------------------- |
| Token usage         | `AssistantMessage.tokens`                 | Every assistant message |
| Compaction starting | `Part.type === "compaction"`              | In user message parts   |
| Compaction running  | `AssistantMessage.agent === "compaction"` | In assistant message    |
| Compaction complete | `session.compacted` event                 | SSE event               |
| Auto vs manual      | `CompactionPart.auto`                     | Boolean flag            |

---

_Last updated: December 2024_
