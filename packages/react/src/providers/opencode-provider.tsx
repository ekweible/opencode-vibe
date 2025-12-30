/**
 * OpencodeProvider stub for packages/react
 * Minimal implementation - full version is app-specific
 */

"use client"

import { createContext, useContext, type ReactNode } from "react"

export interface OpencodeContextValue {
	url: string
	directory: string
	ready: boolean
	sync: (sessionID: string) => Promise<void>
}

const OpencodeContext = createContext<OpencodeContextValue | null>(null)

export interface OpencodeProviderProps {
	url: string
	directory: string
	children: ReactNode
}

export function OpencodeProvider({ url, directory, children }: OpencodeProviderProps) {
	const value: OpencodeContextValue = {
		url,
		directory,
		ready: true,
		sync: async () => {},
	}

	return <OpencodeContext.Provider value={value}>{children}</OpencodeContext.Provider>
}

export function useOpencode() {
	const context = useContext(OpencodeContext)
	if (!context) {
		throw new Error("useOpencode must be used within OpencodeProvider")
	}
	return context
}
