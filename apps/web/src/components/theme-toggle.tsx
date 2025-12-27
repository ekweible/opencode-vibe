"use client"

/**
 * Theme toggle button for switching between light/dark modes
 *
 * Uses next-themes for SSR-safe theme switching.
 * Displays Sun icon in light mode, Moon icon in dark mode.
 * Persists preference to localStorage automatically.
 */

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

/**
 * ThemeToggle component
 *
 * Renders a button that toggles between light and dark themes.
 * Icons animate on theme change with rotation and scale transitions.
 */
export function ThemeToggle() {
	const { theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	// Avoid hydration mismatch by only rendering after mount
	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return (
			<Button variant="ghost" size="icon" aria-label="Toggle theme">
				<Sun className="h-5 w-5" />
			</Button>
		)
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			aria-label="Toggle theme"
		>
			<Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
		</Button>
	)
}
