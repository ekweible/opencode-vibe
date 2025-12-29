/**
 * Smoke test for Effect dependency
 */
import { describe, it, expect } from "bun:test"
import { Effect, Schema } from "effect"

describe("Effect dependency", () => {
	it("should import Effect successfully", () => {
		const program = Effect.succeed(42)
		expect(Effect.runSync(program)).toBe(42)
	})

	it("should import Schema successfully", () => {
		const MySchema = Schema.String
		const result = Schema.decodeUnknownSync(MySchema)("hello")
		expect(result).toBe("hello")
	})
})
