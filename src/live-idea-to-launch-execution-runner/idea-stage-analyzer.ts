/**
 * IDEA stage analyzer — founder requests, goals, requirements, project vault.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { RequirementsToPlanContractReport } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import { STAGE_CONFIRM_THRESHOLD, STAGE_PARTIAL_THRESHOLD } from './live-idea-to-launch-execution-runner-registry.js';
import type {
  StageAnalysis,
  StageEvidenceEntry,
  StageEvidenceLevel,
} from './live-idea-to-launch-execution-runner-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzeIdeaStage(input: {
  contract: RequirementsToPlanContractReport | null;
  founderTest: FounderTestAssessment | null;
}): StageAnalysis {
  const evidence: StageEvidenceEntry[] = [];
  const missingEvidence: string[] = [];
  const weakEvidence: string[] = [];
  const sources: string[] = [];
  let score = 0;

  const vault = getDevPulseV2ProjectVaultAuthority();
  const projects = vault.listProjects();
  evidence.push(
    entry(
      'Project vault records',
      `${projects.length} project(s)`,
      projects.length > 0,
      'project-vault',
    ),
  );
  if (projects.length > 0) {
    score += 15;
    sources.push('project-vault');
  } else {
    missingEvidence.push('No project vault records observed');
  }

  if (input.contract) {
    sources.push('requirements-to-plan-execution-contract');
    const idea = input.contract.userIdea;
    const reqs = input.contract.requirementContract;
    evidence.push(
      entry('Founder idea captured', idea.ideaId, idea.status === 'CAPTURED', 'requirements-to-plan-execution-contract'),
      entry(
        'Requirements extracted',
        `${reqs?.requirements.length ?? 0} requirement(s)`,
        (reqs?.requirements.length ?? 0) > 0,
        'requirements-to-plan-execution-contract',
      ),
      entry(
        'Idea-to-requirement linkage',
        String(input.contract.linkageAnalysis.ideaToRequirements),
        input.contract.linkageAnalysis.ideaToRequirements,
        'requirements-to-plan-execution-contract',
      ),
      entry(
        'Contract proof level',
        input.contract.proofLevel,
        input.contract.proofLevel !== 'NOT_PROVEN',
        'requirements-to-plan-execution-contract',
      ),
    );
    if (idea.status === 'CAPTURED') score += 25;
    else weakEvidence.push('User idea INSUFFICIENT_INPUT');
    if ((reqs?.requirements.length ?? 0) > 0) score += 30;
    else missingEvidence.push('No requirements extracted from founder idea');
    if (input.contract.linkageAnalysis.ideaToRequirements) score += 20;
    else missingEvidence.push('Idea not linked to requirements');
    if (input.contract.proofLevel === 'PROVEN') score = Math.max(score, 90);
    else if (input.contract.proofLevel === 'PARTIAL') score = Math.max(score, 60);
    missingEvidence.push(...input.contract.missingEvidence.filter((m) => /idea|requirement/i.test(m)).slice(0, 3));
  } else {
    missingEvidence.push('Requirements-to-plan contract not assessed');
  }

  if (input.founderTest) {
    sources.push('founder-test-integration');
    const req = input.founderTest.run.authorityResults.find((r) => r.authorityId === 'REQUIREMENT_REALITY');
    evidence.push(
      entry(
        'Requirement Reality authority',
        req?.available ? `${req.normalizedScore}/100` : 'unavailable',
        req?.available ?? false,
        'founder-test-integration',
      ),
    );
    if (req?.available) {
      score = Math.max(score, Math.round((score + req.normalizedScore) / 2));
      if (req.normalizedScore < STAGE_PARTIAL_THRESHOLD) {
        weakEvidence.push(`Requirement Reality score ${req.normalizedScore}/100 below threshold`);
      }
    }
  }

  score = Math.min(100, score);
  let evidenceLevel: StageEvidenceLevel = 'MISSING';
  if (score >= STAGE_CONFIRM_THRESHOLD) evidenceLevel = 'CONFIRMED';
  else if (score >= STAGE_PARTIAL_THRESHOLD) evidenceLevel = 'PARTIAL';

  const confirmed =
    (evidenceLevel === 'CONFIRMED' || input.contract?.proofLevel === 'PROVEN') &&
    Boolean(input.contract?.linkageAnalysis.ideaToRequirements) &&
    (input.contract?.requirementContract?.requirements.length ?? 0) > 0;

  return {
    readOnly: true,
    stage: 'IDEA',
    evidenceLevel,
    confirmed,
    score,
    sourceAuthorities: [...new Set(sources)],
    evidence,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 8),
    weakEvidence: [...new Set(weakEvidence)].slice(0, 6),
    recommendedFix:
      confirmed
        ? 'Maintain founder idea and requirement extraction evidence.'
        : 'Capture founder idea and extract linked requirements before planning claims.',
  };
}
