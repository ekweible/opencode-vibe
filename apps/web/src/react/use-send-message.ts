import { useCallback, useState, useMemo } from "react"
import { createClient } from "@/core/client"

export interface ModelSelection {
	providerID: string
	modelID: string
}

export interface UseSendMessageOptions {
	sessionId: string
	directory?: string
}

export interface UseSendMessageReturn {
	sendMessage: (text: string, model?: ModelSelection) => Promise<void>
	isLoading: boolean
	error?: Error
}

/**
 * Hook for sending messages to an OpenCode session.
 *
 * @example
 * ```tsx
 * const { sendMessage, isLoading, error } = useSendMessage({
 *   sessionId: "ses_123",
 *   directory: "/path/to/project"
 * })
 *
 * await sendMessage("Hello world")
 * ```
 */
export function useSendMessage({
	sessionId,
	directory,
}: UseSendMessageOptions): UseSendMessageReturn {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | undefined>(undefined)

	// Create client with directory scoping
	const client = useMemo(() => createClient(directory), [directory])

	const sendMessage = useCallback(
		async (text: string, model?: ModelSelection) => {
			const trimmedText = text.trim()

			// Don't send empty messages
			if (!trimmedText) {
				return
			}

			setIsLoading(true)
			setError(undefined)

			try {
				await client.session.prompt({
					path: { id: sessionId },
					body: {
						parts: [{ type: "text", text: trimmedText }],
						model: model
							? {
									providerID: model.providerID,
									modelID: model.modelID,
								}
							: undefined,
					},
				})
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err))
				setError(error)
				throw error
			} finally {
				setIsLoading(false)
			}
		},
		[client, sessionId],
	)

	return {
		sendMessage,
		isLoading,
		error,
	}
}
