/**
 * Re-export prompt types from @opencode-vibe/core
 *
 * Types have been moved to core package for reuse across packages.
 * This file maintains backward compatibility with existing web app imports.
 */

export type {
	TextPart,
	FileAttachmentPart,
	ImageAttachmentPart,
	PromptPart,
	Prompt,
	SlashCommand,
} from "@opencode-vibe/core/types"
