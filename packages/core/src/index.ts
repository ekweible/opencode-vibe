/**
 * @opencode-vibe/core - The OpenCode Engine
 *
 * Core package providing router, atoms, discovery, SSE, client, and utilities.
 * This is the main entry point - for specific modules, import from subpaths:
 *
 * - @opencode-vibe/core/router - Effect-based router
 * - @opencode-vibe/core/atoms - State atoms (planned)
 * - @opencode-vibe/core/discovery - Server discovery
 * - @opencode-vibe/core/sse - SSE streaming
 * - @opencode-vibe/core/client - API client
 * - @opencode-vibe/core/utils - Utilities
 * - @opencode-vibe/core/types - Type definitions
 */

// Re-export main modules
export * from "./router/index.js"
export * from "./discovery/index.js"
export * from "./sse/index.js"
export * from "./client/index.js"
export * from "./utils/index.js"
export * from "./types/index.js"
