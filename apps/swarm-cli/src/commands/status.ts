/**
 * Status command - world state snapshot
 *
 * Shows current swarm status with aggregated world state.
 * Uses createWorldStream from core for SSE-wired atom-based state.
 */

import { createWorldStream } from "@opencode-vibe/core/world"
import type { CommandContext } from "./index.js"
import { write, withLinks } from "../output.js"
import { adaptCoreWorldState, formatWorldState } from "../world-state.js"

export async function run(context: CommandContext): Promise<void> {
	const { output } = context

	if (output.mode === "pretty") {
		console.log("🔍 Discovering servers...\n")
	}

	// Create world stream - it handles discovery and SSE internally
	const stream = createWorldStream()

	try {
		// Wait a moment for bootstrap to complete
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Get snapshot
		const coreState = await stream.getSnapshot()
		const world = adaptCoreWorldState(coreState)

		// Check if we found any sessions
		if (world.totalSessions === 0) {
			if (output.mode === "json") {
				const data = withLinks(
					{ servers: 0, discovered: [], world: null },
					{
						start: "cd ~/project && opencode",
						retry: "swarm-cli status",
					},
				)
				write(output, data)
			} else {
				console.log("✗ No OpenCode servers found")
				console.log("\nTo connect to a server:")
				console.log("  1. Start OpenCode:  cd ~/project && opencode")
				console.log("  2. Then run:        swarm-cli status")
				console.log("\nTIP: OpenCode must be running in a project directory")
			}
			await stream.dispose()
			return
		}

		if (output.mode === "json") {
			const data = withLinks(
				{
					servers: world.projects.length,
					world: {
						projects: world.projects.map((p) => ({
							directory: p.directory,
							sessionCount: p.sessions.length,
							activeCount: p.activeCount,
							totalMessages: p.totalMessages,
							sessions: p.sessions.slice(0, 5).map((s) => ({
								id: s.id,
								status: s.status,
								messageCount: s.messageCount,
								isStreaming: s.isStreaming,
							})),
						})),
						totalSessions: world.totalSessions,
						activeSessions: world.activeSessions,
						streamingSessions: world.streamingSessions,
						lastEventOffset: world.lastEventOffset,
					},
				},
				{
					watch: "swarm-cli watch",
					watchLive: "swarm-cli watch --cursor-file .cursor",
				},
			)
			write(output, data)
		} else {
			// Pretty output with world state visualization
			console.log(formatWorldState(world))
			console.log("")
			console.log("Next steps:")
			console.log("  swarm-cli watch                    # Stream live events")
			console.log("  swarm-cli watch --cursor-file .cur # Persist cursor for resumption")
			console.log("  swarm-cli status --json            # Machine-readable output")
		}

		// Cleanup
		await stream.dispose()
	} catch (error) {
		if (output.mode === "pretty") {
			console.log(
				`⚠️  Failed to get world state: ${error instanceof Error ? error.message : "unknown error"}`,
			)
		}
		await stream.dispose()
	}
}

export const description = "Show world state snapshot from all servers"
