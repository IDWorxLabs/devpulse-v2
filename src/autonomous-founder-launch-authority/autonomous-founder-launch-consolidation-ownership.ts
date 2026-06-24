/**
 * Autonomous Founder Launch Authority consolidation ownership — Phase Next V1.
 * Canonical owner of launch decision, verdict, confidence, and readiness state.
 */

export const AFLA_CANONICAL_OWNERSHIP_STATUS = 'CANONICAL' as const;

export const AFLA_CANONICAL_RESPONSIBILITIES = [
  'Launch Decision',
  'Launch Approval',
  'Launch Blockers',
  'Launch Verdicts',
  'Launch Confidence',
  'Launch Readiness State',
] as const;

export const AFLA_CONSOLIDATED_CAPABILITIES = [
  'Launch Readiness Authority',
  'Founder Launch Decision Authority',
] as const;

export interface AutonomousFounderLaunchConsolidationOwnership {
  readOnly: true;
  capability: 'Autonomous Founder Launch Authority';
  status: typeof AFLA_CANONICAL_OWNERSHIP_STATUS;
  responsibilities: typeof AFLA_CANONICAL_RESPONSIBILITIES;
  consolidatedCapabilities: typeof AFLA_CONSOLIDATED_CAPABILITIES;
  consumers: readonly string[];
}

export function getAutonomousFounderLaunchConsolidationOwnership(): AutonomousFounderLaunchConsolidationOwnership {
  return {
    readOnly: true,
    capability: 'Autonomous Founder Launch Authority',
    status: AFLA_CANONICAL_OWNERSHIP_STATUS,
    responsibilities: AFLA_CANONICAL_RESPONSIBILITIES,
    consolidatedCapabilities: AFLA_CONSOLIDATED_CAPABILITIES,
    consumers: ['Launch Council', 'Launch Readiness Authority (delegated)', 'Founder Launch Decision Authority'],
  };
}
