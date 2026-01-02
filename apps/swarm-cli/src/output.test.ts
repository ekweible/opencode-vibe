/**
 * Tests for output formatting utilities
 */

import { describe, it, expect } from "vitest"
import { formatSSEEvent, type SSEEventInfo } from "./output.js"

describe("formatSSEEvent", () => {
	it("formats session.status event with status", () => {
		const event: SSEEventInfo = {
			type: "session.status",
			properties: {
				sessionID: "ses_abc123",
				status: "running",
			},
		}

		const result = formatSSEEvent(event)
		expect(result).toMatch(/\d{2}:\d{2}:\d{2}/)
		expect(result).toContain("session.status")
		expect(result).toContain("ses_abc123")
		expect(result).toContain("running")
	})

	it("formats message.created event", () => {
		const event: SSEEventInfo = {
			type: "message.created",
			properties: {
				id: "msg_def456",
				sessionID: "ses_abc123",
			},
		}

		const result = formatSSEEvent(event)
		expect(result).toContain("message.created")
		expect(result).toContain("ses_abc123/msg_def456")
	})

	it("formats part.updated event", () => {
		const event: SSEEventInfo = {
			type: "part.updated",
			properties: {
				id: "part_789",
				messageID: "msg_def456",
				sessionID: "ses_abc123",
			},
		}

		const result = formatSSEEvent(event)
		expect(result).toContain("part.updated")
		expect(result).toContain("ses_abc123/msg_def456/part_789")
	})

	it("formats message.updated event with token count", () => {
		const event: SSEEventInfo = {
			type: "message.updated",
			properties: {
				id: "msg_def456",
				sessionID: "ses_abc123",
				totalTokens: 1234,
			},
		}

		const result = formatSSEEvent(event)
		expect(result).toContain("message.updated")
		expect(result).toContain("ses_abc123/msg_def456")
		expect(result).toContain("1234")
	})

	it("pads event type to 18 characters", () => {
		const event: SSEEventInfo = {
			type: "session.status",
			properties: {
				sessionID: "ses_abc",
			},
		}

		const result = formatSSEEvent(event)
		// Extract the event type portion (after timestamp)
		const parts = result.split(/\s+/)
		const eventType = parts[1]
		expect(eventType).toBe("session.status")
		// Verify padding by checking the space after
		const afterEventType = result.indexOf("ses_abc")
		const beforeEventType = result.indexOf("session.status")
		const spacing = afterEventType - beforeEventType - "session.status".length
		expect(spacing).toBeGreaterThan(0)
	})

	it("handles unknown event types gracefully", () => {
		const event: SSEEventInfo = {
			type: "unknown.event",
			properties: {
				foo: "bar",
			},
		}

		const result = formatSSEEvent(event)
		expect(result).toContain("unknown.event")
	})
})
