/**
 * Prompt Utilities
 *
 * Pure utility functions for prompt input operations.
 * Framework-agnostic - no React dependencies.
 *
 * Provides:
 * - File part insertion logic
 * - Autocomplete navigation helpers
 * - Type definitions
 *
 * NOTE: React hooks for state management (usePrompt) should be in packages/react.
 *
 * @module atoms/prompt
 */

import type { Prompt, SlashCommand } from "../types/prompt.js"

/**
 * Autocomplete state interface
 */
export interface AutocompleteState {
	visible: boolean
	type: "file" | "command" | null
	query: string
	items: string[] | SlashCommand[]
	selectedIndex: number
}

/**
 * Utility namespace for prompt operations
 *
 * Pure functions for prompt manipulation.
 * No React, no state management.
 */
export const PromptUtil = {
	/**
	 * Insert a file part into a prompt at a specific position
	 *
	 * Splits the text part at the insertion point, inserts the file part,
	 * and adds trailing space. Handles replacement of query text.
	 *
	 * @param parts - Current prompt parts
	 * @param path - File path to insert
	 * @param atPosition - Character position to insert at
	 * @param replaceLength - Number of characters to replace (for autocomplete)
	 * @returns New parts array with file inserted and new cursor position
	 *
	 * @example
	 * ```typescript
	 * const parts: Prompt = [{ type: "text", content: "hello @fil", start: 0, end: 10 }]
	 * const { parts: newParts, cursor } = PromptUtil.insertFilePart(parts, "src/file.ts", 10, 4)
	 * // Result: [
	 * //   { type: "text", content: "hello ", start: 0, end: 6 },
	 * //   { type: "file", path: "src/file.ts", content: "@src/file.ts", start: 6, end: 18 },
	 * //   { type: "text", content: " ", start: 18, end: 19 }
	 * // ]
	 * ```
	 */
	insertFilePart: (
		parts: Prompt,
		path: string,
		atPosition: number,
		replaceLength: number,
	): { parts: Prompt; cursor: number } => {
		const content = `@${path}`
		let charCount = 0
		const newParts: Prompt = []
		let newCursorPosition = atPosition

		for (const part of parts) {
			if (part.type === "image") {
				// Image parts don't have start/end positions
				newParts.push(part)
				continue
			}

			if (part.type === "file") {
				newParts.push(part)
				charCount += part.content.length
				continue
			}

			const partStart = charCount
			const partEnd = charCount + part.content.length

			if (atPosition >= partStart && atPosition <= partEnd) {
				// This is the part to split
				const localPos = atPosition - partStart
				const before = part.content.slice(0, localPos - replaceLength)
				const after = part.content.slice(localPos)

				if (before) {
					newParts.push({
						type: "text",
						content: before,
						start: partStart,
						end: partStart + before.length,
					})
				}

				newParts.push({
					type: "file",
					path,
					content,
					start: partStart + before.length,
					end: partStart + before.length + content.length,
				})

				if (after) {
					newParts.push({
						type: "text",
						content: " " + after,
						start: partStart + before.length + content.length,
						end: partStart + before.length + content.length + after.length + 1,
					})
				} else {
					newParts.push({
						type: "text",
						content: " ",
						start: partStart + before.length + content.length,
						end: partStart + before.length + content.length + 1,
					})
				}

				// Calculate new cursor position:
				// before.length + content.length + 1 (trailing space)
				newCursorPosition = partStart + before.length + content.length + 1
			} else {
				newParts.push(part)
			}

			charCount = partEnd
		}

		return { parts: newParts, cursor: newCursorPosition }
	},

	/**
	 * Navigate autocomplete selection up or down
	 *
	 * Clamps index to [0, itemsLength - 1] bounds.
	 *
	 * @param currentIndex - Current selected index
	 * @param direction - "up" or "down"
	 * @param itemsLength - Total number of items
	 * @returns New selected index
	 */
	navigateAutocomplete: (
		currentIndex: number,
		direction: "up" | "down",
		itemsLength: number,
	): number => {
		return direction === "up"
			? Math.max(0, currentIndex - 1)
			: Math.min(itemsLength - 1, currentIndex + 1)
	},
}
