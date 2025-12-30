/**
 * @opencode-vibe/core/discovery
 *
 * Server discovery and routing modules for OpenCode.
 *
 * ## Modules
 *
 * - **discovery.ts**: Effect-based ServerDiscovery service (browser-safe)
 * - **server-routing.ts**: Pure routing functions for directory/session→server mapping
 *
 * ## Node.js-only exports
 *
 * For Node.js-specific functionality (child_process, fs):
 * - Import from "@opencode-vibe/core/discovery/server"
 * - **server-discovery.ts**: Process-based server discovery (Node.js only)
 */

// Effect-based ServerDiscovery service (browser-safe - uses fetch)
export {
	ServerDiscovery,
	Default as ServerDiscoveryDefault,
	makeTestLayer as makeServerDiscoveryTestLayer,
	type ServerDiscoveryService,
	type ServerInfo,
} from "./discovery.js"

// Pure routing functions (browser-safe)
export { getServerForDirectory, getServerForSession } from "./server-routing.js"
export type { ServerInfo as RoutingServerInfo } from "./server-routing.js"
