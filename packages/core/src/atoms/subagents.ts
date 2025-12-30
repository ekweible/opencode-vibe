/**
 * Subagents Atom (Effect Program)
 *
 * Pure Effect programs for subagent session management.
 * No React dependencies - usable in any Effect runtime.
 *
 * Provides:
 * - Subagent session registration and tracking
 * - Message and part management for child sessions
 * - UI expansion state for Task tool parts
 * - Parent part ID to session mapping
 *
 * @module atoms/subagents
 */

import { Effect, Ref } from "effect"
import type { Message, Part } from "../types/index.js"

/**
 * Subagent session state
 */
export interface SubagentSession {
	id: string
	parentSessionId: string
	parentPartId: string // The Task tool part that spawned this
	agentName: string
	status: "running" | "completed" | "error"
	messages: Message[]
	parts: Record<string, Part[]> // By message ID
}

/**
 * Subagent store state
 */
export interface SubagentState {
	sessions: Record<string, SubagentSession>
	partToSession: Record<string, string>
	expanded: Set<string>
}

/**
 * Subagent Atom
 *
 * Pure Effect programs for subagent session management.
 * Uses Effect.Ref for mutable state management.
 */
export const SubagentAtom = {
	/**
	 * Create a new subagent state
	 *
	 * @returns Effect that yields a Ref to the subagent state
	 *
	 * @example
	 * ```typescript
	 * const stateRef = await Effect.runPromise(SubagentAtom.create())
	 * ```
	 */
	create: (): Effect.Effect<Ref.Ref<SubagentState>, never> =>
		Ref.make<SubagentState>({
			sessions: {},
			partToSession: {},
			expanded: new Set(),
		}),

	/**
	 * Register a new subagent session
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param childSessionId - ID of the child session
	 * @param parentSessionId - ID of the parent session
	 * @param parentPartId - ID of the parent part (Task tool part)
	 * @param agentName - Name of the agent
	 * @returns Effect that registers the subagent
	 *
	 * @example
	 * ```typescript
	 * await Effect.runPromise(
	 *   SubagentAtom.registerSubagent(stateRef, "child-123", "parent-456", "part-789", "TestAgent")
	 * )
	 * ```
	 */
	registerSubagent: (
		stateRef: Ref.Ref<SubagentState>,
		childSessionId: string,
		parentSessionId: string,
		parentPartId: string,
		agentName: string,
	): Effect.Effect<void, never> =>
		Ref.update(stateRef, (state) => {
			const newSession: SubagentSession = {
				id: childSessionId,
				parentSessionId,
				parentPartId,
				agentName,
				status: "running",
				messages: [],
				parts: {},
			}

			const newExpanded = new Set(state.expanded)
			if (parentPartId) {
				newExpanded.add(parentPartId)
			}

			return {
				sessions: {
					...state.sessions,
					[childSessionId]: newSession,
				},
				partToSession: {
					...state.partToSession,
					...(parentPartId ? { [parentPartId]: childSessionId } : {}),
				},
				expanded: newExpanded,
			}
		}),

	/**
	 * Update parent part ID for a session
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param childSessionId - ID of the child session
	 * @param parentPartId - New parent part ID
	 * @returns Effect that updates the parent part ID
	 */
	updateParentPartId: (
		stateRef: Ref.Ref<SubagentState>,
		childSessionId: string,
		parentPartId: string,
	): Effect.Effect<void, never> =>
		Ref.update(stateRef, (state) => {
			const session = state.sessions[childSessionId]
			if (!session) return state

			const newExpanded = new Set(state.expanded)
			if (session.status === "running") {
				newExpanded.add(parentPartId)
			}

			return {
				sessions: {
					...state.sessions,
					[childSessionId]: {
						...session,
						parentPartId,
					},
				},
				partToSession: {
					...state.partToSession,
					[parentPartId]: childSessionId,
				},
				expanded: newExpanded,
			}
		}),

	/**
	 * Add a message to a session
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param sessionId - ID of the session
	 * @param message - Message to add
	 * @returns Effect that adds the message
	 */
	addMessage: (
		stateRef: Ref.Ref<SubagentState>,
		sessionId: string,
		message: Message,
	): Effect.Effect<void, never> =>
		Ref.update(stateRef, (state) => {
			const session = state.sessions[sessionId]
			if (!session) return state

			return {
				...state,
				sessions: {
					...state.sessions,
					[sessionId]: {
						...session,
						messages: [...session.messages, message],
						parts: {
							...session.parts,
							[message.id]: [],
						},
					},
				},
			}
		}),

	/**
	 * Update a message in a session
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param sessionId - ID of the session
	 * @param message - Updated message
	 * @returns Effect that updates the message
	 */
	updateMessage: (
		stateRef: Ref.Ref<SubagentState>,
		sessionId: string,
		message: Message,
	): Effect.Effect<void, never> =>
		Ref.update(stateRef, (state) => {
			const session = state.sessions[sessionId]
			if (!session) return state

			const idx = session.messages.findIndex((m) => m.id === message.id)
			if (idx === -1) return state

			const messages = [...session.messages]
			messages[idx] = message

			return {
				...state,
				sessions: {
					...state.sessions,
					[sessionId]: {
						...session,
						messages,
					},
				},
			}
		}),

	/**
	 * Add a part to a message
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param sessionId - ID of the session
	 * @param messageId - ID of the message
	 * @param part - Part to add
	 * @returns Effect that adds the part
	 */
	addPart: (
		stateRef: Ref.Ref<SubagentState>,
		sessionId: string,
		messageId: string,
		part: Part,
	): Effect.Effect<void, never> =>
		Ref.update(stateRef, (state) => {
			const session = state.sessions[sessionId]
			if (!session) return state

			const currentParts = session.parts[messageId] || []

			return {
				...state,
				sessions: {
					...state.sessions,
					[sessionId]: {
						...session,
						parts: {
							...session.parts,
							[messageId]: [...currentParts, part],
						},
					},
				},
			}
		}),

	/**
	 * Update a part in a message
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param sessionId - ID of the session
	 * @param messageId - ID of the message
	 * @param part - Updated part
	 * @returns Effect that updates the part
	 */
	updatePart: (
		stateRef: Ref.Ref<SubagentState>,
		sessionId: string,
		messageId: string,
		part: Part,
	): Effect.Effect<void, never> =>
		Ref.update(stateRef, (state) => {
			const session = state.sessions[sessionId]
			if (!session || !session.parts[messageId]) return state

			const parts = session.parts[messageId]
			const idx = parts.findIndex((p) => p.id === part.id)
			if (idx === -1) return state

			const updatedParts = [...parts]
			updatedParts[idx] = part

			return {
				...state,
				sessions: {
					...state.sessions,
					[sessionId]: {
						...session,
						parts: {
							...session.parts,
							[messageId]: updatedParts,
						},
					},
				},
			}
		}),

	/**
	 * Set the status of a session
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param sessionId - ID of the session
	 * @param status - New status
	 * @returns Effect that sets the status
	 */
	setStatus: (
		stateRef: Ref.Ref<SubagentState>,
		sessionId: string,
		status: SubagentSession["status"],
	): Effect.Effect<void, never> =>
		Ref.update(stateRef, (state) => {
			const session = state.sessions[sessionId]
			if (!session) return state

			return {
				...state,
				sessions: {
					...state.sessions,
					[sessionId]: {
						...session,
						status,
					},
				},
			}
		}),

	/**
	 * Toggle expansion state of a part
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param partId - ID of the part
	 * @returns Effect that toggles the expansion state
	 */
	toggleExpanded: (stateRef: Ref.Ref<SubagentState>, partId: string): Effect.Effect<void, never> =>
		Ref.update(stateRef, (state) => {
			const newExpanded = new Set(state.expanded)
			if (newExpanded.has(partId)) {
				newExpanded.delete(partId)
			} else {
				newExpanded.add(partId)
			}

			return {
				...state,
				expanded: newExpanded,
			}
		}),

	/**
	 * Check if a part is expanded
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param partId - ID of the part
	 * @returns Effect that yields whether the part is expanded
	 */
	isExpanded: (stateRef: Ref.Ref<SubagentState>, partId: string): Effect.Effect<boolean, never> =>
		Ref.get(stateRef).pipe(Effect.map((state) => state.expanded.has(partId))),

	/**
	 * Get a session by parent part ID
	 *
	 * @param stateRef - Reference to the subagent state
	 * @param partId - ID of the parent part
	 * @returns Effect that yields the session or undefined
	 */
	getByParentPart: (
		stateRef: Ref.Ref<SubagentState>,
		partId: string,
	): Effect.Effect<SubagentSession | undefined, never> =>
		Ref.get(stateRef).pipe(
			Effect.map((state) => {
				const sessionId = state.partToSession[partId]
				return sessionId ? state.sessions[sessionId] : undefined
			}),
		),

	/**
	 * Get all sessions
	 *
	 * @param stateRef - Reference to the subagent state
	 * @returns Effect that yields all sessions
	 */
	getSessions: (
		stateRef: Ref.Ref<SubagentState>,
	): Effect.Effect<Record<string, SubagentSession>, never> =>
		Ref.get(stateRef).pipe(Effect.map((state) => state.sessions)),

	/**
	 * Get the part to session mapping
	 *
	 * @param stateRef - Reference to the subagent state
	 * @returns Effect that yields the part to session mapping
	 */
	getPartToSession: (
		stateRef: Ref.Ref<SubagentState>,
	): Effect.Effect<Record<string, string>, never> =>
		Ref.get(stateRef).pipe(Effect.map((state) => state.partToSession)),
}
