/**
 * Evidence Conflict Detector — cross-source contradiction detection (V1).
 */

import type {
  AssessUnifiedIntakeInput,
  ConsolidatedIntakeEvidence,
  EvidenceConflict,
} from './unified-intake-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function platformBucket(value: string): 'MOBILE' | 'WEB' | 'DESKTOP' | 'UNKNOWN' {
  const upper = value.toUpperCase();
  if (/IOS|ANDROID|MOBILE|IPHONE/.test(upper)) return 'MOBILE';
  if (/WEB|BROWSER|SITE/.test(upper)) return 'WEB';
  if (/DESKTOP/.test(upper)) return 'DESKTOP';
  return 'UNKNOWN';
}

function collectPlatformSignals(input: {
  evidence: ConsolidatedIntakeEvidence;
  typedPrompt?: AssessUnifiedIntakeInput['typedPrompt'];
  voiceNotesAnalysis?: AssessUnifiedIntakeInput['voiceNotesAnalysis'];
  visualReferenceAnalysis?: AssessUnifiedIntakeInput['visualReferenceAnalysis'];
}): { source: string; bucket: string; raw: string }[] {
  const signals: { source: string; bucket: string; raw: string }[] = [];

  if (input.typedPrompt?.rawPrompt) {
    const text = input.typedPrompt.rawPrompt.toLowerCase();
    if (/\bweb app\b|\bweb\b|\bbrowser\b/.test(text)) signals.push({ source: 'TYPED_PROMPT', bucket: 'WEB', raw: 'web app' });
    if (/\bmobile app\b|\bios\b|\bandroid\b/.test(text)) signals.push({ source: 'TYPED_PROMPT', bucket: 'MOBILE', raw: 'mobile app' });
  }

  for (const p of input.evidence.platforms) {
    signals.push({ source: 'CONSOLIDATED', bucket: platformBucket(p), raw: p });
  }

  if (input.voiceNotesAnalysis) {
    for (const p of input.voiceNotesAnalysis.projectUnderstanding.platformTargets) {
      signals.push({ source: 'VOICE_NOTES_INTELLIGENCE', bucket: platformBucket(p), raw: p });
    }
  }

  if (input.visualReferenceAnalysis) {
    signals.push({
      source: 'VISUAL_REFERENCE_INTELLIGENCE',
      bucket: platformBucket(input.visualReferenceAnalysis.screenDetection.platform),
      raw: input.visualReferenceAnalysis.screenDetection.platform,
    });
  }

  return signals.filter((s) => s.bucket !== 'UNKNOWN');
}

export function detectEvidenceConflicts(input: {
  evidence: ConsolidatedIntakeEvidence;
  typedPrompt?: AssessUnifiedIntakeInput['typedPrompt'];
  voiceNotesAnalysis?: AssessUnifiedIntakeInput['voiceNotesAnalysis'];
  visualReferenceAnalysis?: AssessUnifiedIntakeInput['visualReferenceAnalysis'];
}): EvidenceConflict[] {
  const conflicts: EvidenceConflict[] = [];

  const platformSignals = collectPlatformSignals(input);
  const buckets = new Set(platformSignals.map((s) => s.bucket));
  if (buckets.has('MOBILE') && buckets.has('WEB') && buckets.size >= 2) {
    const mobileSources = platformSignals.filter((s) => s.bucket === 'MOBILE').map((s) => `${s.source}:${s.raw}`);
    const webSources = platformSignals.filter((s) => s.bucket === 'WEB').map((s) => `${s.source}:${s.raw}`);
    conflicts.push({
      readOnly: true,
      conflictType: 'PLATFORM_CONFLICT',
      description: 'Intake sources disagree on primary platform target (mobile vs web).',
      conflictingEvidence: [...mobileSources, ...webSources],
      confidence: clamp(70 + platformSignals.length * 5),
      recommendedClarification: 'Clarify whether the primary launch target is mobile, web, or both with distinct experiences.',
    });
  }

  const typedRoles = input.typedPrompt?.userRoles ?? [];
  const voiceRoles = input.voiceNotesAnalysis?.requirements.userRoles ?? [];
  if (typedRoles.length > 0 && voiceRoles.length > 0) {
    const typedSet = new Set(typedRoles.map((r) => r.toLowerCase()));
    const overlap = voiceRoles.filter((r) => typedSet.has(r.toLowerCase()));
    if (overlap.length === 0) {
      conflicts.push({
        readOnly: true,
        conflictType: 'USER_ROLE_CONFLICT',
        description: 'Typed prompt and voice notes describe different user roles.',
        conflictingEvidence: [
          `TYPED_PROMPT:${typedRoles.join(',')}`,
          `VOICE_NOTES:${voiceRoles.join(',')}`,
        ],
        confidence: 68,
        recommendedClarification: 'Confirm the canonical user roles for the product.',
      });
    }
  }

  const typedIntegrations = input.typedPrompt?.integrations ?? [];
  const voiceIntegrations = input.voiceNotesAnalysis?.requirements.integrations ?? [];
  if (typedIntegrations.length > 0 && voiceIntegrations.length > 0) {
    const typedSet = new Set(typedIntegrations.map((i) => i.toLowerCase()));
    const mismatch = voiceIntegrations.some((i) => !typedSet.has(i.toLowerCase()));
    if (mismatch && typedIntegrations.join(',').toLowerCase() !== voiceIntegrations.join(',').toLowerCase()) {
      conflicts.push({
        readOnly: true,
        conflictType: 'INTEGRATION_CONFLICT',
        description: 'Integration requirements differ between typed prompt and voice notes.',
        conflictingEvidence: [
          `TYPED_PROMPT:${typedIntegrations.join(',')}`,
          `VOICE_NOTES:${voiceIntegrations.join(',')}`,
        ],
        confidence: 65,
        recommendedClarification: 'Confirm required third-party integrations and payment providers.',
      });
    }
  }

  return conflicts;
}

export function computeConflictPenalty(conflicts: readonly EvidenceConflict[]): number {
  return conflicts.length * 8 + conflicts.filter((c) => c.conflictType === 'PLATFORM_CONFLICT').length * 6;
}
