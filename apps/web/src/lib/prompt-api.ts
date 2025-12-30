/**
 * Re-export prompt API utilities from @opencode-vibe/core
 *
 * Prompt API utilities have been moved to core package for reuse.
 * This file maintains backward compatibility with existing web app imports.
 */

export { convertToApiParts } from "@opencode-vibe/core/utils"
export type { TextPartInput, FilePartInput } from "@opencode-vibe/core/utils"
