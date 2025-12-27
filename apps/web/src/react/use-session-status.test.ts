/**
 * Unit tests for useSessionStatus hook
 *
 * Tests that useSessionStatus:
 * 1. Returns initial state (not running, loading)
 * 2. Subscribes to session.status events
 * 3. Updates running state when event fires
 * 4. Ignores events for different sessions
 * 5. Unsubscribes on unmount
 * 6. Re-subscribes when sessionId changes
 */

// Set up DOM environment for React Testing Library
import { Window } from "happy-dom"
const window = new Window()
// @ts-ignore - happy-dom types don't perfectly match DOM types, but work at runtime
globalThis.document = window.document
// @ts-ignore - happy-dom types don't perfectly match DOM types, but work at runtime
globalThis.window = window

import { describe, it, expect, beforeEach, mock } from "bun:test"
import { renderHook, act } from "@testing-library/react"

// Capture subscribe callbacks for testing - INITIALIZE FIRST
type SubscribeCallback = (event: any) => void
const subscribeCallbacks = new Map<string, Set<SubscribeCallback>>()
const mockUnsubscribeFns: Array<ReturnType<typeof mock>> = []
const mockSubscribe = mock((eventType: string, callback: SubscribeCallback) => {
	if (!subscribeCallbacks.has(eventType)) {
		subscribeCallbacks.set(eventType, new Set())
	}
	subscribeCallbacks.get(eventType)!.add(callback)

	const unsubscribe = mock(() => {
		subscribeCallbacks.get(eventType)?.delete(callback)
	})
	mockUnsubscribeFns.push(unsubscribe)
	return unsubscribe
})

// Mock useSSE - must include all exports to avoid conflicts with other test files
mock.module("./use-sse", () => ({
	useSSE: () => ({
		subscribe: (...args: any[]) => mockSubscribe(...args),
		connected: true,
		reconnect: () => {},
	}),
	SSEProvider: ({ children }: { children: any }) => children,
	useSSEDirect: () => ({ reconnect: () => {} }),
}))

// Import after mocking
const { useSessionStatus } = await import("./use-session-status")

// Helper to emit events to subscribed callbacks
function emitEvent(eventType: string, event: any) {
	const callbacks = subscribeCallbacks.get(eventType)
	if (callbacks) {
		for (const callback of callbacks) {
			callback(event)
		}
	}
}

describe("useSessionStatus", () => {
	const sessionId = "session-123"

	beforeEach(() => {
		// Clear callbacks between tests
		subscribeCallbacks.clear()
		mockUnsubscribeFns.length = 0
		mockSubscribe.mockClear()
	})

	it("returns initial state (not running, loading)", () => {
		const { result } = renderHook(() => useSessionStatus(sessionId))

		expect(result.current.running).toBe(false)
		expect(result.current.isLoading).toBe(true)
	})

	it("subscribes to session.status events on mount", () => {
		renderHook(() => useSessionStatus(sessionId))

		expect(mockSubscribe).toHaveBeenCalledWith("session.status", expect.any(Function))
	})

	it("updates running state when session.status event fires", () => {
		const { result } = renderHook(() => useSessionStatus(sessionId))

		// Simulate SSE event - payload has sessionID and status.running
		act(() => {
			emitEvent("session.status", {
				payload: {
					type: "session.status",
					properties: {
						sessionID: sessionId,
						status: { running: true },
					},
				},
			})
		})

		expect(result.current.running).toBe(true)
		expect(result.current.isLoading).toBe(false)
	})

	it("updates to not running when status event says so", () => {
		const { result } = renderHook(() => useSessionStatus(sessionId))

		// First running
		act(() => {
			emitEvent("session.status", {
				payload: {
					type: "session.status",
					properties: {
						sessionID: sessionId,
						status: { running: true },
					},
				},
			})
		})

		expect(result.current.running).toBe(true)

		// Then not running
		act(() => {
			emitEvent("session.status", {
				payload: {
					type: "session.status",
					properties: {
						sessionID: sessionId,
						status: { running: false },
					},
				},
			})
		})

		expect(result.current.running).toBe(false)
		expect(result.current.isLoading).toBe(false)
	})

	it("ignores session.status events for different sessions", () => {
		const { result } = renderHook(() => useSessionStatus(sessionId))

		// Event for different session
		act(() => {
			emitEvent("session.status", {
				payload: {
					type: "session.status",
					properties: {
						sessionID: "different-session",
						status: { running: true },
					},
				},
			})
		})

		// Should remain in initial state
		expect(result.current.running).toBe(false)
		expect(result.current.isLoading).toBe(true)
	})

	it("unsubscribes on unmount", () => {
		const { unmount } = renderHook(() => useSessionStatus(sessionId))

		// Should have 1 unsubscribe function
		expect(mockUnsubscribeFns).toHaveLength(1)

		unmount()

		// Should have been called
		expect(mockUnsubscribeFns[0]).toHaveBeenCalled()
	})

	it("re-subscribes when sessionId changes", () => {
		const { rerender } = renderHook(({ id }: { id: string }) => useSessionStatus(id), {
			initialProps: { id: "session-1" },
		})

		// 1 subscription initially
		expect(mockSubscribe).toHaveBeenCalledTimes(1)

		// Change sessionId
		rerender({ id: "session-2" })

		// Should have 2 total (1 new subscription)
		expect(mockSubscribe).toHaveBeenCalledTimes(2)
	})

	it("handles malformed events gracefully", () => {
		const { result } = renderHook(() => useSessionStatus(sessionId))

		// Missing properties
		act(() => {
			emitEvent("session.status", {
				payload: {
					type: "session.status",
					properties: null,
				},
			})
		})

		// Should remain in initial state
		expect(result.current.running).toBe(false)
		expect(result.current.isLoading).toBe(true)
	})

	it("handles missing status object gracefully", () => {
		const { result } = renderHook(() => useSessionStatus(sessionId))

		// Missing status
		act(() => {
			emitEvent("session.status", {
				payload: {
					type: "session.status",
					properties: {
						sessionID: sessionId,
					},
				},
			})
		})

		// Should remain in initial state
		expect(result.current.running).toBe(false)
		expect(result.current.isLoading).toBe(true)
	})
})
