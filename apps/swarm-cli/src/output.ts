/**
 * Output formatting utilities
 *
 * Supports:
 * - NDJSON: Newline-delimited JSON for streaming
 * - Pretty: Human-readable formatted output
 * - Cursor persistence: Save/load cursor from file
 */

import { writeFile, readFile } from "fs/promises"
import { existsSync } from "fs"

export type OutputMode = "json" | "pretty"

export interface OutputConfig {
	mode: OutputMode
	cursorFile?: string
}

/**
 * Write NDJSON (newline-delimited JSON) output
 */
export function writeNDJSON(data: unknown): void {
	console.log(JSON.stringify(data))
}

/**
 * Write pretty-formatted output
 */
export function writePretty(label: string, value: unknown): void {
	if (typeof value === "object" && value !== null) {
		console.log(`${label}:`)
		console.log(JSON.stringify(value, null, 2))
	} else {
		console.log(`${label}: ${value}`)
	}
}

/**
 * Write output based on mode
 */
export function write(config: OutputConfig, data: unknown, label?: string): void {
	if (config.mode === "json") {
		writeNDJSON(data)
	} else {
		writePretty(label || "Output", data)
	}
}

/**
 * Write error output
 */
export function writeError(message: string, details?: unknown): void {
	if (details) {
		console.error(`Error: ${message}`)
		console.error(JSON.stringify(details, null, 2))
	} else {
		console.error(`Error: ${message}`)
	}
}

/**
 * Save cursor to file
 */
export async function saveCursor(cursorFile: string, cursor: string): Promise<void> {
	await writeFile(cursorFile, cursor, "utf-8")
}

/**
 * Load cursor from file
 * Returns null if file doesn't exist
 */
export async function loadCursor(cursorFile: string): Promise<string | null> {
	if (!existsSync(cursorFile)) {
		return null
	}
	try {
		return await readFile(cursorFile, "utf-8")
	} catch {
		return null
	}
}

/**
 * Add progressive discovery links to JSON output
 */
export function withLinks(
	data: Record<string, unknown>,
	links: Record<string, string>,
): Record<string, unknown> {
	return {
		...data,
		_links: links,
	}
}

/**
 * Format "Next steps" section for help text
 */
export function formatNextSteps(steps: string[]): string {
	return `
Next steps:
${steps.map((step) => `  ${step}`).join("\n")}
`
}

/**
 * SSE event info (for logging/debugging)
 */
export interface SSEEventInfo {
	type: string
	properties: Record<string, unknown>
}

/**
 * Format timestamp as HH:MM:SS
 */
function formatTimestamp(date: Date): string {
	const hours = String(date.getHours()).padStart(2, "0")
	const minutes = String(date.getMinutes()).padStart(2, "0")
	const seconds = String(date.getSeconds()).padStart(2, "0")
	return `${hours}:${minutes}:${seconds}`
}

/**
 * Extract key identifiers from event properties
 */
function extractIdentifiers(event: SSEEventInfo): string {
	const { type, properties } = event

	switch (type) {
		case "session.created":
		case "session.updated":
		case "session.status": {
			const sessionID = properties.sessionID as string | undefined
			const status = properties.status as string | undefined
			if (status) {
				return `${sessionID} → ${status}`
			}
			return sessionID || ""
		}

		case "message.created":
		case "message.updated": {
			const sessionID = properties.sessionID as string | undefined
			const messageID = properties.id as string | undefined
			const tokens = properties.totalTokens as number | undefined
			const path = `${sessionID}/${messageID}`
			if (tokens !== undefined) {
				return `${path} (tokens: ${tokens})`
			}
			return path
		}

		case "part.created":
		case "part.updated": {
			const sessionID = properties.sessionID as string | undefined
			const messageID = properties.messageID as string | undefined
			const partID = properties.id as string | undefined
			return `${sessionID}/${messageID}/${partID}`
		}

		default:
			return JSON.stringify(properties)
	}
}

/**
 * Format a single SSE event for display
 *
 * Format: "HH:MM:SS event.type        identifier info"
 * Example: "18:45:32 session.status    ses_abc123 → running"
 */
export function formatSSEEvent(event: SSEEventInfo): string {
	const timestamp = formatTimestamp(new Date())
	const eventType = event.type.padEnd(18, " ")
	const identifiers = extractIdentifiers(event)

	return `${timestamp} ${eventType} ${identifiers}`
}
