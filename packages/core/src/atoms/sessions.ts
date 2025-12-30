/**
 * Sessions Atom - Pure Effect Programs
 *
 * Framework-agnostic Effect programs for session management.
 * Consumers (React hooks) should use Effect.runPromise to execute these programs.
 *
 * Provides:
 * - Session list fetching via SDK
 * - Session get by ID
 * - Sorted by updated time descending (newest first)
 *
 * @module atoms/sessions
 */

import { Effect } from "effect"
import { createClient } from "../client/index.js"
import type { Session } from "../types/index.js"

/**
 * Session atom namespace with Effect programs
 */
export const SessionAtom = {
	/**
	 * Fetch all sessions for a directory, sorted by updated time descending
	 *
	 * @param directory - Project directory (optional)
	 * @returns Effect program that yields Session[] or Error
	 *
	 * @example
	 * ```typescript
	 * import { Effect } from "effect"
	 * import { SessionAtom } from "@opencode/core/atoms"
	 *
	 * // Execute the Effect program
	 * const sessions = await Effect.runPromise(SessionAtom.list("/my/project"))
	 *
	 * // Or compose with other Effects
	 * const program = Effect.gen(function* () {
	 *   const sessions = yield* SessionAtom.list("/my/project")
	 *   return sessions.filter(s => s.title.includes("auth"))
	 * })
	 * ```
	 */
	list: (directory?: string): Effect.Effect<Session[], Error> =>
		Effect.gen(function* () {
			const client = createClient(directory)

			const response = yield* Effect.tryPromise({
				try: () => client.session.list(),
				catch: (error) =>
					new Error(
						`Failed to fetch sessions: ${error instanceof Error ? error.message : String(error)}`,
					),
			})

			// Sort by updated time descending (newest first)
			const sessions = response.data || []
			return sessions.sort((a, b) => b.time.updated - a.time.updated)
		}),

	/**
	 * Fetch a single session by ID
	 *
	 * @param id - Session ID
	 * @param directory - Project directory (optional)
	 * @returns Effect program that yields Session | null or Error
	 *
	 * @example
	 * ```typescript
	 * const session = await Effect.runPromise(SessionAtom.get("ses_123"))
	 * if (session) {
	 *   console.log(session.title)
	 * }
	 * ```
	 */
	get: (id: string, directory?: string): Effect.Effect<Session | null, Error> =>
		Effect.gen(function* () {
			const client = createClient(directory)

			const response = yield* Effect.tryPromise({
				try: () => client.session.get({ path: { id } }),
				catch: (error) =>
					new Error(
						`Failed to fetch session: ${error instanceof Error ? error.message : String(error)}`,
					),
			})

			return response.data ?? null
		}),
}

// Export types for consumers
export type { Session }
