/**
 * useSessionStatus - Hook to track session running/idle status
 *
 * Subscribes to session.status SSE events and returns the current running state.
 * Used to show a visual indicator when AI is generating a response.
 *
 * @example
 * ```tsx
 * function SessionIndicator({ sessionId }: { sessionId: string }) {
 *   const { running, isLoading } = useSessionStatus(sessionId)
 *
 *   if (isLoading) return <Spinner />
 *   return running ? <Badge>Running</Badge> : <Badge>Idle</Badge>
 * }
 * ```
 */

import { useState, useEffect } from "react"
import { useSSE } from "./use-sse"
import type { GlobalEvent } from "@opencode-ai/sdk/client"

/**
 * Session status state
 */
export interface SessionStatus {
	/** Whether the session is currently running (AI generating response) */
	running: boolean
	/** Whether we're still waiting for the first status event */
	isLoading: boolean
}

/**
 * useSessionStatus - Subscribe to session status events
 *
 * @param sessionId - The session ID to track
 * @returns SessionStatus with running and isLoading states
 */
export function useSessionStatus(sessionId: string): SessionStatus {
	const [running, setRunning] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const { subscribe } = useSSE()

	// Reset state when sessionId changes
	useEffect(() => {
		setRunning(false)
		setIsLoading(true)
	}, [sessionId])

	// Subscribe to status events
	useEffect(() => {
		const unsubscribe = subscribe("session.status", (event: GlobalEvent) => {
			const properties = (event.payload as any)?.properties

			// Ignore malformed events
			if (!properties) return

			// Filter by sessionID
			if (properties.sessionID !== sessionId) return

			// Extract status.running
			const status = properties.status
			if (status && typeof status.running === "boolean") {
				setRunning(status.running)
				setIsLoading(false)
			}
		})

		return unsubscribe
	}, [sessionId, subscribe])

	return { running, isLoading }
}
