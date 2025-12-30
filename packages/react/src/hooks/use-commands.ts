/**
 * useCommands - Hook for slash command registry
 *
 * Returns builtin and custom slash commands.
 * Builtin commands are hardcoded, custom commands fetched from API.
 *
 * @param options.directory - Project directory for server discovery (uses discovered server, not hardcoded URL)
 *
 * @returns {
 *   commands: SlashCommand[] - all commands (builtin + custom)
 *   getSlashCommands: () => SlashCommand[] - filter to commands with triggers
 *   findCommand: (trigger: string) => SlashCommand | undefined - find by trigger
 *   loading: boolean - true while fetching custom commands
 *   error: Error | null - error from API fetch (null if no error)
 * }
 *
 * @example
 * ```tsx
 * const { commands, findCommand, loading, error } = useCommands({ directory })
 *
 * if (loading) return <Spinner />
 * if (error) console.warn("Failed to load custom commands:", error)
 *
 * const newCmd = findCommand("new") // Find /new command
 * ```
 */

import { useMemo, useCallback } from "react"
import { commands as commandsApi } from "@opencode-vibe/core/api"
import type { SlashCommand } from "../types/prompt"
import { useFetch } from "./use-fetch"

/**
 * Options for useCommands hook
 */
export interface UseCommandsOptions {
	/** Project directory for server discovery */
	directory?: string
}

/**
 * Builtin slash commands
 */
const BUILTIN_COMMANDS: SlashCommand[] = [
	{
		id: "session.new",
		trigger: "new",
		title: "New Session",
		keybind: "mod+n",
		type: "builtin",
	},
	{
		id: "session.share",
		trigger: "share",
		title: "Share Session",
		keybind: "mod+shift+s",
		type: "builtin",
	},
	{
		id: "session.compact",
		trigger: "compact",
		title: "Compact Context",
		type: "builtin",
	},
]

/**
 * useCommands hook
 *
 * Uses Promise API from @opencode-vibe/core/api to fetch custom commands.
 * Pass directory option to use server discovery instead of hardcoded URL.
 */
export function useCommands(options: UseCommandsOptions = {}) {
	const { directory } = options

	// Fetch custom commands from API using discovered server
	const {
		data: apiCommands,
		loading,
		error,
	} = useFetch(() => commandsApi.list(directory), directory, {
		initialData: [],
		onError: (err) => {
			// Only log if we have a directory (server should be reachable)
			// Silent fail if no directory - may be during SSR or before discovery
			if (directory) {
				console.error("Failed to fetch custom commands:", err)
			}
		},
	})

	// Map API response to SlashCommand format
	const customCommands = useMemo(
		() =>
			apiCommands.map((cmd) => ({
				id: `custom.${cmd.name}`,
				trigger: cmd.name,
				title: cmd.name,
				description: cmd.description,
				type: "custom" as const,
			})),
		[apiCommands],
	)

	// Combine builtin + custom
	const allCommands = useMemo(() => [...BUILTIN_COMMANDS, ...customCommands], [customCommands])

	/**
	 * Get all slash commands (commands with triggers)
	 * Currently all commands have triggers, but this filters for safety
	 */
	const getSlashCommands = useCallback(() => {
		return allCommands.filter((cmd) => cmd.trigger)
	}, [allCommands])

	/**
	 * Find command by trigger string
	 * Case-sensitive match
	 */
	const findCommand = useCallback(
		(trigger: string) => {
			return allCommands.find((cmd) => cmd.trigger === trigger)
		},
		[allCommands],
	)

	return {
		commands: allCommands,
		getSlashCommands,
		findCommand,
		loading,
		error,
	}
}
