/**
 * Validation Runtime Governance V1 — validation artifact reuse registry.
 */

export type ReusableArtifactType =
  | 'EXECUTION_PROOF'
  | 'VERIFICATION_PROOF'
  | 'BUILD_PROOF'
  | 'BLUEPRINT_PROOF'
  | 'AFLA_ASSESSMENT';

export interface ArtifactReuseEntry {
  artifactType: ReusableArtifactType;
  artifactKey: string;
  fingerprint: string;
  validUntil: number | null;
  sourceValidator: string;
  createdAt: number;
}

const artifactRegistry = new Map<string, ArtifactReuseEntry>();

export function resetArtifactReuseRegistryForTests(): void {
  artifactRegistry.clear();
}

function artifactKey(type: ReusableArtifactType, key: string): string {
  return `${type}:${key}`;
}

export function registerReusableArtifact(entry: Omit<ArtifactReuseEntry, 'createdAt'>): void {
  const fullKey = artifactKey(entry.artifactType, entry.artifactKey);
  artifactRegistry.set(fullKey, { ...entry, createdAt: Date.now() });
}

export function resolveReusableArtifact(input: {
  artifactType: ReusableArtifactType;
  artifactKey: string;
  currentFingerprint: string;
}): { reusable: boolean; entry: ArtifactReuseEntry | null } {
  const fullKey = artifactKey(input.artifactType, input.artifactKey);
  const existing = artifactRegistry.get(fullKey);
  if (!existing) return { reusable: false, entry: null };
  if (existing.validUntil !== null && Date.now() > existing.validUntil) {
    artifactRegistry.delete(fullKey);
    return { reusable: false, entry: null };
  }
  if (existing.fingerprint !== input.currentFingerprint) {
    return { reusable: false, entry: existing };
  }
  return { reusable: true, entry: existing };
}

export function listReusableArtifacts(): readonly ArtifactReuseEntry[] {
  return [...artifactRegistry.values()];
}

export const REUSABLE_ARTIFACT_TYPES: readonly ReusableArtifactType[] = [
  'EXECUTION_PROOF',
  'VERIFICATION_PROOF',
  'BUILD_PROOF',
  'BLUEPRINT_PROOF',
  'AFLA_ASSESSMENT',
];
