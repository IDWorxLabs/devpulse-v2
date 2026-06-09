/**
 * Evidence authority store — in-memory evidence registry runtime.
 */

import { buildEvidenceOwnership } from './verification-evidence-ownership.js';
import { emptyEvidenceLineage, linkParentChild } from './verification-evidence-lineage.js';
import type { EvidenceCategory, EvidenceRecord } from './verification-evidence-types.js';

const evidenceRecords = new Map<string, EvidenceRecord>();
const evidenceTypes = new Set<string>();

let evidenceCounter = 0;

export function resetVerificationEvidenceStoreForTests(): void {
  evidenceRecords.clear();
  evidenceTypes.clear();
  evidenceCounter = 0;
}

export function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `vevid-${evidenceCounter.toString().padStart(4, '0')}`;
}

export interface RegisterEvidenceResult {
  ok: boolean;
  record: EvidenceRecord | null;
  duplicate: boolean;
  error: string | null;
}

export function registerEvidence(record: EvidenceRecord): RegisterEvidenceResult {
  if (evidenceRecords.has(record.evidenceId)) {
    return { ok: false, record: null, duplicate: true, error: 'Duplicate evidence id rejected' };
  }
  evidenceRecords.set(record.evidenceId, record);
  evidenceTypes.add(record.evidenceType);
  return { ok: true, record, duplicate: false, error: null };
}

export function getEvidence(evidenceId: string): EvidenceRecord | null {
  return evidenceRecords.get(evidenceId) ?? null;
}

export function listEvidence(): EvidenceRecord[] {
  return [...evidenceRecords.values()];
}

export function listEvidenceByOwner(ownerModule: string): EvidenceRecord[] {
  return listEvidence().filter((r) => r.evidenceOwner.ownerModule === ownerModule);
}

export function listEvidenceByVerification(verificationTargetId: string): EvidenceRecord[] {
  return listEvidence().filter((r) => r.verificationTargetId === verificationTargetId);
}

export function listEvidenceByProject(projectId: string): EvidenceRecord[] {
  return listEvidence().filter((r) => r.evidenceOwner.projectId === projectId);
}

export function listEvidenceByWorkspace(workspaceId: string): EvidenceRecord[] {
  return listEvidence().filter((r) => r.evidenceOwner.workspaceId === workspaceId);
}

export function updateEvidenceRecord(record: EvidenceRecord): EvidenceRecord | null {
  if (!evidenceRecords.has(record.evidenceId)) return null;
  evidenceRecords.set(record.evidenceId, record);
  return record;
}

const TARGET_CATEGORY_MAP: Record<string, EvidenceCategory> = {
  WORLD2_TARGET: 'WORLD2_REPORT',
  PREVIEW_TARGET: 'VERIFICATION_RESULT',
  SELF_VISION_TARGET: 'SELF_VISION_REPORT',
  UI_INSPECTION_TARGET: 'VERIFICATION_REPORT',
  INTERACTION_TARGET: 'EXECUTION_REPORT',
  VISUAL_VERIFICATION_TARGET: 'VERIFICATION_RESULT',
  RUNTIME_TARGET: 'RUNTIME_REPORT',
  COMMAND_CENTER_TARGET: 'VERIFICATION_REPORT',
  PROJECT_VAULT_TARGET: 'VERIFICATION_REPORT',
  OPERATOR_FEED_TARGET: 'TIMELINE_REPORT',
  TRUST_TARGET: 'TRUST_REPORT',
};

export function buildSeedEvidenceRecord(opts: {
  targetId: string;
  targetCategory: string;
  ownerModule: string;
  projectId: string;
  workspaceId: string;
  orchestrationId?: string;
  evidenceType?: EvidenceCategory;
}): EvidenceRecord {
  const evidenceId = nextEvidenceId();
  const category = opts.evidenceType ?? TARGET_CATEGORY_MAP[opts.targetCategory] ?? 'VERIFICATION_RESULT';

  return {
    evidenceId,
    evidenceType: category,
    evidenceSource: `verification_registry:${opts.targetId}`,
    evidenceOwner: buildEvidenceOwnership({
      ownerModule: opts.ownerModule,
      ownerDomain: opts.targetCategory.toLowerCase(),
      producedBy: opts.ownerModule,
      orchestrationId: opts.orchestrationId,
      projectId: opts.projectId,
      workspaceId: opts.workspaceId,
    }),
    evidenceTimestamp: Date.now(),
    evidenceStatus: 'REGISTERED',
    evidenceTrustState: 'UNASSESSED',
    evidenceLineage: emptyEvidenceLineage(),
    evidenceRelationships: [],
    evidenceDependencies: [],
    evidenceProvenance: {
      sourceSystem: 'verification_registry',
      sourceModule: opts.ownerModule,
      sourcePhase: 16.8,
      registrationMethod: 'bootstrap_seed',
    },
    evidenceVisibility: 'PROJECT',
    evidenceUsage: 'PRIMARY',
    verificationTargetId: opts.targetId,
    orchestrationId: opts.orchestrationId,
    authorityOnly: true,
  };
}

export function registerInitialEvidenceFromTargets(
  targets: Array<{
    verificationTargetId: string;
    verificationCategory: string;
    ownerModule: string;
  }>,
  projectId: string,
  workspaceId: string,
  orchestrationId?: string,
): RegisterEvidenceResult[] {
  const results: RegisterEvidenceResult[] = [];

  for (const target of targets) {
    const record = buildSeedEvidenceRecord({
      targetId: target.verificationTargetId,
      targetCategory: target.verificationCategory,
      ownerModule: target.ownerModule,
      projectId,
      workspaceId,
      orchestrationId,
    });
    results.push(registerEvidence(record));
  }

  const visual = results.find((r) => r.record?.verificationTargetId?.includes('visual-verification'));
  if (visual?.record) {
    const screenshot = buildSeedEvidenceRecord({
      targetId: visual.record.verificationTargetId!,
      targetCategory: 'VISUAL_VERIFICATION_TARGET',
      ownerModule: visual.record.evidenceOwner.ownerModule,
      projectId,
      workspaceId,
      orchestrationId,
      evidenceType: 'SCREENSHOT',
    });
    const screenshotResult = registerEvidence(screenshot);
    results.push(screenshotResult);

    if (screenshotResult.record) {
      const linked = linkParentChild(visual.record, screenshotResult.record);
      updateEvidenceRecord(linked.parent);
      updateEvidenceRecord(linked.child);
    }
  }

  const world2 = results.find((r) => r.record?.verificationTargetId?.includes('world2'));
  if (world2?.record) {
    const completion = buildSeedEvidenceRecord({
      targetId: world2.record.verificationTargetId!,
      targetCategory: 'WORLD2_TARGET',
      ownerModule: 'devpulse_v2_world2_completion_runtime',
      projectId,
      workspaceId,
      orchestrationId,
      evidenceType: 'COMPLETION_REPORT',
    });
    completion.completionChainId = 'w2comp-chain-0001';
    completion.world2ChainId = 'w2chain-0001';
    completion.reportId = 'vevrep-completion-0001';
    results.push(registerEvidence(completion));

    if (results[results.length - 1]?.record) {
      const linked = linkParentChild(world2.record, results[results.length - 1]!.record!);
      updateEvidenceRecord(linked.parent);
      updateEvidenceRecord(linked.child);
    }
  }

  return results;
}

export function listRegisteredEvidenceTypes(): string[] {
  return [...evidenceTypes];
}
