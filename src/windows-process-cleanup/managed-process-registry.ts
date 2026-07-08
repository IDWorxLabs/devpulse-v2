/**
 * General Windows Process Cleanup V1 — tracked managed process registry.
 */

import type { ManagedProcessHandle } from './windows-process-cleanup-types.js';

const tracked = new Set<ManagedProcessHandle>();

export function registerManagedProcess(handle: ManagedProcessHandle): void {
  tracked.add(handle);
}

export function unregisterManagedProcess(handle: ManagedProcessHandle): void {
  tracked.delete(handle);
}

export function listTrackedManagedProcesses(): readonly ManagedProcessHandle[] {
  return [...tracked];
}

export async function stopAllTrackedManagedProcesses(): Promise<void> {
  const handles = [...tracked];
  await Promise.all(handles.map((handle) => handle.stop().catch(() => undefined)));
}

export function resetManagedProcessRegistryForTests(): void {
  tracked.clear();
}
