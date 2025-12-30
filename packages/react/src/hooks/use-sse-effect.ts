/**
 * useSSEEffect - Bridge Effect.Stream to React state
 *
 * Wraps SSEAtom.connect from @opencode-vibe/core and manages React state.
 * Uses Effect.Stream for SSE event streaming with automatic reconnection.
 *
 * Note: Named `useSSEEffect` to avoid conflict with existing `useSSE` hook
 * during migration period.
 *
 * @example
 * ```tsx
 * function EventMonitor({ url }: { url: string }) {
 *   const { events, connected, error } = useSSEEffect({ url })
 *
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!connected) return <div>Connecting...</div>
 *
 *   return (
 *     <div>
 *       <div>Connected! Received {events.length} events</div>
 *       <ul>
 *         {events.slice(-10).map((e, i) => (
 *           <li key={i}>{e.type} - {e.directory}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */

"use client"

import { useState, useEffect } from "react"
import { Effect, Stream, Fiber, Duration } from "effect"
import { SSEAtom, type SSEConfig } from "@opencode-vibe/core/atoms"
import type { GlobalEvent } from "@opencode-ai/sdk/client"

export interface UseSSEEffectOptions {
	/** Base URL for SSE endpoint */
	url: string
	/** Heartbeat timeout (default: 60s) */
	heartbeatTimeout?: number
}

export interface UseSSEEffectReturn {
	/** Array of received events */
	events: GlobalEvent[]
	/** Connection state */
	connected: boolean
	/** Error if connection failed */
	error: Error | null
}

/**
 * Hook to connect to SSE stream using Effect program from core
 *
 * @param options - Options with url and optional heartbeatTimeout
 * @returns Object with events, connected state, and error
 */
export function useSSEEffect(options: UseSSEEffectOptions): UseSSEEffectReturn {
	const [events, setEvents] = useState<GlobalEvent[]>([])
	const [connected, setConnected] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		// Convert heartbeat timeout to Duration if provided
		const config: SSEConfig = {
			url: options.url,
			...(options.heartbeatTimeout
				? { heartbeatTimeout: Duration.millis(options.heartbeatTimeout) }
				: {}),
		}

		// Create the stream
		const stream = SSEAtom.connect(config)

		// Run the stream and collect events
		const fiber = Effect.runFork(
			Stream.runForEach(stream, (event: GlobalEvent) =>
				Effect.sync(() => {
					setEvents((prev) => [...prev, event])
					if (!connected) {
						setConnected(true)
						setError(null)
					}
				}),
			).pipe(
				// Handle stream errors
				Effect.catchAll((err) =>
					Effect.sync(() => {
						const error = err instanceof Error ? err : new Error(String(err))
						setError(error)
						setConnected(false)
					}),
				),
			),
		)

		// Cleanup on unmount
		return () => {
			Effect.runSync(Fiber.interrupt(fiber))
			setConnected(false)
		}
	}, [options.url, options.heartbeatTimeout, connected])

	return {
		events,
		connected,
		error,
	}
}
