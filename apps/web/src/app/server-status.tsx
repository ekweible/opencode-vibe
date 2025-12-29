"use client"

/**
 * Server Status Display Component
 *
 * Client component that shows discovered OpenCode servers.
 * Uses Effect-based discovery hooks from atoms/servers.
 */

import { useServers } from "@/atoms"

export function ServerStatus() {
	const { servers, loading, error } = useServers()

	if (loading) {
		return <div className="text-xs text-muted-foreground">Discovering servers...</div>
	}

	if (error) {
		return (
			<div className="text-xs text-destructive">Server discovery error (using localhost:4056)</div>
		)
	}

	return (
		<div className="text-xs text-muted-foreground">
			{servers.length} server{servers.length !== 1 ? "s" : ""} available
		</div>
	)
}
