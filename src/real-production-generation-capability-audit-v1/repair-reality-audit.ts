/**
 * Real Production Generation Capability Audit V1 — repair path reality (read-only).
 */

import { AEO_REPAIR_CAPABILITY_REGISTRY } from '../autonomous-engineering-orchestrator-v1/repair-capability-registry.js';
import type { RepairPathFinding } from './real-production-generation-capability-types.js';

/** Audits whether declared repair capabilities can fix missing feature generation gaps. */
export function buildRepairPathRealityAudit(): RepairPathFinding[] {
  return AEO_REPAIR_CAPABILITY_REGISTRY.map((cap) => {
    const actuallyRepairsMissingFeatureCode =
      cap.capabilityId === 'engineering-intelligence-runtime' ||
      cap.capabilityId === 'build-reality-autofix-engine-v1';

    const revalidationAfterRepair =
      cap.capabilityId === 'contract-bound-generation-authority-v4' ||
      cap.capabilityId === 'build-reality-autofix-engine-v1' ||
      cap.capabilityId === 'engineering-intelligence-runtime' ||
      cap.capabilityId === 'generation-pipeline-compliance-authority-v1';

    let notes = cap.limitations.join(' ');
    if (cap.capabilityId === 'generation-pipeline-compliance-authority-v1') {
      notes += ' Orchestrator re-runs GPCA after workspace mutations; repair plan records revalidation.';
    }
    if (cap.capabilityId === 'engineering-intelligence-runtime') {
      notes += ' EIAA 8-point policy must ALLOW before invocation; not auto-run.';
    }
    if (cap.wiringStatus === 'SIMULATED') {
      notes += ' SIMULATED — does not write production workspace files.';
    }

    return {
      failureClass: cap.failureClassesHandled.join(', '),
      capabilityId: cap.capabilityId,
      productionWired: cap.wiringStatus === 'PRODUCTION_WIRED',
      safeToAutoRun: cap.safeToRunAutomatically,
      actuallyRepairsMissingFeatureCode:
        cap.capabilityId === 'engineering-intelligence-runtime'
          ? true
          : cap.capabilityId === 'build-reality-autofix-engine-v1'
            ? false
            : actuallyRepairsMissingFeatureCode,
      revalidationAfterRepair,
      notes: notes.slice(0, 500),
    };
  });
}

export function buildMissingCapabilityInventory(
  promptResults: import('./real-production-generation-capability-types.js').PromptAuditResult[],
): import('./real-production-generation-capability-types.js').MissingCapabilityFinding[] {
  const workflowGaps = promptResults.flatMap((p) =>
    p.matrixRows.filter((r) => r.featureKind === 'WORKFLOW' && r.status === 'BLOCKED_BY_MISSING_CAPABILITY'),
  ).length;
  const actionGaps = promptResults.flatMap((p) =>
    p.matrixRows.filter((r) => r.featureKind === 'ACTION' && r.status === 'BLOCKED_BY_MISSING_CAPABILITY'),
  ).length;
  const nonFunctionalModules = promptResults.flatMap((p) =>
    p.matrixRows.filter((r) => r.status === 'REACHABLE_BUT_NONFUNCTIONAL'),
  ).length;

  return [
    {
      capability: 'Workflow / multi-step state machine generation',
      evidence: `${workflowGaps} workflow rows blocked across ${promptResults.length} prompts`,
      severity: 'CRITICAL',
      promptsAffected: promptResults.map((p) => p.scenario.id),
      approvedFeaturesAffected: workflowGaps,
      blocksAppGeneration: false,
    },
    {
      capability: 'Executable action handler generation from contract coreActions',
      evidence: `${actionGaps} action rows blocked; others partial (copy only)`,
      severity: 'HIGH',
      promptsAffected: promptResults.map((p) => p.scenario.id),
      approvedFeaturesAffected: actionGaps,
      blocksAppGeneration: false,
    },
    {
      capability: 'Persistence / CRUD service implementation',
      evidence: `${nonFunctionalModules} modules reachable but nonfunctional; services return []`,
      severity: 'CRITICAL',
      promptsAffected: promptResults.map((p) => p.scenario.id),
      approvedFeaturesAffected: nonFunctionalModules,
      blocksAppGeneration: false,
    },
    {
      capability: 'Domain-specific business logic (scheduling, calculations beyond calculator kind)',
      evidence: 'Booking/inventory/restaurant prompts receive generic CRUD shells',
      severity: 'HIGH',
      promptsAffected: promptResults.filter((p) => p.scenario.id !== 'unit-conversion').map((p) => p.scenario.id),
      approvedFeaturesAffected: promptResults.reduce((n, p) => n + p.approvedModuleCount, 0),
      blocksAppGeneration: false,
    },
    {
      capability: 'Behavioral interaction proof per approved workflow',
      evidence: 'Playwright proof uses generic first-control click — not run in offline audit',
      severity: 'MEDIUM',
      promptsAffected: ['*'],
      approvedFeaturesAffected: 0,
      blocksAppGeneration: false,
    },
  ];
}
