/**
 * useMessagesEffect - Bridge Effect program to React state
 *
 * Wraps MessageAtom.list from @opencode-vibe/core and manages React state.
 * Provides loading, error, and data states for message list.
 *
 * Note: Named `useMessagesEffect` to avoid conflict with existing `useMessages` hook
 * during migration period. Once migration is complete, this will replace `useMessages`.
 *
 * @example
 * ```tsx
 * function MessageList({ sessionId }: { sessionId: string }) {
 *   const { messages, loading, error, refetch } = useMessagesEffect({ sessionId })
 *
 *   if (loading) return <div>Loading messages...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <ul>
 *       {messages.map(m => <li key={m.id}>{m.role}: {m.id}</li>)}
 *     </ul>
 *   )
 * }
 * ```
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Effect } from "effect"
import { MessageAtom } from "@opencode-vibe/core/atoms"
import type { Message } from "@opencode-vibe/core/types"

export interface UseMessagesEffectOptions {
	/** Session ID to fetch messages for */
	sessionId: string
	/** Project directory (optional) */
	directory?: string
}

export interface UseMessagesEffectReturn {
	/** Array of messages, sorted by ID */
	messages: Message[]
	/** Loading state */
	loading: boolean
	/** Error if fetch failed */
	error: Error | null
	/** Refetch messages */
	refetch: () => void
}

/**
 * Hook to fetch message list using Effect program from core
 *
 * @param options - Options with sessionId and optional directory
 * @returns Object with messages, loading, error, and refetch
 */
export function useMessagesEffect(options: UseMessagesEffectOptions): UseMessagesEffectReturn {
	const [messages, setMessages] = useState<Message[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const fetch = useCallback(() => {
		setLoading(true)
		setError(null)

		Effect.runPromise(MessageAtom.list(options.sessionId, options.directory))
			.then((data: Message[]) => {
				setMessages(data)
				setError(null)
			})
			.catch((err: unknown) => {
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				setMessages([])
			})
			.finally(() => {
				setLoading(false)
			})
	}, [options.sessionId, options.directory])

	useEffect(() => {
		fetch()
	}, [fetch])

	return {
		messages,
		loading,
		error,
		refetch: fetch,
	}
}
