/**
 * Tests for useCommands hook
 *
 * Tests slash command registry with builtin and custom commands.
 * Uses React Testing Library with Bun test runner.
 */

// Set up DOM environment for React Testing Library
import { Window } from "happy-dom"
const window = new Window()
// @ts-ignore - happy-dom types don't perfectly match DOM types, but work at runtime
globalThis.document = window.document
// @ts-ignore - happy-dom types don't perfectly match DOM types, but work at runtime
globalThis.window = window

import { describe, test, expect } from "bun:test"
import { renderHook } from "@testing-library/react"
import { useCommands } from "./use-commands"
import { OpenCodeProvider } from "./provider"
import type { ReactNode } from "react"

// Wrapper with OpenCodeProvider
function createWrapper(directory = "/test/dir") {
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<OpenCodeProvider url="http://localhost:3000" directory={directory}>
				{children}
			</OpenCodeProvider>
		)
	}
}

describe("useCommands", () => {
	describe("builtin commands", () => {
		test("returns builtin commands", () => {
			const { result } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			expect(result.current.commands).toHaveLength(3)

			const builtinIds = result.current.commands.map((cmd) => cmd.id)
			expect(builtinIds).toContain("session.new")
			expect(builtinIds).toContain("session.share")
			expect(builtinIds).toContain("session.compact")
		})

		test("builtin commands have correct structure", () => {
			const { result } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const newCmd = result.current.commands.find((cmd) => cmd.id === "session.new")

			expect(newCmd).toBeDefined()
			expect(newCmd?.trigger).toBe("new")
			expect(newCmd?.title).toBe("New Session")
			expect(newCmd?.keybind).toBe("mod+n")
			expect(newCmd?.type).toBe("builtin")
		})

		test("session.share has keybind", () => {
			const { result } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const shareCmd = result.current.commands.find((cmd) => cmd.id === "session.share")

			expect(shareCmd?.trigger).toBe("share")
			expect(shareCmd?.keybind).toBe("mod+shift+s")
			expect(shareCmd?.type).toBe("builtin")
		})

		test("session.compact has no keybind", () => {
			const { result } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const compactCmd = result.current.commands.find((cmd) => cmd.id === "session.compact")

			expect(compactCmd?.trigger).toBe("compact")
			expect(compactCmd?.keybind).toBeUndefined()
			expect(compactCmd?.type).toBe("builtin")
		})
	})

	describe("getSlashCommands", () => {
		test("returns all commands with triggers", () => {
			const { result } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const slashCommands = result.current.getSlashCommands()

			// All builtin commands have triggers
			expect(slashCommands).toHaveLength(3)
			expect(slashCommands.every((cmd) => cmd.trigger)).toBe(true)
		})

		test("getSlashCommands is stable across renders", () => {
			const { result, rerender } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const first = result.current.getSlashCommands
			rerender()
			const second = result.current.getSlashCommands

			expect(first).toBe(second)
		})
	})

	describe("findCommand", () => {
		test("finds command by trigger", () => {
			const { result } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const cmd = result.current.findCommand("new")

			expect(cmd).toBeDefined()
			expect(cmd?.id).toBe("session.new")
			expect(cmd?.title).toBe("New Session")
		})

		test("returns undefined for unknown trigger", () => {
			const { result } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const cmd = result.current.findCommand("unknown")

			expect(cmd).toBeUndefined()
		})

		test("findCommand is case-sensitive", () => {
			const { result } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const lowercase = result.current.findCommand("new")
			const uppercase = result.current.findCommand("NEW")

			expect(lowercase).toBeDefined()
			expect(uppercase).toBeUndefined()
		})

		test("findCommand is stable across renders", () => {
			const { result, rerender } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const first = result.current.findCommand
			rerender()
			const second = result.current.findCommand

			expect(first).toBe(second)
		})
	})

	describe("custom commands", () => {
		test("placeholder for custom commands from API", () => {
			const { result } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			// Currently only builtin commands
			// When sync.commands is implemented, this will test custom commands
			const customCommands = result.current.commands.filter((cmd) => cmd.type === "custom")
			expect(customCommands).toHaveLength(0)
		})
	})

	describe("commands array", () => {
		test("commands array is stable when no changes", () => {
			const { result, rerender } = renderHook(() => useCommands(), {
				wrapper: createWrapper(),
			})

			const first = result.current.commands
			rerender()
			const second = result.current.commands

			expect(first).toBe(second)
		})
	})
})
