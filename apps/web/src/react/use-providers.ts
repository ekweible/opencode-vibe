import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/core/client"

export interface Provider {
	id: string
	name: string
	models: Model[]
}

export interface Model {
	id: string
	name: string
}

export interface UseProvidersOptions {
	directory?: string
}

export interface UseProvidersReturn {
	providers: Provider[]
	isLoading: boolean
	error?: Error
}

/**
 * Hook for fetching available AI providers and their models.
 *
 * @example
 * ```tsx
 * const { providers, isLoading, error } = useProviders()
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 *
 * return (
 *   <select>
 *     {providers.map(provider =>
 *       provider.models.map(model => (
 *         <option key={`${provider.id}-${model.id}`}>
 *           {provider.name} - {model.name}
 *         </option>
 *       ))
 *     )}
 *   </select>
 * )
 * ```
 */
export function useProviders({ directory }: UseProvidersOptions = {}): UseProvidersReturn {
	const [providers, setProviders] = useState<Provider[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | undefined>(undefined)

	// Create client with directory scoping
	const client = useMemo(() => createClient(directory), [directory])

	// Fetch providers on mount or when directory changes
	useEffect(() => {
		let isCancelled = false

		async function fetchProviders() {
			setIsLoading(true)
			setError(undefined)

			try {
				const response = await client.provider.list()
				if (!isCancelled && response.data) {
					// SDK returns { all: Provider[], default: Provider, connected: string[] }
					// Each provider has models as a dictionary { [key: string]: Model }
					// We need to transform to our interface where models is an array
					const rawProviders = response.data.all ?? []
					const transformedProviders: Provider[] = rawProviders.map((p) => ({
						id: p.id,
						name: p.name,
						// Transform models dictionary to array
						models: p.models
							? Object.entries(p.models).map(([id, model]) => ({
									id,
									name: model.name || id,
								}))
							: [],
					}))
					setProviders(transformedProviders)
				}
			} catch (err) {
				if (!isCancelled) {
					const error = err instanceof Error ? err : new Error(String(err))
					setError(error)
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false)
				}
			}
		}

		fetchProviders()

		return () => {
			isCancelled = true
		}
	}, [client])

	return {
		providers,
		isLoading,
		error,
	}
}
