/* ─────────────────────────────────────────────────────────
   API service layer — PullO Dashboard
   All calls go through fetch to NEXT_PUBLIC_BACKEND_URL.
   Backend mounts dashboard routes at /dashboard/*
   (see backend/main.py line 182).
   ───────────────────────────────────────────────────────── */

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

import { createClient } from '@/lib/supabase/client'

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (data.session?.access_token) h['Authorization'] = `Bearer ${data.session.access_token}`
  return h
}

/* ── Backend types ──────────────────────────────────── */

export interface Workspace {
  id: string
  name: string
  created_at?: string
  my_role?: 'owner' | 'admin' | 'member'
  logo_url?: string | null
}

export interface ModelToolConfig {
  web_search: boolean
  url_fetch: boolean
  calculator: boolean
  current_datetime: boolean
}

export const BUILTIN_MODEL_TOOLS: { id: keyof ModelToolConfig; label: string; description: string }[] = [
  { id: 'web_search',       label: 'Web Search',   description: 'Search the web.' },
  { id: 'url_fetch',        label: 'URL Reader',   description: 'Read web pages.' },
  { id: 'calculator',       label: 'Calculator',   description: 'Perform calculations.' },
  { id: 'current_datetime', label: 'Date & Time',  description: 'Access the current date and time.' },
]

export function parseToolConfig(raw: unknown): ModelToolConfig {
  const cfg: Record<string, unknown> = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    web_search:       cfg.web_search === true,
    url_fetch:        cfg.url_fetch === true,
    calculator:       false,  // not yet supported on backend
    current_datetime: cfg.current_datetime === true || cfg.datetime === true,
  }
}

export function mergeToolConfig(ui: ModelToolConfig, existing: unknown): Record<string, boolean> {
  const raw: Record<string, unknown> = existing && typeof existing === 'object' ? (existing as Record<string, unknown>) : {}
  const merged: Record<string, boolean> = {}
  for (const key of Object.keys(raw)) {
    merged[key] = raw[key] === true
  }
  merged.web_search       = ui.web_search
  merged.url_fetch        = ui.url_fetch
  merged.current_datetime = ui.current_datetime
  // Remove legacy keys so they don't linger
  delete merged.url_reader
  delete merged.datetime
  return merged
}

export interface Model {
  id: string
  name: string
  server_type?: string
  status?: 'online' | 'offline' | 'connecting'
  system_prompt?: string
  tool_config?: any
  mcp_servers?: any[]
  custom_tools?: any[]
  routing_rules?: any[]
  memory_config?: any
  timeout_secs?: number
  agent_mode?: boolean
  agent_port?: number | null
  created_at?: string
  user_id?: string
  workspace_id?: string
  client_id?: string
  queue_depth?: number
  stats?: { requests?: number; requests_today?: number; success_count?: number; error_count?: number; rate_limited_count?: number; error_rate?: number; avg_latency_ms?: number; p95_latency_ms?: number }
  last_heartbeat?: string | null
}

export interface MCPServer {
  id: string
  workspace_id: string
  name: string
  url: string
  auth_type: 'none' | 'bearer' | 'basic'
  auth_token?: string
  description?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LogEntry {
  id: string
  model_id: { id: string; name: string } | string
  model_name?: string
  method?: string
  latency_ms?: number
  status: number
  status_code?: number
  token_count?: number
  tools_used?: string[]
  created_at: string
  key_id?: string
  workspace_id?: string
  user_id?: string
}

export interface Stats {
  requests_today?: number
  avg_latency_ms?: number
  error_count?: number
  error_rate?: number
  active_models?: number
}

export interface TimeSeriesPoint {
  timestamp: string
  requests: number
  errors: number
  avg_latency_ms: number
  tokens?: number
}

export interface RealtimeStats {
  requests_today?: number
  errors_today?: number
  tokens_today?: number
  avg_latency_ms?: number
  active_keys?: number
}

export interface TeamMember {
  user_id: string
  email?: string
  role: string
  joined_at?: string
  created_at?: string
  display_name?: string
  avatar_url?: string
}

export interface Device {
  id: string
  workspace_id: string
  user_id: string
  device_name: string
  is_active: boolean
  last_seen?: string
  created_at: string
}

export interface PendingInvite {
  id: string
  email: string
  role: string
  created_at?: string
}

export interface ApiKey {
  id: string
  label: string
  prefix?: string
  created_at?: string
  expires_at?: string | null
  allowed_tools?: string[]
  allowed_model_ids?: string[] | null
  daily_budget?: number | null
  rpm_limit?: number | null
  last_used_at?: string | null
  tool_config?: Record<string, unknown> | null
  tokens?: number
  requests?: number
}

export interface QueueDepth {
  model_id: string
  queue_depth: number
}

export interface CreatedKeyResult {
  key: string
  id: string
  label: string
  expires_at: string | null
  message: string
}

/* ── Dashboard page UI types (derived from backend data) ── */

export interface DashboardMetrics {
  requestsToday: number
  requestsChange: number
  activeModels: number
  apiKeys: number
  apiKeysActive: number
  avgLatency: number
  latencyChange: number
}

export interface RecentRequest {
  model: string
  method: string
  latency: string
  status: string
  statusType: 'success' | 'error'
  time: string
}

export interface UsageBucket {
  label: string
  inferences: number
  retrievals: number
  isNow?: boolean
  isProjected?: boolean
}

export async function listApiKeys(workspaceId: string): Promise<ApiKey[]> {
  return listKeys(workspaceId)
}

/* ── Helpers ─────────────────────────────────────────── */

async function handleError(res: Response): Promise<never> {
  let detail = `${res.status} ${res.statusText}`
  try {
    const body = await res.text()
    if (body) detail += ` — ${body.slice(0, 200)}`
  } catch {}
  throw new Error(detail)
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, { headers: await authHeaders() })
  if (!res.ok) await handleError(res)
  return res.json()
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: body != null ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) await handleError(res)
  if (res.status === 204) return undefined as T
  return res.json()
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) await handleError(res)
  if (res.status === 204) return undefined as T
  return res.json()
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) await handleError(res)
}

/* ═══════════════════════════════════════════════════════
   Workspaces
   ═══════════════════════════════════════════════════════ */

export async function listWorkspaces(): Promise<Workspace[]> {
  const body = await get<{ workspaces: Workspace[] }>('/dashboard/workspaces')
  return body.workspaces
}

export async function createWorkspace(name: string): Promise<Workspace> {
  return post<Workspace>('/dashboard/workspaces', { name })
}

export async function getWorkspace(id: string): Promise<Workspace> {
  return get<Workspace>(`/dashboard/workspaces/${id}`)
}

export async function renameWorkspace(id: string, name: string): Promise<Workspace> {
  return apiPatch<Workspace>(`/dashboard/workspaces/${id}`, { name })
}

export async function deleteWorkspace(id: string): Promise<void> {
  return del(`/dashboard/workspaces/${id}`)
}

/* ═══════════════════════════════════════════════════════
   Models (workspace-scoped)
   ═══════════════════════════════════════════════════════ */

export async function listModels(workspaceId: string): Promise<Model[]> {
  const body = await get<{ models: Model[] }>(`/dashboard/workspaces/${workspaceId}/models`)
  return body.models
}

export async function createModel(
  workspaceId: string,
  name: string,
  serverType = 'ollama',
  agentMode = false,
  agentPort?: number,
): Promise<Model> {
  return post<Model>(`/dashboard/workspaces/${workspaceId}/models`, {
    name,
    server_type: serverType,
    agent_mode: agentMode,
    agent_port: agentPort,
  })
}

export async function getModel(workspaceId: string, modelId: string): Promise<Model> {
  return get<Model>(`/dashboard/workspaces/${workspaceId}/models/${modelId}`)
}

export async function updateModel(workspaceId: string, modelId: string, data: Record<string, unknown>): Promise<Model> {
  return apiPatch<Model>(`/dashboard/workspaces/${workspaceId}/models/${modelId}`, data)
}

export async function deleteModel(workspaceId: string, modelId: string): Promise<void> {
  return del(`/dashboard/workspaces/${workspaceId}/models/${modelId}`)
}

export async function getQueueDepth(workspaceId: string, modelId: string): Promise<QueueDepth> {
  return get<QueueDepth>(`/dashboard/workspaces/${workspaceId}/models/${modelId}/queue`)
}

export async function updateSystemPrompt(workspaceId: string, modelId: string, systemPrompt: string): Promise<Model> {
  return apiPatch<Model>(`/dashboard/workspaces/${workspaceId}/models/${modelId}/system-prompt`, {
    system_prompt: systemPrompt,
  })
}

export async function updateTools(workspaceId: string, modelId: string, toolConfig: unknown): Promise<Model> {
  return apiPatch<Model>(`/dashboard/workspaces/${workspaceId}/models/${modelId}/tools`, {
    tool_config: toolConfig,
  })
}

export async function addMCPServer(
  workspaceId: string,
  modelId: string,
  server: { name: string; url: string; auth_type?: string; auth_token?: string },
): Promise<Model> {
  return post<Model>(`/dashboard/workspaces/${workspaceId}/models/${modelId}/mcp-servers`, server)
}

export async function removeMCPServer(workspaceId: string, modelId: string, serverIndex: number): Promise<void> {
  return del(`/dashboard/workspaces/${workspaceId}/models/${modelId}/mcp-servers/${serverIndex}`)
}

/* ═══════════════════════════════════════════════════════
   Workspace MCP Servers
   ═══════════════════════════════════════════════════════ */

export async function listWsMCP(workspaceId: string): Promise<{ servers: MCPServer[] }> {
  return get(`/dashboard/workspaces/${workspaceId}/mcp-servers`)
}

export async function createWsMCP(
  workspaceId: string,
  server: { name: string; url: string; auth_type?: string; auth_token?: string; description?: string; icon?: string },
): Promise<MCPServer> {
  return post(`/dashboard/workspaces/${workspaceId}/mcp-servers`, server)
}

export async function updateWsMCP(
  workspaceId: string,
  serverId: string,
  patch: Partial<MCPServer>,
): Promise<MCPServer> {
  return apiPatch(`/dashboard/workspaces/${workspaceId}/mcp-servers/${serverId}`, patch)
}

export async function deleteWsMCP(workspaceId: string, serverId: string): Promise<void> {
  return del(`/dashboard/workspaces/${workspaceId}/mcp-servers/${serverId}`)
}

/* ═══════════════════════════════════════════════════════
   Workspace Custom Tools
   ═══════════════════════════════════════════════════════ */

export interface CustomTool {
  id: string
  workspace_id: string
  name: string
  description: string
  webhook_url: string
  created_at: string
}

export async function listCustomTools(wsId: string): Promise<CustomTool[]> {
  const body = await get<{ tools: CustomTool[] }>(`/dashboard/workspaces/${wsId}/custom-tools`)
  return body.tools
}

export async function createCustomTool(
  wsId: string,
  tool: { name: string; description: string; webhook_url: string },
): Promise<CustomTool> {
  return post<CustomTool>(`/dashboard/workspaces/${wsId}/custom-tools`, tool)
}

export async function deleteCustomTool(wsId: string, toolId: string): Promise<void> {
  return del(`/dashboard/workspaces/${wsId}/custom-tools/${toolId}`)
}

/* ═══════════════════════════════════════════════════════
   API Keys (workspace-scoped, owner/admin only)
   ═══════════════════════════════════════════════════════ */

export async function listKeys(workspaceId: string): Promise<ApiKey[]> {
  const body = await get<{ keys: Record<string, unknown>[] }>(`/dashboard/workspaces/${workspaceId}/keys`)
  return (body.keys ?? []).map((k) => ({
    ...k,
    prefix: k.key_prefix as string | undefined,
  })) as ApiKey[]
}

export async function listDevices(): Promise<Device[]> {
  const body = await get<{ devices: Device[] }>('/dashboard/devices')
  return body.devices ?? []
}

export async function createKey(
  workspaceId: string,
  options: {
    label?: string
    expires_at?: string | null
    allowed_tools?: string[]
    allowed_model_ids?: string[] | null
    allowed_corsair_plugins?: string[]
    allowed_mcp_server_ids?: string[]
    daily_budget?: number | null
    rpm_limit?: number | null
  } = {},
): Promise<CreatedKeyResult> {
  return post<CreatedKeyResult>(`/dashboard/workspaces/${workspaceId}/keys`, {
    workspace_id: workspaceId,
    ...options,
  })
}

export async function revokeKey(workspaceId: string, keyId: string): Promise<void> {
  return del(`/dashboard/workspaces/${workspaceId}/keys/${keyId}`)
}

export async function revealKey(workspaceId: string, keyId: string): Promise<string> {
  const body = await get<{ key: string }>(`/dashboard/workspaces/${workspaceId}/keys/${keyId}/reveal`)
  return body.key
}

/* ── Browser Runtime config (per API key) ─────────────────────────
   tool_config lives on the API key row. The backend forwards it opaquely
   to the extension in every WS inference payload as payload.tool_config.
   The extension reads payload.tool_config.browser_runtime.enabled_groups.
   ──────────────────────────────────────────────────────────────────── */

export type BrowserRuntimeGroup =
  | 'discovery'
  | 'page_reading'
  | 'navigation'
  | 'interaction'
  | 'visual'
  | 'browser_state'
  | 'auth_fetch'

export interface BrowserRuntimeConfig {
  enabled_groups: BrowserRuntimeGroup[]
}

export const BROWSER_RUNTIME_GROUPS: { id: BrowserRuntimeGroup; label: string; description: string; warning?: string }[] = [
  { id: 'discovery',     label: 'Web Search',   description: 'Search the web for current information.' },
  { id: 'page_reading',  label: 'Page Reading',  description: 'Read text, tables, code, and forms from pages.' },
  { id: 'navigation',    label: 'Navigation',    description: 'Open URLs and navigate between pages.' },
  { id: 'visual',        label: 'Screenshots',   description: 'Capture screenshots of runtime pages.' },
  { id: 'browser_state', label: 'Browser State', description: 'Read URL, title, language, and viewport.' },
  { id: 'auth_fetch',    label: 'Authenticated Fetch', description: 'Fetch URLs using the browser\'s real session cookies.' },
  {
    id: 'interaction',
    label: 'Page Interaction',
    description: 'Click, type, hover, and submit on pages.',
    warning: 'Mutating. Each action requires your confirmation before executing.',
  },
]

/** Read the browser_runtime section of a raw tool_config blob. */
export function parseBrowserRuntimeConfig(rawToolConfig: unknown): BrowserRuntimeConfig {
  const cfg = rawToolConfig && typeof rawToolConfig === 'object' ? rawToolConfig as Record<string, unknown> : {}
  const br = cfg.browser_runtime && typeof cfg.browser_runtime === 'object' ? cfg.browser_runtime as Record<string, unknown> : {}
  const groups = Array.isArray(br.enabled_groups) ? br.enabled_groups.filter((g): g is BrowserRuntimeGroup =>
    ['discovery','page_reading','navigation','interaction','visual','browser_state','auth_fetch'].includes(g as string)
  ) : []
  return { enabled_groups: groups }
}

/**
 * Update the browser_runtime section of an API key's tool_config.
 * Uses a merge-patch — no other tool_config keys are affected.
 * Also emits `config-updated` via postMessage so the extension can react.
 */
export async function updateBrowserRuntimeConfig(
  workspaceId: string,
  keyId: string,
  config: BrowserRuntimeConfig,
): Promise<void> {
  await apiPatch<unknown>(
    `/dashboard/workspaces/${workspaceId}/keys/${keyId}/tool-config`,
    { tool_config: { browser_runtime: config } },
  )
  // Notify the extension via the existing content-script bridge
  if (typeof window !== 'undefined') {
    window.postMessage({
      source: 'pullo-dashboard',
      type: 'config-updated',
      payload: {
        keyId,
        updatedAt: new Date().toISOString(),
        changed: ['browser_runtime'],
      },
    }, '*')
  }
}

/* ═══════════════════════════════════════════════════════
   Logs (workspace-scoped)
   ═══════════════════════════════════════════════════════ */

export async function getLogs(
  workspaceId: string,
  options?: { limit?: number; offset?: number; status_code?: number },
): Promise<{ logs: LogEntry[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams()
  if (options?.limit != null) params.set('limit', String(options.limit))
  if (options?.offset != null) params.set('offset', String(options.offset))
  if (options?.status_code != null) params.set('status_code', String(options.status_code))
  const qs = params.toString()
  return get<{ logs: LogEntry[]; total: number; limit: number; offset: number }>(`/dashboard/workspaces/${workspaceId}/logs${qs ? '?' + qs : ''}`)
}

export async function exportLogs(workspaceId: string): Promise<Blob> {
  const res = await fetch(`${BACKEND}/dashboard/workspaces/${workspaceId}/logs/export`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.blob()
}

/* ═══════════════════════════════════════════════════════
   Stats (workspace-scoped)
   ═══════════════════════════════════════════════════════ */

export async function getStats(workspaceId: string): Promise<Stats> {
  return get<Stats>(`/dashboard/workspaces/${workspaceId}/stats`)
}

export async function getTimeSeries(
  workspaceId: string,
  period = 'day',
  days = 7,
): Promise<{ series: TimeSeriesPoint[] }> {
  return get<{ series: TimeSeriesPoint[] }>(`/dashboard/workspaces/${workspaceId}/stats/time-series?period=${period}&days=${days}`)
}

export async function getRealtime(workspaceId: string): Promise<RealtimeStats> {
  return get<RealtimeStats>(`/dashboard/workspaces/${workspaceId}/stats/realtime`)
}

/* ═══════════════════════════════════════════════════════
   Notifications
   ═══════════════════════════════════════════════════════ */

export interface AppNotification {
  id: string
  user_id: string
  type: 'invite' | 'model_online' | 'model_offline' | 'model_registered'
  title: string
  body?: string
  metadata: {
    workspace_id?: string
    workspace_name?: string
    invite_token?: string
    role?: string
    model_id?: string
    model_name?: string
  }
  read: boolean
  created_at: string
}

export async function listNotifications(): Promise<{ notifications: AppNotification[]; unread_count: number }> {
  return get('/dashboard/notifications')
}

export async function markNotificationRead(id: string): Promise<void> {
  return post(`/dashboard/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  return post('/dashboard/notifications/read-all')
}

/* ═══════════════════════════════════════════════════════
   Team (workspace-scoped, except accept-invite)
   ═══════════════════════════════════════════════════════ */

export async function acceptInvite(
  token: string,
): Promise<{ message: string; workspace_id: string; workspace_name: string }> {
  return get<{ message: string; workspace_id: string; workspace_name: string }>(`/dashboard/team/accept/${token}`)
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role = 'member',
): Promise<{ message: string; invite_id: string }> {
  return post(`/dashboard/workspaces/${workspaceId}/team/invite`, {
    workspace_id: workspaceId,
    email,
    role,
  })
}

export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  role: 'admin' | 'member',
): Promise<void> {
  return apiPatch(`/dashboard/workspaces/${workspaceId}/team/${targetUserId}/role?role=${role}`, {})
}

export async function listTeam(
  workspaceId: string,
): Promise<{ members: TeamMember[]; pending_invites: PendingInvite[] }> {
  return get<{ members: TeamMember[]; pending_invites: PendingInvite[] }>(`/dashboard/workspaces/${workspaceId}/team`)
}

export async function removeMember(workspaceId: string, targetUserId: string): Promise<void> {
  return del(`/dashboard/workspaces/${workspaceId}/team/${targetUserId}`)
}

export async function revokeInvite(workspaceId: string, inviteId: string): Promise<void> {
  return del(`/dashboard/workspaces/${workspaceId}/team/invites/${inviteId}`)
}

/* ═══════════════════════════════════════════════════════
   Corsair / MCP Integration
   ═══════════════════════════════════════════════════════ */

export interface CorsairPlugin {
  plugin_id: string
  plugin_name: string
  auth_type: string
  enabled: boolean
  status: 'connected' | 'not_connected' | 'expired'
  connected_at?: string
}

export interface CorsairConnectResult {
  connect_url: string
  expires_at: string
}

export interface CorsairPluginInfo {
  plugin: string
  name?: string
  description?: string
  auth_type?: string
  source: string
  operations?: string[]
  tools?: any[]
  server_id?: string
  error?: string
}

export async function listCorsairPlugins(wsId: string): Promise<CorsairPlugin[]> {
  const body = await get<{ plugins: CorsairPlugin[] }>(`/dashboard/corsair/status?workspace_id=${wsId}`)
  return body.plugins
}

export async function connectCorsairPlugin(wsId: string, pluginId: string): Promise<CorsairConnectResult> {
  return post<CorsairConnectResult>('/dashboard/corsair/connect', { workspace_id: wsId, plugin_id: pluginId })
}

export async function enableCorsairPlugin(wsId: string, pluginId: string, pluginName: string, authType?: string): Promise<void> {
  return post<void>('/dashboard/corsair/enable', { workspace_id: wsId, plugin_id: pluginId, plugin_name: pluginName, auth_type: authType })
}

export async function disableCorsairPlugin(wsId: string, pluginId: string): Promise<void> {
  return del(`/dashboard/corsair/disable?workspace_id=${wsId}&plugin_id=${pluginId}`)
}

export async function getGatewayPlugins(workspaceId: string): Promise<{ corsair: CorsairPluginInfo[]; mcp: CorsairPluginInfo[] }> {
  return get(`/dashboard/corsair/plugins?workspace_id=${workspaceId}`)
}

export async function refreshMcpServers(workspaceId: string): Promise<void> {
  return post(`/dashboard/mcp-servers/refresh?workspace_id=${workspaceId}`)
}

/* ═══════════════════════════════════════════════════════
   Dashboard page — convenience helpers
   These compose multiple backend calls into the UI shapes
   expected by page.tsx.
   ═══════════════════════════════════════════════════════ */

export async function getDashboardMetrics(workspaceId: string): Promise<DashboardMetrics> {
  const [realtime, models, keys, timeSeries] = await Promise.all([
    getRealtime(workspaceId).catch(() => ({}) as RealtimeStats),
    listModels(workspaceId).catch(() => [] as Model[]),
    listKeys(workspaceId).catch(() => [] as ApiKey[]),
    getTimeSeries(workspaceId, 'day', 2).catch(() => ({ series: [] })),
  ])

  const requestsToday = realtime.requests_today ?? 0

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  let requestsYesterday = 0
  let latencyYesterdayTotal = 0
  let latencyYesterdayCount = 0

  for (const p of timeSeries.series) {
    const ts = new Date(p.timestamp).getTime()
    if (ts < todayStart) {
      requestsYesterday += p.requests || 0
      latencyYesterdayTotal += (p.avg_latency_ms || 0) * (p.requests || 0)
      latencyYesterdayCount += p.requests || 0
    }
  }

  const avgLatency = realtime.avg_latency_ms != null ? realtime.avg_latency_ms / 1000 : 0
  const avgLatencyYesterday = latencyYesterdayCount > 0 ? latencyYesterdayTotal / latencyYesterdayCount / 1000 : 0

  const requestsChange = requestsYesterday > 0
    ? Math.round(((requestsToday - requestsYesterday) / requestsYesterday) * 100)
    : requestsToday > 0 ? 100 : 0

  const latencyChange = parseFloat((avgLatency - avgLatencyYesterday).toFixed(1))

  return {
    requestsToday,
    requestsChange,
    activeModels: models.filter((m) => m.status === 'online').length,
    apiKeys: keys.length,
    apiKeysActive: realtime.active_keys ?? 0,
    avgLatency,
    latencyChange,
  }
}

export async function getRecentRequests(workspaceId: string): Promise<RecentRequest[]> {
  const { logs } = await getLogs(workspaceId, { limit: 20 })
  return logs.map((log) => {
    const modelName = typeof log.model_id === 'object' ? log.model_id.name : log.model_id
    return {
      model: log.model_name || modelName || 'unknown',
      method: log.method || 'CHAT_COMPLETION',
      latency: log.latency_ms != null ? `${log.latency_ms}ms` : '—',
      status: `${log.status}`,
      statusType: log.status < 400 ? 'success' : 'error',
      time: log.created_at ? new Date(log.created_at).toLocaleTimeString() : '—',
    }
  })
}

export type ProfileData = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  plan: string | null
  bio: string | null
  location: string | null
  created_at: string | null
  updated_at: string | null
}

export async function getProfile(): Promise<ProfileData> {
  return get<ProfileData>('/auth/profile')
}

export async function updateProfile(patch: { full_name?: string | null; avatar_url?: string | null; bio?: string | null; location?: string | null }): Promise<ProfileData> {
  return apiPatch<ProfileData>('/auth/profile', patch)
}

export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  const h = await authHeaders()
  delete h['Content-Type']
  const res = await fetch(`${BACKEND}/upload/avatar`, { method: 'POST', headers: h, body: form })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function uploadWorkspaceLogo(workspaceId: string, file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  const h = await authHeaders()
  delete h['Content-Type']
  const res = await fetch(`${BACKEND}/upload/workspace-logo`, { method: 'POST', headers: h, body: form })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function updateWorkspaceLogo(workspaceId: string, logoUrl: string): Promise<Workspace> {
  return apiPatch<Workspace>(`/dashboard/workspaces/${workspaceId}`, { logo_url: logoUrl })
}

export async function getUsageData(workspaceId: string): Promise<UsageBucket[]> {
  const { series } = await getTimeSeries(workspaceId, 'hour', 1)
  return series.map((s, i) => {
    const d = new Date(s.timestamp)
    const label = `${String(d.getHours()).padStart(2, '0')}:00`
    return {
      label,
      inferences: s.requests || 0,
      retrievals: 0,
      isNow: i === series.length - 1,
    }
  })
}

export interface ContactSubmission {
  name: string
  email: string
  message: string
  rating?: number | null
  tags?: string[]
}

export async function submitContactForm(data: ContactSubmission): Promise<{ ok: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch(`${BACKEND}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return { ok: false, error: errData.detail || errData.message || `Server error (${res.status})` }
    }
    const result = await res.json().catch(() => ({}))
    return { ok: true, message: result.message || 'Success' }
  } catch (err: any) {
    return { ok: false, error: 'Backend server is currently offline or unreachable.' }
  }
}
