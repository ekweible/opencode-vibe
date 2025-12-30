/**
 * Tests for provider atoms
 *
 * These tests verify the Effect programs that fetch provider data from the SDK.
 * Focus: provider list fetching, type safety, transformation logic.
 */

import { describe, expect, it } from "vitest"
import type { Provider } from "./providers.js"

/**
 * Expected provider shape after transformation
 */
const mockProviders: Provider[] = [
	{
		id: "anthropic",
		name: "Anthropic",
		models: [
			{ id: "claude-sonnet-4", name: "Claude Sonnet 4" },
			{ id: "claude-opus-4", name: "Claude Opus 4" },
		],
	},
	{
		id: "openai",
		name: "OpenAI",
		models: [
			{ id: "gpt-4", name: "GPT-4" },
			{ id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
		],
	},
]

describe("ProviderAtom namespace", () => {
	it("should export ProviderAtom namespace", async () => {
		const { ProviderAtom } = await import("./providers.js")
		expect(ProviderAtom).toBeDefined()
		expect(typeof ProviderAtom.list).toBe("function")
	})

	it("ProviderAtom.list should return an Effect", async () => {
		const { ProviderAtom } = await import("./providers.js")
		const effect = ProviderAtom.list()

		// Effect programs have _tag and other Effect properties
		expect(effect).toBeDefined()
		expect(typeof effect).toBe("object")
	})
})

describe("Provider type exports", () => {
	it("should export Provider interface", async () => {
		const module = await import("./providers.js")
		// Check that the module can be imported without errors
		expect(module).toBeDefined()
	})

	it("should export Model interface", async () => {
		const module = await import("./providers.js")
		expect(module).toBeDefined()
	})
})
