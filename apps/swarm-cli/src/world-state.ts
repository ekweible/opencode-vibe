/**
 * WorldState Formatting - CLI pretty output
 *
 * Uses core's WorldState directly (no adapter needed).
 * Core provides WorldState.byDirectory and WorldState.stats.
 */

import type { WorldState, EnrichedSession } from "@opencode-vibe/core/world"

/**
 * Project aggregation - sessions grouped by directory
 * Computed from core's WorldState.byDirectory
 */
export interface ProjectState {
	directory: string
	sessions: EnrichedSession[]
	activeCount: number
	totalMessages: number
	lastActivityAt: number
}

/**
 * Format WorldState for pretty output
 * Uses core's WorldState.byDirectory and WorldState.stats
 */
export function formatWorldState(state: WorldState): string {
	const lines: string[] = []

	lines.push("╔═══════════════════════════════════════════════════════════╗")
	lines.push("║                    🌍 WORLD STATE 🌍                      ║")
	lines.push("╠═══════════════════════════════════════════════════════════╣")
	lines.push(
		`║  Sessions: ${state.stats.total.toString().padEnd(6)} Active: ${state.stats.active.toString().padEnd(6)} Streaming: ${state.stats.streaming.toString().padEnd(4)} ║`,
	)
	lines.push("╠═══════════════════════════════════════════════════════════╣")

	if (state.byDirectory.size === 0) {
		lines.push("║  No sessions found                                        ║")
	}

	// Convert byDirectory Map to sorted projects
	const projects: ProjectState[] = []
	for (const [directory, sessions] of state.byDirectory) {
		// Sort sessions by last activity (most recent first)
		const sortedSessions = [...sessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt)

		projects.push({
			directory,
			sessions: sortedSessions,
			activeCount: sortedSessions.filter((s) => s.isActive).length,
			totalMessages: sortedSessions.reduce((sum, s) => sum + s.messages.length, 0),
			lastActivityAt: Math.max(...sortedSessions.map((s) => s.lastActivityAt)),
		})
	}

	// Sort projects by last activity
	projects.sort((a, b) => b.lastActivityAt - a.lastActivityAt)

	for (const project of projects) {
		const shortDir = project.directory.replace(/^\/Users\/[^/]+/, "~")
		lines.push(`║  📁 ${shortDir.padEnd(52)} ║`)

		const activeIcon = project.activeCount > 0 ? "🟢" : "⚪"
		lines.push(
			`║     ${activeIcon} ${project.sessions.length} sessions, ${project.activeCount} active, ${project.totalMessages} msgs`.padEnd(
				58,
			) + " ║",
		)

		// Show top 3 most recent sessions
		const recentSessions = project.sessions.slice(0, 3)
		for (const session of recentSessions) {
			const isStreaming = session.messages.some((m) => m.isStreaming)
			const statusIcon = isStreaming ? "⚡" : session.isActive ? "🔵" : "⚫"
			const shortId = session.id.slice(-8)
			const ago = formatTimeAgo(session.lastActivityAt)
			lines.push(
				`║       ${statusIcon} ${shortId} (${session.messages.length} msgs, ${ago})`.padEnd(58) +
					" ║",
			)
		}

		if (project.sessions.length > 3) {
			lines.push(`║       ... and ${project.sessions.length - 3} more`.padEnd(58) + " ║")
		}
	}

	lines.push("╠═══════════════════════════════════════════════════════════╣")
	lines.push(`║  Updated: ${new Date(state.lastUpdated).toLocaleTimeString().padEnd(45)} ║`)
	lines.push("╚═══════════════════════════════════════════════════════════╝")

	return lines.join("\n")
}

/**
 * Format timestamp as relative time
 */
function formatTimeAgo(timestamp: number): string {
	const now = Date.now()
	const diff = now - timestamp

	if (diff < 1000) return "now"
	if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
	if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
	if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
	return `${Math.floor(diff / 86400000)}d ago`
}
