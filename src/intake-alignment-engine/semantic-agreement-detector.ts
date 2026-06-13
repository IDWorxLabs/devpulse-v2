/**
 * Semantic Agreement Detector — same-meaning detection across sources (V1).
 */

import { detectProductDomain, normalizeRole } from './evidence-normalizer.js';
import type {
  AlignmentEvidenceBundle,
  ClassifiedConflict,
  SemanticAgreementItem,
} from './intake-alignment-types.js';
import type { EvidenceConflict } from '../unified-intake-intelligence/unified-intake-types.js';
import type { PlatformAlignmentResult, RoleAlignmentResult, WorkflowAlignmentResult } from './intake-alignment-types.js';

let agreementCounter = 0;
let conflictCounter = 0;

export function resetSemanticAgreementCountersForTests(): void {
  agreementCounter = 0;
  conflictCounter = 0;
}

export function detectSemanticAgreements(input: {
  bundle: AlignmentEvidenceBundle;
  platformAlignment: PlatformAlignmentResult;
  roleAlignment: RoleAlignmentResult;
  workflowAlignment: WorkflowAlignmentResult;
}): SemanticAgreementItem[] {
  const agreements: SemanticAgreementItem[] = [];
  const push = (
    dimension: SemanticAgreementItem['dimension'],
    description: string,
    sources: string[],
    confidence: number,
  ) => {
    agreementCounter += 1;
    agreements.push({
      readOnly: true,
      agreementId: `agreement-${agreementCounter}`,
      dimension,
      description,
      sources,
      confidence,
    });
  };

  const domain = detectProductDomain(input.bundle.typedPrompt);
  if (domain) {
    push('PRODUCT_INTENT', `Sources describe ${domain} product domain`, input.bundle.sources.slice(0, 3), 82);
  }

  if (input.platformAlignment.alignmentScore >= 70 && !input.platformAlignment.truePlatformConflict) {
    push(
      'PLATFORM',
      `Platform evidence aligns on ${input.platformAlignment.platforms.join(', ')}`,
      input.bundle.sources.filter((s) => s.includes('VISUAL') || s.includes('VOICE') || s.includes('TYPED')),
      input.platformAlignment.alignmentScore,
    );
  }

  if (input.roleAlignment.highRoleAlignment) {
    push(
      'ROLE',
      `Roles are complementary: ${input.roleAlignment.normalizedRoles.join(', ')}`,
      ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
      input.roleAlignment.roleAlignmentScore,
    );
  }

  if (input.workflowAlignment.workflowAlignmentScore >= 65) {
    push(
      'WORKFLOW',
      `Workflows support same product journeys: ${input.workflowAlignment.workflows.slice(0, 4).join(', ')}`,
      [...input.bundle.sources],
      input.workflowAlignment.workflowAlignmentScore,
    );
  }

  const voiceRoles = input.bundle.roles.filter((r) => /driver|rider|user|customer/i.test(r));
  const typedTransport = /ride.?shar|uber|transport|driver|rider/i.test(input.bundle.typedPrompt);
  if (typedTransport && voiceRoles.length >= 1) {
    push(
      'MEANING',
      'Typed prompt and voice notes describe the same transportation marketplace actors',
      ['TYPED_PROMPT', 'VOICE_NOTES_INTELLIGENCE'],
      90,
    );
  }

  return agreements;
}

export function classifyConflicts(input: {
  bundle: AlignmentEvidenceBundle;
  platformAlignment: PlatformAlignmentResult;
  roleAlignment: RoleAlignmentResult;
  semanticAgreements: readonly SemanticAgreementItem[];
}): ClassifiedConflict[] {
  return input.bundle.conflicts.map((conflict) => classifySingleConflict(conflict, input));
}

function classifySingleConflict(
  conflict: EvidenceConflict,
  input: {
    bundle: AlignmentEvidenceBundle;
    platformAlignment: PlatformAlignmentResult;
    roleAlignment: RoleAlignmentResult;
    semanticAgreements: readonly SemanticAgreementItem[];
  },
): ClassifiedConflict {
  conflictCounter += 1;
  let classification: ClassifiedConflict['classification'] = 'REAL_CONFLICT';
  let reason = 'Evidence sources genuinely disagree.';

  if (conflict.conflictType === 'PLATFORM_CONFLICT') {
    if (!input.platformAlignment.truePlatformConflict) {
      classification = 'FALSE_CONFLICT';
      reason = 'Mobile visual and transportation product intent align; web signal is not primary launch target.';
    } else if (/\bweb.?only\b|\bdesktop users\b|\bbrowser only\b/i.test(input.bundle.typedPrompt)) {
      classification = 'REAL_CONFLICT';
      reason = 'Typed prompt explicitly targets web while voice/visual target mobile.';
    }
  }

  if (conflict.conflictType === 'USER_ROLE_CONFLICT') {
    const roles = input.bundle.roles.map((r) => normalizeRole(r));
    if (input.roleAlignment.highRoleAlignment || roles.includes('TRANSPORT_OPERATOR') && roles.includes('END_USER')) {
      classification = 'FALSE_CONFLICT';
      reason = 'Different role labels describe complementary marketplace actors, not contradictory roles.';
    }
  }

  if (conflict.conflictType === 'INTEGRATION_CONFLICT') {
    const typed = input.bundle.typedPrompt.toLowerCase();
    if (input.semanticAgreements.some((a) => a.dimension === 'PRODUCT_INTENT') && /stripe|payment/.test(typed)) {
      classification = 'FALSE_CONFLICT';
      reason = 'Integration lists differ in wording but payment intent is consistent.';
    }
  }

  if (input.semanticAgreements.filter((a) => a.confidence >= 85).length >= 2 && classification === 'REAL_CONFLICT') {
    if (conflict.conflictType !== 'PLATFORM_CONFLICT' || !input.platformAlignment.truePlatformConflict) {
      classification = 'FALSE_CONFLICT';
      reason = 'Multiple semantic agreements indicate sources describe the same product from different angles.';
    }
  }

  return {
    readOnly: true,
    conflictId: `classified-${conflictCounter}`,
    originalConflict: conflict,
    classification,
    reason,
    evidence: [...conflict.conflictingEvidence, classification],
  };
}
