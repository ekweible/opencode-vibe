/**
 * useSessionList - Bridge Effect program to React state
 *
 * Wraps SessionAtom.list from @opencode-vibe/core and manages React state.
 * Provides loading, error, and data states for session list.
 *
 * @example
 * ```tsx
 * function SessionList({ directory }: { directory?: string }) {
 *   const { sessions, loading, error, refetch } = useSessionList({ directory })
 *
 *   if (loading) return <div>Loading sessions...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <ul>
 *       {sessions.map(s => <li key={s.id}>{s.title}</li>)}
 *     </ul>
 *   )
 * }
 * ```
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Effect } from "effect"
import { SessionAtom } from "@opencode-vibe/core/atoms"
import type { Session } from "@opencode-vibe/core/types"

export interface UseSessionListOptions {
	/** Project directory (optional) */
	directory?: string
}

export interface UseSessionListReturn {
	/** Array of sessions, sorted by updated time descending */
	sessions: Session[]
	/** Loading state */
	loading: boolean
	/** Error if fetch failed */
	error: Error | null
	/** Refetch sessions */
	refetch: () => void
}

/**
 * Hook to fetch session list using Effect program from core
 *
 * @param options - Options with optional directory
 * @returns Object with sessions, loading, error, and refetch
 */
export function useSessionList(options: UseSessionListOptions = {}): UseSessionListReturn {
	const [sessions, setSessions] = useState<Session[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const fetch = useCallback(() => {
		setLoading(true)
		setError(null)

		Effect.runPromise(SessionAtom.list(options.directory))
			.then((data: Session[]) => {
				setSessions(data)
				setError(null)
			})
			.catch((err: unknown) => {
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				setSessions([])
			})
			.finally(() => {
				setLoading(false)
			})
	}, [options.directory])

	useEffect(() => {
		fetch()
	}, [fetch])

	return {
		sessions,
		loading,
		error,
		refetch: fetch,
	}
}
