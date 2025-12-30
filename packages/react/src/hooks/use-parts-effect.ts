/**
 * usePartsEffect - Bridge Effect program to React state
 *
 * Wraps PartAtom.list from @opencode-vibe/core and manages React state.
 * Provides loading, error, and data states for part list.
 *
 * Note: Named `usePartsEffect` to avoid conflict with existing hooks
 * during migration period.
 *
 * @example
 * ```tsx
 * function PartList({ sessionId }: { sessionId: string }) {
 *   const { parts, loading, error, refetch } = usePartsEffect({ sessionId })
 *
 *   if (loading) return <div>Loading parts...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <ul>
 *       {parts.map(p => <li key={p.id}>{p.type}</li>)}
 *     </ul>
 *   )
 * }
 * ```
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Effect } from "effect"
import { PartAtom } from "@opencode-vibe/core/atoms"
import type { Part } from "@opencode-vibe/core/types"

export interface UsePartsEffectOptions {
	/** Session ID to fetch parts for */
	sessionId: string
	/** Project directory (optional) */
	directory?: string
}

export interface UsePartsEffectReturn {
	/** Array of parts, sorted by ID */
	parts: Part[]
	/** Loading state */
	loading: boolean
	/** Error if fetch failed */
	error: Error | null
	/** Refetch parts */
	refetch: () => void
}

/**
 * Hook to fetch part list using Effect program from core
 *
 * @param options - Options with sessionId and optional directory
 * @returns Object with parts, loading, error, and refetch
 */
export function usePartsEffect(options: UsePartsEffectOptions): UsePartsEffectReturn {
	const [parts, setParts] = useState<Part[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const fetch = useCallback(() => {
		setLoading(true)
		setError(null)

		Effect.runPromise(PartAtom.list(options.sessionId, options.directory))
			.then((data: Part[]) => {
				setParts(data)
				setError(null)
			})
			.catch((err: unknown) => {
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				setParts([])
			})
			.finally(() => {
				setLoading(false)
			})
	}, [options.sessionId, options.directory])

	useEffect(() => {
		fetch()
	}, [fetch])

	return {
		parts,
		loading,
		error,
		refetch: fetch,
	}
}
