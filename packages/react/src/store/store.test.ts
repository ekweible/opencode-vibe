/**
 * Unit tests for Zustand store with DirectoryState pattern
 *
 * Tests store initialization, event handling, and binary search operations.
 */

import { describe, it, expect, beforeEach } from "vitest"
import { useOpencodeStore } from "./store"

describe("useOpencodeStore", () => {
	beforeEach(() => {
		// Reset store before each test
		useOpencodeStore.setState({ directories: {} })
	})

	describe("initDirectory", () => {
		it("should initialize directory with empty state", () => {
			const store = useOpencodeStore.getState()
			store.initDirectory("/test/project")

			const dir = useOpencodeStore.getState().directories["/test/project"]
			expect(dir).toBeDefined()
			expect(dir?.ready).toBe(false)
			expect(dir?.sessions).toEqual([])
			expect(dir?.messages).toEqual({})
			expect(dir?.parts).toEqual({})
		})

		it("should not overwrite existing directory state", () => {
			const store = useOpencodeStore.getState()
			store.initDirectory("/test/project")
			store.setSessions("/test/project", [
				{
					id: "session-1",
					title: "Test",
					directory: "/test/project",
					time: { created: Date.now(), updated: Date.now() },
				},
			])

			store.initDirectory("/test/project")

			const dir = useOpencodeStore.getState().directories["/test/project"]
			expect(dir?.sessions).toHaveLength(1)
		})
	})

	describe("session management", () => {
		beforeEach(() => {
			useOpencodeStore.getState().initDirectory("/test/project")
		})

		it("should add session in sorted order", () => {
			const store = useOpencodeStore.getState()

			store.addSession("/test/project", {
				id: "c",
				title: "Session C",
				directory: "/test/project",
				time: { created: Date.now(), updated: Date.now() },
			})

			store.addSession("/test/project", {
				id: "a",
				title: "Session A",
				directory: "/test/project",
				time: { created: Date.now(), updated: Date.now() },
			})

			const sessions = useOpencodeStore.getState().directories["/test/project"]?.sessions
			expect(sessions?.map((s) => s.id)).toEqual(["a", "c"])
		})

		it("should get session by ID", () => {
			const store = useOpencodeStore.getState()
			const session = {
				id: "test-session",
				title: "Test",
				directory: "/test/project",
				time: { created: Date.now(), updated: Date.now() },
			}

			store.addSession("/test/project", session)
			const result = store.getSession("/test/project", "test-session")

			expect(result).toEqual(session)
		})

		it("should update session", () => {
			const store = useOpencodeStore.getState()
			store.addSession("/test/project", {
				id: "test",
				title: "Original",
				directory: "/test/project",
				time: { created: Date.now(), updated: Date.now() },
			})

			store.updateSession("/test/project", "test", (draft) => {
				draft.title = "Updated"
			})

			const session = store.getSession("/test/project", "test")
			expect(session?.title).toBe("Updated")
		})

		it("should remove session", () => {
			const store = useOpencodeStore.getState()
			store.addSession("/test/project", {
				id: "test",
				title: "Test",
				directory: "/test/project",
				time: { created: Date.now(), updated: Date.now() },
			})

			store.removeSession("/test/project", "test")

			const session = store.getSession("/test/project", "test")
			expect(session).toBeUndefined()
		})
	})

	describe("message management", () => {
		beforeEach(() => {
			useOpencodeStore.getState().initDirectory("/test/project")
		})

		it("should add message in sorted order", () => {
			const store = useOpencodeStore.getState()

			store.addMessage("/test/project", {
				id: "msg-c",
				sessionID: "session-1",
				role: "user",
			})

			store.addMessage("/test/project", {
				id: "msg-a",
				sessionID: "session-1",
				role: "user",
			})

			const messages = store.getMessages("/test/project", "session-1")
			expect(messages.map((m) => m.id)).toEqual(["msg-a", "msg-c"])
		})

		it("should update message", () => {
			const store = useOpencodeStore.getState()
			store.addMessage("/test/project", {
				id: "msg-1",
				sessionID: "session-1",
				role: "user",
			})

			store.updateMessage("/test/project", "session-1", "msg-1", (draft) => {
				draft.role = "assistant"
			})

			const messages = store.getMessages("/test/project", "session-1")
			expect(messages[0]?.role).toBe("assistant")
		})

		it("should remove message", () => {
			const store = useOpencodeStore.getState()
			store.addMessage("/test/project", {
				id: "msg-1",
				sessionID: "session-1",
				role: "user",
			})

			store.removeMessage("/test/project", "session-1", "msg-1")

			const messages = store.getMessages("/test/project", "session-1")
			expect(messages).toHaveLength(0)
		})
	})

	describe("handleEvent", () => {
		beforeEach(() => {
			useOpencodeStore.getState().initDirectory("/test/project")
		})

		it("should handle session.created event", () => {
			const store = useOpencodeStore.getState()
			const session = {
				id: "new-session",
				title: "New Session",
				directory: "/test/project",
				time: { created: Date.now(), updated: Date.now() },
			}

			store.handleEvent("/test/project", {
				type: "session.created",
				properties: { info: session },
			})

			const result = store.getSession("/test/project", "new-session")
			expect(result).toEqual(session)
		})

		it("should handle session.updated event", () => {
			const store = useOpencodeStore.getState()
			const session = {
				id: "test",
				title: "Original",
				directory: "/test/project",
				time: { created: Date.now(), updated: Date.now() },
			}

			store.addSession("/test/project", session)

			store.handleEvent("/test/project", {
				type: "session.updated",
				properties: {
					info: { ...session, title: "Updated" },
				},
			})

			const result = store.getSession("/test/project", "test")
			expect(result?.title).toBe("Updated")
		})

		it("should handle message.updated event", () => {
			const store = useOpencodeStore.getState()
			const message = {
				id: "msg-1",
				sessionID: "session-1",
				role: "user",
			}

			store.handleEvent("/test/project", {
				type: "message.updated",
				properties: { info: message },
			})

			const messages = store.getMessages("/test/project", "session-1")
			expect(messages).toHaveLength(1)
			expect(messages[0]).toEqual(message)
		})

		it("should handle message.part.updated event", () => {
			const store = useOpencodeStore.getState()
			const part = {
				id: "part-1",
				messageID: "msg-1",
				type: "text",
				content: "Hello",
			}

			store.handleEvent("/test/project", {
				type: "message.part.updated",
				properties: { part },
			})

			const parts = useOpencodeStore.getState().directories["/test/project"]?.parts["msg-1"]
			expect(parts).toHaveLength(1)
			expect(parts?.[0]).toEqual(part)
		})

		it("should auto-create directory if not exists", () => {
			const store = useOpencodeStore.getState()

			store.handleEvent("/new/directory", {
				type: "session.created",
				properties: {
					info: {
						id: "session-1",
						title: "Test",
						directory: "/new/directory",
						time: { created: Date.now(), updated: Date.now() },
					},
				},
			})

			const dir = useOpencodeStore.getState().directories["/new/directory"]
			expect(dir).toBeDefined()
			expect(dir?.sessions).toHaveLength(1)
		})
	})

	describe("handleSSEEvent", () => {
		it("should handle GlobalEvent and route to handleEvent", () => {
			const store = useOpencodeStore.getState()
			const session = {
				id: "test",
				title: "Test",
				directory: "/test/project",
				time: { created: Date.now(), updated: Date.now() },
			}

			store.handleSSEEvent({
				directory: "/test/project",
				payload: {
					type: "session.created",
					properties: { info: session },
				},
			})

			const result = store.getSession("/test/project", "test")
			expect(result).toEqual(session)
		})

		it("should auto-create directory from SSE event", () => {
			const store = useOpencodeStore.getState()

			store.handleSSEEvent({
				directory: "/auto/directory",
				payload: {
					type: "session.created",
					properties: {
						info: {
							id: "session-1",
							title: "Test",
							directory: "/auto/directory",
							time: { created: Date.now(), updated: Date.now() },
						},
					},
				},
			})

			const dir = useOpencodeStore.getState().directories["/auto/directory"]
			expect(dir).toBeDefined()
		})
	})
})
