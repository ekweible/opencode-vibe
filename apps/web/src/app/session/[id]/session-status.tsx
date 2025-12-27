/**
 * SessionStatus - Visual indicator showing when AI is generating a response
 *
 * Shows "Running" when session.status.running === true, "Idle" otherwise.
 * Uses useSessionStatus hook to subscribe to SSE session.status events.
 *
 * @example
 * ```tsx
 * <SessionStatus sessionId="abc-123" />
 * ```
 */

"use client"

import { useSessionStatus } from "@/react/use-session-status"
import { Badge } from "@/components/ui/badge"

export interface SessionStatusProps {
	sessionId: string
}

/**
 * SessionStatus component - displays running/idle indicator
 */
export function SessionStatus({ sessionId }: SessionStatusProps) {
	const { running, isLoading } = useSessionStatus(sessionId)

	if (isLoading) {
		return (
			<Badge variant="outline" className="animate-pulse">
				Loading...
			</Badge>
		)
	}

	return <Badge variant={running ? "default" : "secondary"}>{running ? "Running" : "Idle"}</Badge>
}
