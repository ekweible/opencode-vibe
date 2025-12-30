/**
 * useParts - Bridge Promise API to React state with SSE updates
 *
 * Wraps parts.list from @opencode-vibe/core/api and manages React state.
 * Subscribes to SSE events for real-time updates when parts are created/updated.
 *
 * @example
 * ```tsx
 * function PartList({ sessionId }: { sessionId: string }) {
 *   const { parts, loading, error, refetch } = useParts({ sessionId })
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

import { useState, useEffect, useCallback, useRef } from "react"
import { parts } from "@opencode-vibe/core/api"
import { multiServerSSE } from "@opencode-vibe/core/sse"
import { Binary } from "@opencode-vibe/core/utils"
import type { Part } from "@opencode-vibe/core/types"

export interface UsePartsOptions {
	/** Session ID to fetch parts for */
	sessionId: string
	/** Project directory (optional) */
	directory?: string
	/** Initial data from server (hydration) - skips initial fetch if provided */
	initialData?: Part[]
}

export interface UsePartsReturn {
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
 * Hook to fetch part list with real-time SSE updates
 *
 * @param options - Options with sessionId and optional directory
 * @returns Object with parts, loading, error, and refetch
 */
export function useParts(options: UsePartsOptions): UsePartsReturn {
	// Hydrate from server data if provided, otherwise start empty
	const [partList, setPartList] = useState<Part[]>(options.initialData ?? [])
	// Skip loading state if we have initial data (already hydrated)
	const [loading, setLoading] = useState(!options.initialData)
	const [error, setError] = useState<Error | null>(null)

	// Track sessionId in ref to avoid stale closures in SSE callback
	const sessionIdRef = useRef(options.sessionId)
	sessionIdRef.current = options.sessionId

	// Track if we've hydrated to avoid re-fetching on mount
	const hydratedRef = useRef(!!options.initialData)

	// Track if fetch is in progress to coordinate with SSE
	const fetchInProgressRef = useRef(false)

	const fetch = useCallback(() => {
		fetchInProgressRef.current = true
		setLoading(true)
		setError(null)

		parts
			.list(options.sessionId, options.directory)
			.then((data: Part[]) => {
				setPartList(data)
				setError(null)
			})
			.catch((err: unknown) => {
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				setPartList([])
			})
			.finally(() => {
				fetchInProgressRef.current = false
				setLoading(false)
			})
	}, [options.sessionId, options.directory])

	// Initial fetch - skip if hydrated from server
	useEffect(() => {
		if (hydratedRef.current) {
			// Already hydrated, don't fetch again
			hydratedRef.current = false // Allow future refetches
			return
		}
		fetch()
	}, [fetch])

	// Subscribe to SSE events for real-time updates
	useEffect(() => {
		const unsubscribe = multiServerSSE.onEvent((event) => {
			// Skip SSE updates while fetch is in progress to avoid race conditions
			if (fetchInProgressRef.current) return

			const { type, properties } = event.payload

			// Handle message.part.updated events
			if (type !== "message.part.updated") return

			const partData = properties.part as (Part & { sessionID?: string }) | undefined
			if (!partData) return

			// Filter by session - parts include sessionID
			if (partData.sessionID && partData.sessionID !== sessionIdRef.current) return

			setPartList((prev) => {
				// Use binary insert/update for O(log n) performance
				const { found, index } = Binary.search(prev, partData.id, (p) => p.id)
				if (found) {
					// Update existing part
					const updated = [...prev]
					updated[index] = partData
					return updated
				}
				// Insert new part in sorted position
				return Binary.insert(prev, partData, (p) => p.id)
			})
		})

		return unsubscribe
	}, []) // Empty deps - callback uses refs

	return {
		parts: partList,
		loading,
		error,
		refetch: fetch,
	}
}
