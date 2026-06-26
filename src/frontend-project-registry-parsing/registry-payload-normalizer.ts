/**
 * Frontend Project Registry Parsing V1 — normalize API payloads for UI consumption.
 */

export interface NormalizedProjectRegistryItem {
  projectId: string;
  name: string;
  status: string;
  summary: string;
  createdAt: string;
  lastActivityAt: string;
  isActive: boolean;
}

export interface NormalizedProjectRegistryPayload {
  readOnly: true;
  ok: boolean;
  projects: NormalizedProjectRegistryItem[];
  activeProjectId: string | null;
  total: number;
  active: number;
  registryPath: string | null;
  updatedAt: string | null;
  multiProjectWorkspaces?: unknown;
}

function resolveActiveProjectId(payload: Record<string, unknown>): string | null {
  const projectsField = payload.projects as Record<string, unknown> | unknown[] | undefined;
  const registry = payload.registry as { activeProjectId?: string | null; projects?: unknown[] } | undefined;
  if (typeof payload.activeProjectId === 'string' && payload.activeProjectId.trim()) {
    return payload.activeProjectId.trim();
  }
  if (
    projectsField &&
    !Array.isArray(projectsField) &&
    typeof projectsField.activeProjectId === 'string' &&
    projectsField.activeProjectId.trim()
  ) {
    return projectsField.activeProjectId.trim();
  }
  if (registry?.activeProjectId) return registry.activeProjectId;
  return null;
}

function mapRecordToItem(
  record: Record<string, unknown>,
  activeProjectId: string | null,
): NormalizedProjectRegistryItem | null {
  const projectId = typeof record.projectId === 'string' ? record.projectId.trim() : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!projectId || !name) return null;
  const status = typeof record.status === 'string' ? record.status : 'ACTIVE';
  if (status !== 'ACTIVE') return null;
  return {
    projectId,
    name,
    status,
    summary: typeof record.summary === 'string' ? record.summary : '',
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    lastActivityAt:
      typeof record.lastActivityAt === 'string'
        ? record.lastActivityAt
        : typeof record.createdAt === 'string'
          ? record.createdAt
          : '',
    isActive: projectId === activeProjectId,
  };
}

function listFromRawRecords(
  rawList: unknown[],
  activeProjectId: string | null,
): NormalizedProjectRegistryItem[] {
  const items: NormalizedProjectRegistryItem[] = [];
  for (const entry of rawList) {
    if (!entry || typeof entry !== 'object') continue;
    const mapped = mapRecordToItem(entry as Record<string, unknown>, activeProjectId);
    if (mapped) items.push(mapped);
  }
  return items;
}

export function normalizeRegistryPayload(
  payload: Record<string, unknown> | null | undefined,
): NormalizedProjectRegistryPayload | null {
  if (!payload || payload.ok === false) return null;

  const activeProjectId = resolveActiveProjectId(payload);
  const projectsField = payload.projects as Record<string, unknown> | unknown[] | undefined;
  let projectList: NormalizedProjectRegistryItem[] = [];

  if (
    projectsField &&
    !Array.isArray(projectsField) &&
    Array.isArray(projectsField.items)
  ) {
    projectList = listFromRawRecords(projectsField.items as unknown[], activeProjectId);
  } else if (Array.isArray(projectsField)) {
    projectList = listFromRawRecords(projectsField, activeProjectId);
  } else if (
    payload.registry &&
    typeof payload.registry === 'object' &&
    Array.isArray((payload.registry as { projects?: unknown[] }).projects)
  ) {
    const registryProjects = (payload.registry as { projects: unknown[] }).projects;
    projectList = listFromRawRecords(registryProjects, activeProjectId);
  }

  if (!projectList.length) return null;

  const total =
    typeof payload.total === 'number'
      ? payload.total
      : projectsField &&
          !Array.isArray(projectsField) &&
          typeof projectsField.count === 'number'
        ? projectsField.count
        : projectList.length;

  const active =
    typeof payload.active === 'number'
      ? payload.active
      : projectsField &&
          !Array.isArray(projectsField) &&
          typeof projectsField.activeCount === 'number'
        ? projectsField.activeCount
        : activeProjectId && projectList.some((item) => item.projectId === activeProjectId)
          ? 1
          : 0;

  return {
    readOnly: true,
    ok: true,
    projects: projectList,
    activeProjectId,
    total,
    active,
    registryPath: typeof payload.registryPath === 'string' ? payload.registryPath : null,
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : null,
    multiProjectWorkspaces: payload.multiProjectWorkspaces,
  };
}

export function buildProjectRegistrySummaryFromNormalized(
  normalized: NormalizedProjectRegistryPayload,
): {
  count: number;
  activeCount: number;
  items: NormalizedProjectRegistryItem[];
  activeProjectId: string | null;
} {
  return {
    count: normalized.total,
    activeCount: normalized.active,
    items: normalized.projects,
    activeProjectId: normalized.activeProjectId,
  };
}

export const FRONTEND_PROJECT_REGISTRY_PARSING_PASS_TOKEN =
  'FRONTEND_PROJECT_REGISTRY_PARSING_V1_PASS' as const;
