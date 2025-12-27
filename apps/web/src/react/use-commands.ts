/**
 * useCommands - Hook for slash command registry
 *
 * Returns builtin and custom slash commands.
 * Builtin commands are hardcoded, custom commands come from API (future).
 *
 * @returns {
 *   commands: SlashCommand[] - all commands (builtin + custom)
 *   getSlashCommands: () => SlashCommand[] - filter to commands with triggers
 *   findCommand: (trigger: string) => SlashCommand | undefined - find by trigger
 * }
 *
 * @example
 * ```tsx
 * const { commands, findCommand } = useCommands()
 * const newCmd = findCommand("new") // Find /new command
 * ```
 */

import { useMemo, useCallback } from "react"
import type { SlashCommand } from "@/types/prompt"

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
 */
export function useCommands() {
	// Custom commands from API (placeholder for future implementation)
	// When sync.commands is available via useOpenCode(), map them here:
	// const { sync } = useOpenCode()
	// const customCommands = useMemo(() => {
	//   return (sync.commands ?? []).map(cmd => ({
	//     id: `custom.${cmd.name}`,
	//     trigger: cmd.name,
	//     title: cmd.name,
	//     description: cmd.description,
	//     type: "custom" as const,
	//   }))
	// }, [sync.commands])

	const customCommands: SlashCommand[] = useMemo(() => [], [])

	// Combine builtin + custom
	const commands = useMemo(() => [...BUILTIN_COMMANDS, ...customCommands], [customCommands])

	/**
	 * Get all slash commands (commands with triggers)
	 * Currently all commands have triggers, but this filters for safety
	 */
	const getSlashCommands = useCallback(() => {
		return commands.filter((cmd) => cmd.trigger)
	}, [commands])

	/**
	 * Find command by trigger string
	 * Case-sensitive match
	 */
	const findCommand = useCallback(
		(trigger: string) => {
			return commands.find((cmd) => cmd.trigger === trigger)
		},
		[commands],
	)

	return {
		commands,
		getSlashCommands,
		findCommand,
	}
}
