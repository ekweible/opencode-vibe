/**
 * React hooks for OpenCode
 */

// === Data Fetching ===
export { useSessionList } from "./use-session-list"
export { useSession } from "./use-session"
export { useSessionStatus } from "./use-session-status"
export { useMessages } from "./use-messages"
export { useParts } from "./use-parts"
export {
	useMessagesWithParts,
	type OpencodeMessage,
} from "./use-messages-with-parts"
export {
	useProjects,
	useCurrentProject,
	type UseProjectsReturn,
	type UseCurrentProjectReturn,
	type Project,
} from "./use-projects"
export {
	useServers,
	useCurrentServer,
	type UseServersReturn,
	type UseCurrentServerReturn,
	type ServerInfo,
} from "./use-servers"
export { useProviders } from "./use-providers"

// === Real-time (SSE) ===
export {
	useSSE,
	type UseSSEOptions,
	type UseSSEReturn,
} from "./use-sse"
export {
	useMultiServerSSE,
	type UseMultiServerSSEOptions,
} from "./use-multi-server-sse"

// === Subagents ===
export {
	useSubagents,
	type UseSubagentsReturn,
	type SubagentSession,
	type SubagentState,
} from "./use-subagents"
export {
	useSubagent,
	type UseSubagentOptions,
	type UseSubagentReturn,
} from "./use-subagent"
export {
	useSubagentSync,
	type UseSubagentSyncOptions,
} from "./use-subagent-sync"

// === State Management ===
export { useContextUsage, formatTokens } from "./use-context-usage"
export { useCompactionState } from "./use-compaction-state"

// === Actions ===
export { useSendMessage } from "./use-send-message"
export { useCreateSession } from "./use-create-session"
export { useCommands, type UseCommandsOptions } from "./use-commands"

// === Utilities ===
export { useLiveTime } from "./use-live-time"
export { useFileSearch } from "./use-file-search"
