/**
 * React hooks for OpenCode
 */

// Legacy hooks (Zustand + Router pattern)
export { useSession, useSessionList } from "./use-session"
export { useCreateSession } from "./use-create-session"
export { useProvider } from "./use-provider"
export { useMessages } from "./use-messages"
export { useMessagesWithParts } from "./use-messages-with-parts"
export {
	useSendMessage,
	type UseSendMessageOptions,
	type UseSendMessageReturn,
	type ModelSelection,
} from "./use-send-message"
export { useSessionStatus, type SessionStatus } from "./use-session-status"
export {
	useProviders,
	type UseProvidersReturn,
	type Provider,
	type Model,
} from "./use-providers"
export type { ProviderData, UseProviderResult } from "./use-provider"
export {
	useFileSearch,
	type UseFileSearchOptions,
	type UseFileSearchResult,
} from "./use-file-search"
export { useMultiServerSSE } from "./use-multi-server-sse"
export { useSubscription } from "./use-subscription"
export { useSessionMessages } from "./use-session-messages"
export { useLiveTime } from "./use-live-time"
export { useContextUsage } from "./use-context-usage"
export { useCompactionState } from "./use-compaction-state"
export { useCommands } from "./use-commands"
export { useSubagent } from "./use-subagent"
export { useSubagentSync } from "./use-subagent-sync"

// New Effect-based hooks (bridge Effect programs to React state)
export {
	useSessionList as useSessionListEffect,
	type UseSessionListOptions,
	type UseSessionListReturn,
} from "./use-session-list"
export {
	useMessagesEffect,
	type UseMessagesEffectOptions,
	type UseMessagesEffectReturn,
} from "./use-messages-effect"
export {
	usePartsEffect,
	type UsePartsEffectOptions,
	type UsePartsEffectReturn,
} from "./use-parts-effect"
export {
	useProvidersEffect,
	type UseProvidersEffectReturn,
	type Provider as ProviderEffect,
	type Model as ModelEffect,
} from "./use-providers-effect"
export {
	useProjectsEffect,
	useCurrentProjectEffect,
	type UseProjectsEffectReturn,
	type UseCurrentProjectEffectReturn,
	type Project as ProjectEffect,
} from "./use-projects-effect"
export {
	useServersEffect,
	useCurrentServerEffect,
	type UseServersEffectReturn,
	type UseCurrentServerEffectReturn,
	type ServerInfo,
} from "./use-servers-effect"
export {
	useSSEEffect,
	type UseSSEEffectOptions,
	type UseSSEEffectReturn,
} from "./use-sse-effect"
export {
	useSubagentsEffect,
	type UseSubagentsEffectReturn,
	type SubagentSession,
	type SubagentState,
} from "./use-subagents-effect"
