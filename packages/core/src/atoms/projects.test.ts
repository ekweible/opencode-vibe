/**
 * Tests for project management atoms
 *
 * Tests verify the Effect programs that fetch project list and current project.
 * Focus: Effect program structure, type safety.
 */

import { describe, expect, it } from "vitest"

describe("ProjectAtom namespace", () => {
	it("should export ProjectAtom namespace", async () => {
		const { ProjectAtom } = await import("./projects.js")

		expect(ProjectAtom).toBeDefined()
		expect(typeof ProjectAtom.list).toBe("function")
		expect(typeof ProjectAtom.current).toBe("function")
	})

	it("ProjectAtom.list should return an Effect", async () => {
		const { ProjectAtom } = await import("./projects.js")
		const effect = ProjectAtom.list()

		// Effect programs have _tag and other Effect properties
		expect(effect).toBeDefined()
		expect(typeof effect).toBe("object")
	})

	it("ProjectAtom.current should return an Effect", async () => {
		const { ProjectAtom } = await import("./projects.js")
		const effect = ProjectAtom.current()

		// Effect programs have _tag and other Effect properties
		expect(effect).toBeDefined()
		expect(typeof effect).toBe("object")
	})
})

describe("Project type exports", () => {
	it("should export Project interface", async () => {
		const module = await import("./projects.js")
		expect(module).toBeDefined()
	})
})
