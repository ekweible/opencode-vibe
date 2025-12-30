/**
 * useSubagentsEffect - Bridge Effect.Ref to React state
 *
 * Wraps SubagentAtom from @opencode-vibe/core and manages React state.
 * Provides a stateful store for subagent sessions using Effect.Ref.
 *
 * Note: This is a more complex hook because SubagentAtom uses Effect.Ref
 * for mutable state management. We expose imperative actions for updating
 * the state while keeping React in sync.
 *
 * @example
 * ```tsx
 * function SubagentMonitor() {
 *   const { sessions, partToSession, expanded, actions } = useSubagentsEffect()
 *
 *   // Register a subagent when Task tool spawns one
 *   const handleTaskSpawn = (childId: string, parentId: string, partId: string) => {
 *     actions.registerSubagent(childId, parentId, partId, "Explorer")
 *   }
 *
 *   // Toggle expansion state
 *   const handleToggle = (partId: string) => {
 *     actions.toggleExpanded(partId)
 *   }
 *
 *   return (
 *     <div>
 *       <h3>Subagent Sessions</h3>
 *       {Object.values(sessions).map(s => (
 *         <div key={s.id}>{s.agentName} - {s.status}</div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import { Effect, Ref } from "effect"
import { SubagentAtom, type SubagentSession, type SubagentState } from "@opencode-vibe/core/atoms"
import type { Message, Part } from "@opencode-vibe/core/types"

export interface UseSubagentsEffectReturn {
	/** All subagent sessions by ID */
	sessions: Record<string, SubagentSession>
	/** Mapping from parent part ID to session ID */
	partToSession: Record<string, string>
	/** Set of expanded part IDs */
	expanded: Set<string>
	/** Imperative actions for updating subagent state */
	actions: {
		registerSubagent: (
			childSessionId: string,
			parentSessionId: string,
			parentPartId: string,
			agentName: string,
		) => void
		updateParentPartId: (childSessionId: string, parentPartId: string) => void
		addMessage: (sessionId: string, message: Message) => void
		updateMessage: (sessionId: string, message: Message) => void
		addPart: (sessionId: string, messageId: string, part: Part) => void
		updatePart: (sessionId: string, messageId: string, part: Part) => void
		setStatus: (sessionId: string, status: SubagentSession["status"]) => void
		toggleExpanded: (partId: string) => void
		getByParentPart: (partId: string) => SubagentSession | undefined
	}
}

/**
 * Hook to manage subagent sessions using Effect.Ref from core
 *
 * Creates an Effect.Ref-based store and exposes imperative actions
 * for updating state while keeping React in sync.
 *
 * @returns Object with sessions, partToSession, expanded, and actions
 */
export function useSubagentsEffect(): UseSubagentsEffectReturn {
	const [state, setState] = useState<SubagentState>({
		sessions: {},
		partToSession: {},
		expanded: new Set(),
	})

	const [stateRef, setStateRef] = useState<Ref.Ref<SubagentState> | null>(null)

	// Initialize the Effect.Ref on mount
	useEffect(() => {
		Effect.runPromise(SubagentAtom.create()).then((ref) => {
			setStateRef(ref)
		})
	}, [])

	// Sync React state with Effect.Ref whenever actions are called
	const syncState = useMemo(
		() => () => {
			if (!stateRef) return
			Effect.runPromise(Ref.get(stateRef)).then((newState) => {
				setState(newState)
			})
		},
		[stateRef],
	)

	// Imperative actions that run Effect programs and sync state
	const actions = useMemo(() => {
		if (!stateRef) {
			// Return no-op actions until stateRef is initialized
			return {
				registerSubagent: () => {},
				updateParentPartId: () => {},
				addMessage: () => {},
				updateMessage: () => {},
				addPart: () => {},
				updatePart: () => {},
				setStatus: () => {},
				toggleExpanded: () => {},
				getByParentPart: () => undefined,
			}
		}

		return {
			registerSubagent: (
				childSessionId: string,
				parentSessionId: string,
				parentPartId: string,
				agentName: string,
			) => {
				Effect.runPromise(
					SubagentAtom.registerSubagent(
						stateRef,
						childSessionId,
						parentSessionId,
						parentPartId,
						agentName,
					),
				).then(syncState)
			},
			updateParentPartId: (childSessionId: string, parentPartId: string) => {
				Effect.runPromise(
					SubagentAtom.updateParentPartId(stateRef, childSessionId, parentPartId),
				).then(syncState)
			},
			addMessage: (sessionId: string, message: Message) => {
				Effect.runPromise(SubagentAtom.addMessage(stateRef, sessionId, message)).then(syncState)
			},
			updateMessage: (sessionId: string, message: Message) => {
				Effect.runPromise(SubagentAtom.updateMessage(stateRef, sessionId, message)).then(syncState)
			},
			addPart: (sessionId: string, messageId: string, part: Part) => {
				Effect.runPromise(SubagentAtom.addPart(stateRef, sessionId, messageId, part)).then(
					syncState,
				)
			},
			updatePart: (sessionId: string, messageId: string, part: Part) => {
				Effect.runPromise(SubagentAtom.updatePart(stateRef, sessionId, messageId, part)).then(
					syncState,
				)
			},
			setStatus: (sessionId: string, status: SubagentSession["status"]) => {
				Effect.runPromise(SubagentAtom.setStatus(stateRef, sessionId, status)).then(syncState)
			},
			toggleExpanded: (partId: string) => {
				Effect.runPromise(SubagentAtom.toggleExpanded(stateRef, partId)).then(syncState)
			},
			getByParentPart: (partId: string): SubagentSession | undefined => {
				// Synchronous getter - reads from React state
				const sessionId = state.partToSession[partId]
				return sessionId ? state.sessions[sessionId] : undefined
			},
		}
	}, [stateRef, syncState, state])

	return {
		sessions: state.sessions,
		partToSession: state.partToSession,
		expanded: state.expanded,
		actions,
	}
}

// Re-export types for convenience
export type { SubagentSession, SubagentState }
