/**
 * useServersEffect - Bridge Effect program to React state
 *
 * Wraps ServerAtom.discover and ServerAtom.currentServer from @opencode-vibe/core.
 * Provides hooks for server discovery and current server selection.
 *
 * @example
 * ```tsx
 * function ServerList() {
 *   const { servers, loading, error, refetch } = useServersEffect()
 *
 *   if (loading) return <div>Discovering servers...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <ul>
 *       {servers.map(s => (
 *         <li key={`${s.port}-${s.directory}`}>
 *           {s.url} - {s.directory || '(no directory)'}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 *
 * function CurrentServer() {
 *   const { server, loading, error } = useCurrentServerEffect()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (!server) return <div>No server found</div>
 *
 *   return <div>Connected: {server.url}</div>
 * }
 * ```
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Effect } from "effect"
import { ServerAtom } from "@opencode-vibe/core/atoms"
import type { ServerInfo } from "@opencode-vibe/core/discovery"

export interface UseServersEffectReturn {
	/** Array of discovered servers (always includes default) */
	servers: ServerInfo[]
	/** Loading state */
	loading: boolean
	/** Error if fetch failed (should never happen, falls back to default) */
	error: Error | null
	/** Refetch servers */
	refetch: () => void
}

export interface UseCurrentServerEffectReturn {
	/** Current best server (never null, falls back to default) */
	server: ServerInfo | null
	/** Loading state */
	loading: boolean
	/** Error if fetch failed (should never happen) */
	error: Error | null
	/** Refetch current server */
	refetch: () => void
}

/**
 * Hook to discover OpenCode servers using Effect program from core
 *
 * Note: ServerAtom.discover() never fails - it falls back to localhost:4056
 *
 * @returns Object with servers, loading, error, and refetch
 */
export function useServersEffect(): UseServersEffectReturn {
	const [servers, setServers] = useState<ServerInfo[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const fetch = useCallback(() => {
		setLoading(true)
		setError(null)

		Effect.runPromise(ServerAtom.discover())
			.then((data: ServerInfo[]) => {
				setServers(data)
				setError(null)
			})
			.catch((err: unknown) => {
				// This should never happen (ServerAtom.discover() never fails)
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				setServers([])
			})
			.finally(() => {
				setLoading(false)
			})
	}, [])

	useEffect(() => {
		fetch()
	}, [fetch])

	return {
		servers,
		loading,
		error,
		refetch: fetch,
	}
}

/**
 * Hook to get current best server using Effect program from core
 *
 * Uses heuristic:
 * 1. First server with non-empty directory
 * 2. Otherwise, first server in list
 * 3. Falls back to localhost:4056
 *
 * @returns Object with server, loading, error, and refetch
 */
export function useCurrentServerEffect(): UseCurrentServerEffectReturn {
	const [server, setServer] = useState<ServerInfo | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const fetch = useCallback(() => {
		setLoading(true)
		setError(null)

		Effect.runPromise(ServerAtom.currentServer())
			.then((data: ServerInfo) => {
				setServer(data)
				setError(null)
			})
			.catch((err: unknown) => {
				// This should never happen (ServerAtom.currentServer() never fails)
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				setServer(null)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [])

	useEffect(() => {
		fetch()
	}, [fetch])

	return {
		server,
		loading,
		error,
		refetch: fetch,
	}
}

// Re-export type for convenience
export type { ServerInfo }
