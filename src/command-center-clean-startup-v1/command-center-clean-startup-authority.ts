/**
 * Command Center Clean Startup V1 — registry/session startup authority.
 */

import type {
  CleanStartupSessionFlags,
  ResolveStartupActiveProjectInput,
  ResumePreviousSessionVisibilityInput,
} from './command-center-clean-startup-types.js';

export function resolveStartupActiveProjectId(
  input: ResolveStartupActiveProjectInput,
): string | null {
  const allowed = new Set(input.registryProjectIds);
  if (
    input.resumeSessionRequested &&
    input.registryActiveProjectId &&
    allowed.has(input.registryActiveProjectId)
  ) {
    return input.registryActiveProjectId;
  }
  if (
    input.userExplicitlySelectedProjectId &&
    allowed.has(input.userExplicitlySelectedProjectId)
  ) {
    return input.userExplicitlySelectedProjectId;
  }
  return null;
}

export function shouldAutoHydrateProjectChat(input: {
  activeProjectId: string | null;
  userExplicitlySelectedProjectId: string | null;
  resumeSessionRequested: boolean;
}): boolean {
  if (!input.activeProjectId) return false;
  if (input.resumeSessionRequested) return true;
  return input.userExplicitlySelectedProjectId === input.activeProjectId;
}

export function shouldUseCachedRegistryFallback(input: CleanStartupSessionFlags): boolean {
  return input.resumeSessionRequested || Boolean(input.userExplicitlySelectedProjectId);
}

export function shouldShowResumePreviousSession(
  input: ResumePreviousSessionVisibilityInput,
): boolean {
  if (input.resumeSessionRequested || input.activeProjectId) return false;
  return input.registryProjectIds.length > 0 || input.hasPersistedSessionHints;
}

export function hasPersistedSessionStorageHints(storage: {
  activeProjectId?: string | null;
  activeProjectName?: string | null;
  registryCachePresent?: boolean;
}): boolean {
  return Boolean(
    storage.activeProjectId ||
      storage.activeProjectName ||
      storage.registryCachePresent,
  );
}
