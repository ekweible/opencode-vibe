/**
 * Re-export prompt parsing utilities from @opencode-vibe/core
 *
 * Prompt parsing utilities have been moved to core package for reuse.
 * This file maintains backward compatibility with existing web app imports.
 */

export {
	parseFromDOM,
	getCursorPosition,
	setCursorPosition,
	renderPartsToDOM,
	detectAtTrigger,
	detectSlashTrigger,
} from "@opencode-vibe/core/utils"
