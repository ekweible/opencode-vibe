/**
 * @opencode-vibe/core/discovery
 *
 * Server discovery and routing modules for OpenCode.
 *
 * ## Modules
 *
 * - **discovery.ts**: Effect-based ServerDiscovery service
 * - **server-discovery.ts**: Process-based server discovery (SSR-safe)
 * - **server-routing.ts**: Pure routing functions for directory/session→server mapping
 */

// Effect-based ServerDiscovery service
export {
	ServerDiscovery,
	Default as ServerDiscoveryDefault,
	makeTestLayer as makeServerDiscoveryTestLayer,
	type ServerDiscoveryService,
	type ServerInfo,
} from "./discovery.js"

// Process-based discovery (SSR-safe)
export { discoverServers, type DiscoveredServer } from "./server-discovery.js"

// Pure routing functions
export { getServerForDirectory, getServerForSession } from "./server-routing.js"
export type { ServerInfo as RoutingServerInfo } from "./server-routing.js"
