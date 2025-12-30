/**
 * Client routing utilities and SDK factory
 *
 * Provides routing logic and SDK client factory for OpenCode.
 */

import { createOpencodeClient, type OpencodeClient } from "@opencode-ai/sdk/client"
import { getServerForDirectory, getServerForSession, type ServerInfo } from "../discovery/index.js"
import { multiServerSSE } from "../sse/multi-server-sse.js"

export type { OpencodeClient }

/**
 * Default OpenCode server URL
 * Can be overridden via NEXT_PUBLIC_OPENCODE_URL env var
 */
export const OPENCODE_URL = process.env.NEXT_PUBLIC_OPENCODE_URL ?? "http://localhost:4056"

/**
 * Routing context for smart server discovery
 * Inject this from MultiServerSSE or other discovery mechanisms
 */
export interface RoutingContext {
	/** Available servers from discovery */
	servers: ServerInfo[]
	/** Optional session->port cache for session-specific routing */
	sessionToPort?: Map<string, number>
}

/**
 * Get the appropriate server URL for a client request
 *
 * Priority: session-specific routing > directory routing > default server
 *
 * @param directory - Optional project directory for scoping
 * @param sessionId - Optional session ID for session-specific routing
 * @param routingContext - Routing context with servers (optional)
 * @returns Server URL to use
 *
 * @example
 * ```ts
 * // Basic usage (routes to default)
 * const url = getClientUrl()
 * // => "http://localhost:4056"
 *
 * // With directory (routes to directory's server if found)
 * const url = getClientUrl("/path/to/project", undefined, { servers })
 * // => "http://127.0.0.1:4057" (if server found) or default
 *
 * // With session (routes to session's server)
 * const url = getClientUrl("/path/to/project", "ses_123", { servers, sessionToPort })
 * // => routes to cached session server, then directory, then default
 * ```
 */
export function getClientUrl(
	directory?: string,
	sessionId?: string,
	routingContext?: RoutingContext,
): string {
	// No routing context = use default
	if (!routingContext || routingContext.servers.length === 0) {
		return OPENCODE_URL
	}

	// Priority: session-specific routing > directory routing > default
	if (sessionId && directory) {
		return getServerForSession(
			sessionId,
			directory,
			routingContext.servers,
			routingContext.sessionToPort,
		)
	}

	if (directory) {
		return getServerForDirectory(directory, routingContext.servers)
	}

	return OPENCODE_URL
}

/**
 * Create an OpenCode SDK client instance with smart routing
 *
 * Routes to the server that owns the session (if known),
 * otherwise falls back to directory-based routing, then default server.
 *
 * Uses multiServerSSE for routing context (server discovery + session cache).
 *
 * @param directory - Optional project directory for scoping requests
 * @param sessionId - Optional session ID for session-specific routing
 * @returns Configured OpencodeClient with all namespaces
 *
 * @example
 * ```ts
 * const client = createClient()
 * const sessions = await client.session.list()
 * ```
 */
export function createClient(directory?: string, sessionId?: string): OpencodeClient {
	// Priority: session-specific routing > directory routing > default
	let discoveredUrl: string | undefined

	if (sessionId && directory) {
		discoveredUrl = multiServerSSE.getBaseUrlForSession(sessionId, directory)
	} else if (directory) {
		discoveredUrl = multiServerSSE.getBaseUrlForDirectory(directory)
	}

	const serverUrl = discoveredUrl ?? OPENCODE_URL

	return createOpencodeClient({
		baseUrl: serverUrl,
		directory,
	})
}

/**
 * Singleton client for global operations (no directory scoping)
 * Use createClient(directory) for project-scoped operations
 */
export const globalClient = createClient()
