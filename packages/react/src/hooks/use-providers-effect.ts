/**
 * useProvidersEffect - Bridge Effect program to React state
 *
 * Wraps ProviderAtom.list from @opencode-vibe/core and manages React state.
 * Provides loading, error, and data states for provider list.
 *
 * Note: Named `useProvidersEffect` to avoid conflict with existing `useProviders` hook
 * during migration period. Once migration is complete, this will replace `useProviders`.
 *
 * @example
 * ```tsx
 * function ProviderList() {
 *   const { providers, loading, error, refetch } = useProvidersEffect()
 *
 *   if (loading) return <div>Loading providers...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <select>
 *       {providers.map(provider =>
 *         provider.models.map(model => (
 *           <option key={`${provider.id}-${model.id}`}>
 *             {provider.name} - {model.name}
 *           </option>
 *         ))
 *       )}
 *     </select>
 *   )
 * }
 * ```
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Effect } from "effect"
import { ProviderAtom, type Provider, type Model } from "@opencode-vibe/core/atoms"

export interface UseProvidersEffectReturn {
	/** Array of providers with their models */
	providers: Provider[]
	/** Loading state */
	loading: boolean
	/** Error if fetch failed */
	error: Error | null
	/** Refetch providers */
	refetch: () => void
}

/**
 * Hook to fetch provider list using Effect program from core
 *
 * @returns Object with providers, loading, error, and refetch
 */
export function useProvidersEffect(): UseProvidersEffectReturn {
	const [providers, setProviders] = useState<Provider[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const fetch = useCallback(() => {
		setLoading(true)
		setError(null)

		Effect.runPromise(ProviderAtom.list())
			.then((data: Provider[]) => {
				setProviders(data)
				setError(null)
			})
			.catch((err: unknown) => {
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				setProviders([])
			})
			.finally(() => {
				setLoading(false)
			})
	}, [])

	useEffect(() => {
		fetch()
	}, [fetch])

	return {
		providers,
		loading,
		error,
		refetch: fetch,
	}
}

// Re-export types for convenience
export type { Provider, Model }
