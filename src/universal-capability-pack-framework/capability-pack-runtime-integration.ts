/**
 * Universal Capability Pack Framework V1 — B5 runtime integration.
 */

export const CAPABILITY_PACK_RUNTIME_EVENT_TYPES = [
  'capability/register',
  'capability/initialize',
  'capability/ready',
  'capability/blocked',
  'capability/failure',
  'capability/reset',
  'pack/configure',
  'pack/materialize',
  'pack/verify',
  'pack/unload',
] as const;

export type CapabilityPackRuntimeEventType = (typeof CAPABILITY_PACK_RUNTIME_EVENT_TYPES)[number];

export const CAPABILITY_PACK_RUNTIME_PROVENANCE = 'UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_V1' as const;
