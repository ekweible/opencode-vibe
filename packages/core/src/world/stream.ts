/**
 * World Stream - Reactive SSE consumer with async iterator
 *
 * Creates a handle for subscribing to world state changes via SSE.
 * Provides sync subscription API and async iterator for streaming.
 *
 * SELF-CONTAINED: Uses WorldSSE for discovery and connections.
 * No dependencies on browser APIs or proxy routes.
 */

import type { WorldState, WorldStreamConfig, WorldStreamHandle } from "./types.js"
import { WorldStore } from "./atoms.js"
import { WorldSSE } from "./sse.js"
import { discoverServers } from "../discovery/server-discovery.js"

/**
 * Create a world stream from SSE events
 *
 * @example
 * ```typescript
 * // Auto-discover servers
 * const stream = createWorldStream()
 *
 * // Or explicit baseUrl
 * const stream = createWorldStream({ baseUrl: "http://localhost:1999" })
 *
 * // Subscribe API
 * const unsub = stream.subscribe((world) => console.log(world))
 *
 * // Async iterator API
 * for await (const world of stream) {
 *   console.log(world.sessions.length)
 * }
 *
 * await stream.dispose()
 * ```
 */
export function createWorldStream(config: WorldStreamConfig = {}): WorldStreamHandle {
	const { baseUrl, autoReconnect = true, onEvent } = config

	const store = new WorldStore()

	// Create SSE instance (will be started after discovery completes)
	let sse: WorldSSE | null = null

	// If baseUrl provided, start immediately
	if (baseUrl) {
		sse = new WorldSSE(store, {
			serverUrl: baseUrl,
			autoReconnect,
			onEvent,
		})
		sse.start()
	} else {
		// No baseUrl - run discovery first
		store.setConnectionStatus("connecting")
		discoverServers()
			.then((servers) => {
				if (servers.length === 0) {
					// No servers found
					store.setConnectionStatus("error")
					return
				}
				// Use first server (sorted by port in discovery)
				const firstServer = servers[0]
				const discoveredUrl = `http://127.0.0.1:${firstServer.port}`

				// Create and start SSE with discovered URL
				sse = new WorldSSE(store, {
					serverUrl: discoveredUrl,
					autoReconnect,
					onEvent,
				})
				sse.start()
			})
			.catch(() => {
				// Discovery failed
				store.setConnectionStatus("error")
			})
	}

	/**
	 * Subscribe to world state changes
	 */
	function subscribe(callback: (state: WorldState) => void): () => void {
		return store.subscribe(callback)
	}

	/**
	 * Get current world state snapshot
	 */
	async function getSnapshot(): Promise<WorldState> {
		return store.getState()
	}

	/**
	 * Async iterator for world state changes
	 */
	async function* asyncIterator(): AsyncIterableIterator<WorldState> {
		// Yield current state immediately
		yield store.getState()

		// Then yield on every change
		const queue: WorldState[] = []
		let resolveNext: ((state: WorldState) => void) | null = null

		const unsubscribe = store.subscribe((state) => {
			if (resolveNext) {
				resolveNext(state)
				resolveNext = null
			} else {
				queue.push(state)
			}
		})

		try {
			while (true) {
				if (queue.length > 0) {
					yield queue.shift()!
				} else {
					// Wait for next state
					const state = await new Promise<WorldState>((resolve) => {
						resolveNext = resolve
					})
					yield state
				}
			}
		} finally {
			unsubscribe()
		}
	}

	/**
	 * Clean up resources
	 */
	async function dispose(): Promise<void> {
		sse?.stop()
	}

	return {
		subscribe,
		getSnapshot,
		[Symbol.asyncIterator]: asyncIterator,
		dispose,
	}
}

// Re-export types for convenience
export type { WorldState, WorldStreamConfig, WorldStreamHandle } from "./types.js"

// Re-export discovery (Promise-based API)
export { discoverServers } from "../discovery/server-discovery.js"
export type { DiscoveredServer } from "../discovery/server-discovery.js"
