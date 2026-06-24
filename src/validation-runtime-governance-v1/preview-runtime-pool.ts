/**
 * Validation Runtime Governance V1 — shared preview runtime pool.
 */

export interface PreviewRuntimeLease {
  leaseId: string;
  url: string;
  port: number;
  workspaceKey: string;
  reused: boolean;
  startedAt: number;
}

interface PreviewRuntimeEntry {
  url: string;
  port: number;
  workspaceKey: string;
  startedAt: number;
  leaseCount: number;
}

const previewPool = new Map<string, PreviewRuntimeEntry>();
let leaseCounter = 0;

export function resetPreviewRuntimePoolForTests(): void {
  previewPool.clear();
  leaseCounter = 0;
}

export function getPreviewRuntimePoolStats(): {
  activeServers: number;
  totalLeases: number;
  reuseCount: number;
} {
  let totalLeases = 0;
  let reuseCount = 0;
  for (const entry of previewPool.values()) {
    totalLeases += entry.leaseCount;
    if (entry.leaseCount > 1) reuseCount += entry.leaseCount - 1;
  }
  return { activeServers: previewPool.size, totalLeases, reuseCount };
}

/**
 * Attach to existing preview runtime when available; otherwise register new lease.
 * New server startup requires explicit justification when pool has compatible entry.
 */
export function acquirePreviewRuntime(input: {
  workspaceKey: string;
  url?: string;
  port?: number;
  forceNew?: boolean;
  justification?: string;
}): PreviewRuntimeLease {
  const key = input.workspaceKey.replace(/\\/g, '/');
  const existing = previewPool.get(key);

  if (existing && !input.forceNew) {
    existing.leaseCount += 1;
    leaseCounter += 1;
    return {
      leaseId: `preview-lease-${leaseCounter}`,
      url: existing.url,
      port: existing.port,
      workspaceKey: key,
      reused: true,
      startedAt: existing.startedAt,
    };
  }

  if (input.forceNew && !input.justification) {
    throw new Error(
      `New preview server for "${key}" requires justification when governance reuse is active.`,
    );
  }

  const url = input.url ?? `http://127.0.0.1:${input.port ?? 4173}`;
  const port = input.port ?? 4173;
  const entry: PreviewRuntimeEntry = {
    url,
    port,
    workspaceKey: key,
    startedAt: Date.now(),
    leaseCount: 1,
  };
  previewPool.set(key, entry);
  leaseCounter += 1;

  return {
    leaseId: `preview-lease-${leaseCounter}`,
    url,
    port,
    workspaceKey: key,
    reused: false,
    startedAt: entry.startedAt,
  };
}

export function releasePreviewRuntime(workspaceKey: string): void {
  const key = workspaceKey.replace(/\\/g, '/');
  const entry = previewPool.get(key);
  if (!entry) return;
  entry.leaseCount -= 1;
  if (entry.leaseCount <= 0) {
    previewPool.delete(key);
  }
}

export function getExistingPreviewRuntime(workspaceKey: string): PreviewRuntimeLease | null {
  const key = workspaceKey.replace(/\\/g, '/');
  const entry = previewPool.get(key);
  if (!entry) return null;
  return {
    leaseId: `preview-existing-${key}`,
    url: entry.url,
    port: entry.port,
    workspaceKey: key,
    reused: true,
    startedAt: entry.startedAt,
  };
}
