/**
 * Autocomplete dropdown for file and command suggestions.
 * Displays above the input with absolute positioning.
 */

import type { SlashCommand } from "@/types/prompt"

interface AutocompleteProps {
	type: "file" | "command" | null
	items: (string | SlashCommand)[]
	selectedIndex: number
	onSelect: (item: string | SlashCommand) => void
}

/**
 * Autocomplete dropdown component
 *
 * @param type - "file" for file paths, "command" for slash commands, null to hide
 * @param items - Array of file paths (strings) or SlashCommand objects
 * @param selectedIndex - Index of currently selected item (for keyboard navigation)
 * @param onSelect - Callback when item is clicked
 *
 * @returns Dropdown UI or null if type is null or items empty
 */
export function Autocomplete({ type, items, selectedIndex, onSelect }: AutocompleteProps) {
	// Don't render if no type or no items
	if (!type || items.length === 0) return null

	return (
		<div className="absolute bottom-full left-0 right-0 mb-2 max-h-80 overflow-auto bg-white dark:bg-gray-900 border rounded-lg shadow-lg">
			{type === "file" && (
				<div role="listbox">
					{(items as string[]).map((path, i) => (
						<button
							key={path}
							type="button"
							className={`flex items-center gap-2 px-3 py-2 cursor-pointer w-full text-left ${
								i === selectedIndex ? "bg-blue-50 dark:bg-blue-900/20" : ""
							}`}
							onClick={() => onSelect(path)}
							role="option"
							aria-selected={i === selectedIndex}
						>
							<span className="text-gray-500">{getDirectory(path)}</span>
							<span className="font-medium">{getFilename(path)}</span>
						</button>
					))}
				</div>
			)}

			{type === "command" && (
				<div role="listbox">
					{(items as SlashCommand[]).map((cmd, i) => (
						<button
							key={cmd.id}
							type="button"
							className={`flex items-center justify-between px-3 py-2 cursor-pointer w-full text-left ${
								i === selectedIndex ? "bg-blue-50 dark:bg-blue-900/20" : ""
							}`}
							onClick={() => onSelect(cmd)}
							role="option"
							aria-selected={i === selectedIndex}
						>
							<div className="flex items-center gap-2">
								<span className="font-medium">/{cmd.trigger}</span>
								{cmd.description && <span className="text-gray-500">{cmd.description}</span>}
							</div>
							<div className="flex items-center gap-2">
								{cmd.type === "custom" && (
									<span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
										custom
									</span>
								)}
								{cmd.keybind && (
									<span className="text-xs text-gray-400">{formatKeybind(cmd.keybind)}</span>
								)}
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	)
}

/**
 * Extract directory path from file path
 * @example getDirectory("src/app/page.tsx") => "src/app/"
 * @example getDirectory("README.md") => ""
 */
function getDirectory(path: string) {
	const parts = path.split("/")
	return parts.slice(0, -1).join("/") + (parts.length > 1 ? "/" : "")
}

/**
 * Extract filename from file path
 * @example getFilename("src/app/page.tsx") => "page.tsx"
 * @example getFilename("README.md") => "README.md"
 */
function getFilename(path: string) {
	return path.split("/").pop() ?? path
}

/**
 * Format keybind string for display
 * Converts "mod" to ⌘ (Mac) or Ctrl (other platforms)
 * @example formatKeybind("mod+shift+s") => "⌘⇧S" (on Mac)
 */
function formatKeybind(keybind: string) {
	const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac")
	return keybind
		.replace("mod", isMac ? "⌘" : "Ctrl")
		.replace("shift", isMac ? "⇧" : "Shift")
		.replace("alt", isMac ? "⌥" : "Alt")
		.replace("+", "")
}
