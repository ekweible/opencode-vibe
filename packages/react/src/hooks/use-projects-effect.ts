/**
 * useProjectsEffect - Bridge Effect program to React state
 *
 * Wraps ProjectAtom.list and ProjectAtom.current from @opencode-vibe/core.
 * Provides two separate hooks for list and current project.
 *
 * @example
 * ```tsx
 * function ProjectList() {
 *   const { projects, loading, error, refetch } = useProjectsEffect()
 *
 *   if (loading) return <div>Loading projects...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <ul>
 *       {projects.map(p => <li key={p.worktree}>{p.name || p.worktree}</li>)}
 *     </ul>
 *   )
 * }
 *
 * function CurrentProject() {
 *   const { project, loading, error } = useCurrentProjectEffect()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (!project) return <div>No project selected</div>
 *
 *   return <div>Current: {project.name || project.worktree}</div>
 * }
 * ```
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Effect } from "effect"
import { ProjectAtom, type Project } from "@opencode-vibe/core/atoms"

export interface UseProjectsEffectReturn {
	/** Array of projects */
	projects: Project[]
	/** Loading state */
	loading: boolean
	/** Error if fetch failed */
	error: Error | null
	/** Refetch projects */
	refetch: () => void
}

export interface UseCurrentProjectEffectReturn {
	/** Current project or null */
	project: Project | null
	/** Loading state */
	loading: boolean
	/** Error if fetch failed */
	error: Error | null
	/** Refetch current project */
	refetch: () => void
}

/**
 * Hook to fetch project list using Effect program from core
 *
 * @returns Object with projects, loading, error, and refetch
 */
export function useProjectsEffect(): UseProjectsEffectReturn {
	const [projects, setProjects] = useState<Project[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const fetch = useCallback(() => {
		setLoading(true)
		setError(null)

		Effect.runPromise(ProjectAtom.list())
			.then((data: Project[]) => {
				setProjects(data)
				setError(null)
			})
			.catch((err: unknown) => {
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				setProjects([])
			})
			.finally(() => {
				setLoading(false)
			})
	}, [])

	useEffect(() => {
		fetch()
	}, [fetch])

	return {
		projects,
		loading,
		error,
		refetch: fetch,
	}
}

/**
 * Hook to fetch current project using Effect program from core
 *
 * @returns Object with project, loading, error, and refetch
 */
export function useCurrentProjectEffect(): UseCurrentProjectEffectReturn {
	const [project, setProject] = useState<Project | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const fetch = useCallback(() => {
		setLoading(true)
		setError(null)

		Effect.runPromise(ProjectAtom.current())
			.then((data: Project | null) => {
				setProject(data)
				setError(null)
			})
			.catch((err: unknown) => {
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				setProject(null)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [])

	useEffect(() => {
		fetch()
	}, [fetch])

	return {
		project,
		loading,
		error,
		refetch: fetch,
	}
}

// Re-export type for convenience
export type { Project }
