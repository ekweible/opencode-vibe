import { cn } from "@/lib/utils"

interface FilePillProps {
	path: string
	className?: string
}

/**
 * Non-editable file reference pill for contenteditable contexts.
 *
 * Renders a styled inline pill displaying a file path with @ prefix.
 * Used in prompt inputs to represent file attachments.
 *
 * @example
 * <FilePill path="src/app/page.tsx" />
 * // Renders: @src/app/page.tsx
 */
export function FilePill({ path, className }: FilePillProps) {
	return (
		<span
			data-type="file"
			data-path={path}
			contentEditable="false"
			suppressContentEditableWarning={true}
			className={cn("text-blue-500 cursor-default inline-flex", className)}
		>
			@{path}
		</span>
	)
}
