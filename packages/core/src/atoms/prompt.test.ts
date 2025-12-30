/**
 * Tests for prompt utilities
 *
 * Verifies prompt manipulation functions:
 * - File part insertion logic
 * - Autocomplete navigation
 * - Pure function behavior (no side effects)
 */

import { describe, expect, it } from "vitest"
import type { Prompt } from "../types/prompt.js"
import { PromptUtil } from "./prompt.js"

describe("PromptUtil.insertFilePart", () => {
	it("inserts file part in middle of text", () => {
		const parts: Prompt = [{ type: "text", content: "hello world", start: 0, end: 11 }]

		// Insert @file.ts at position 6 (after "hello "), replacing 0 chars
		const { parts: newParts, cursor } = PromptUtil.insertFilePart(parts, "src/file.ts", 6, 0)

		// Expected: "hello " + "@src/file.ts" + " world"
		expect(newParts).toHaveLength(3)
		expect(newParts[0]?.type).toBe("text")
		if (newParts[0]?.type === "text") {
			expect(newParts[0].content).toBe("hello ")
		}
		expect(newParts[1]?.type).toBe("file")
		if (newParts[1]?.type === "file") {
			expect(newParts[1].path).toBe("src/file.ts")
			expect(newParts[1].content).toBe("@src/file.ts")
		}
		expect(newParts[2]?.type).toBe("text")
		if (newParts[2]?.type === "text") {
			expect(newParts[2].content).toBe(" world")
		}
		expect(cursor).toBe(19) // after file part + space
	})

	it("inserts file part at start of text", () => {
		const parts: Prompt = [{ type: "text", content: "hello", start: 0, end: 5 }]

		const { parts: newParts } = PromptUtil.insertFilePart(parts, "file.ts", 0, 0)

		expect(newParts).toHaveLength(2)
		expect(newParts[0]?.type).toBe("file")
		if (newParts[0]?.type === "file") {
			expect(newParts[0].path).toBe("file.ts")
		}
		expect(newParts[1]?.type).toBe("text")
		if (newParts[1]?.type === "text") {
			expect(newParts[1].content).toBe(" hello")
		}
	})

	it("inserts file part at end of text", () => {
		const parts: Prompt = [{ type: "text", content: "hello", start: 0, end: 5 }]

		const { parts: newParts } = PromptUtil.insertFilePart(parts, "file.ts", 5, 0)

		expect(newParts).toHaveLength(3)
		expect(newParts[0]?.type).toBe("text")
		if (newParts[0]?.type === "text") {
			expect(newParts[0].content).toBe("hello")
		}
		expect(newParts[1]?.type).toBe("file")
		expect(newParts[2]?.type).toBe("text")
		if (newParts[2]?.type === "text") {
			expect(newParts[2].content).toBe(" ")
		}
	})

	it("replaces query text when inserting (autocomplete use case)", () => {
		const parts: Prompt = [{ type: "text", content: "hello @fil", start: 0, end: 10 }]

		// Insert file, replacing "@fil" (4 chars)
		const { parts: newParts } = PromptUtil.insertFilePart(parts, "src/file.ts", 10, 4)

		expect(newParts).toHaveLength(3)
		expect(newParts[0]?.type).toBe("text")
		if (newParts[0]?.type === "text") {
			expect(newParts[0].content).toBe("hello ")
		}
		expect(newParts[1]?.type).toBe("file")
		if (newParts[1]?.type === "file") {
			expect(newParts[1].path).toBe("src/file.ts")
		}
		expect(newParts[2]?.type).toBe("text")
		if (newParts[2]?.type === "text") {
			expect(newParts[2].content).toBe(" ")
		}
	})

	it("handles multiple existing parts", () => {
		const parts: Prompt = [
			{ type: "text", content: "hello ", start: 0, end: 6 },
			{ type: "file", path: "a.ts", content: "@a.ts", start: 6, end: 11 },
			{ type: "text", content: " world", start: 11, end: 17 },
		]

		// Insert new file in last text part at position 14 (after " wo")
		const { parts: newParts } = PromptUtil.insertFilePart(parts, "b.ts", 14, 0)

		expect(newParts.length).toBeGreaterThan(3)
		// Should have: text("hello "), file(a.ts), text(" wo"), file(b.ts), text(" rld")
		const fileParts = newParts.filter((p) => p?.type === "file")
		expect(fileParts).toHaveLength(2)
	})
})

describe("PromptUtil.navigateAutocomplete", () => {
	it("navigates down within bounds", () => {
		const itemsLength = 3
		const currentIndex = 0

		const newIndex = PromptUtil.navigateAutocomplete(currentIndex, "down", itemsLength)

		expect(newIndex).toBe(1)
	})

	it("navigates up within bounds", () => {
		const itemsLength = 3
		const currentIndex = 2

		const newIndex = PromptUtil.navigateAutocomplete(currentIndex, "up", itemsLength)

		expect(newIndex).toBe(1)
	})

	it("clamps down at end of list", () => {
		const itemsLength = 3
		const currentIndex = 2

		const newIndex = PromptUtil.navigateAutocomplete(currentIndex, "down", itemsLength)

		expect(newIndex).toBe(2) // Stays at 2
	})

	it("clamps up at start of list", () => {
		const itemsLength = 3
		const currentIndex = 0

		const newIndex = PromptUtil.navigateAutocomplete(currentIndex, "up", itemsLength)

		expect(newIndex).toBe(0) // Stays at 0
	})
})
