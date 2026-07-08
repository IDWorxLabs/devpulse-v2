/**
 * Universal Build Pipeline Verification V1 — blocker classification.
 */

import type { BlockerClass, ClassifiedBlocker, PipelineStageId } from './universal-build-pipeline-types.js';
import { isOverstrictPreBuildBlocker, isSafetyOrStructuralBlocker } from './build-continuation-policy.js';

export function classifyBlocker(input: {
  stage: PipelineStageId;
  reason: string;
  hasGeneratedSource?: boolean;
  hasWorkspaceModules?: boolean;
  selectedProfile?: string | null;
  expectedProfile?: string | null;
  authInjectedWithoutPrompt?: boolean;
}): ClassifiedBlocker {
  const reason = input.reason.trim();
  let blockerClass: BlockerClass = 'LEGITIMATE_BLOCKER';

  if (input.authInjectedWithoutPrompt) {
    blockerClass = 'AUTH_INJECTION_BUG';
  } else if (
    input.selectedProfile === 'EXPENSE_TRACKER_WEB_V1' &&
    input.expectedProfile &&
    input.expectedProfile !== 'EXPENSE_TRACKER_WEB_V1' &&
    input.expectedProfile !== 'FINANCE_TRACKER_WEB_V1'
  ) {
    blockerClass = 'PROFILE_MISROUTE_BLOCKER';
  } else if (/preview gate|live preview.*locked|preview.*blocked/i.test(reason)) {
    blockerClass = 'PREVIEW_GATE_BUG';
  } else if (/planning_failed|PLANNING_FAILED/i.test(reason) && input.hasGeneratedSource) {
    blockerClass = 'WRONG_STAGE_BLOCKER';
  } else if (/stale|outdated evidence|expired/i.test(reason)) {
    blockerClass = 'STALE_EVIDENCE_BLOCKER';
  } else if (/feature reality.*unavailable|playwright.*unavailable|runtime evidence unavailable/i.test(reason)) {
    blockerClass = input.hasWorkspaceModules ? 'MISSING_FALLBACK_BLOCKER' : 'OVERSTRICT_BLOCKER';
  } else if (
    isOverstrictPreBuildBlocker(reason) &&
    (input.hasGeneratedSource || input.hasWorkspaceModules)
  ) {
    blockerClass = 'OVERSTRICT_BLOCKER';
  } else if (/report.*only|label.*planning_failed/i.test(reason)) {
    blockerClass = 'REPORTING_ONLY_BUG';
  } else if (isSafetyOrStructuralBlocker(reason)) {
    blockerClass = 'LEGITIMATE_BLOCKER';
  }

  const legitimate =
    blockerClass === 'LEGITIMATE_BLOCKER' ||
    (blockerClass === 'OVERSTRICT_BLOCKER' ? false : blockerClass === 'WRONG_STAGE_BLOCKER' ? false : false);

  return {
    readOnly: true,
    stage: input.stage,
    reason,
    blockerClass,
    legitimate: blockerClass === 'LEGITIMATE_BLOCKER',
  };
}

export function groupBlockersByClass(
  blockers: readonly ClassifiedBlocker[],
): Record<BlockerClass, readonly ClassifiedBlocker[]> {
  const classes: BlockerClass[] = [
    'LEGITIMATE_BLOCKER',
    'OVERSTRICT_BLOCKER',
    'WRONG_STAGE_BLOCKER',
    'STALE_EVIDENCE_BLOCKER',
    'MISSING_FALLBACK_BLOCKER',
    'PROFILE_MISROUTE_BLOCKER',
    'AUTH_INJECTION_BUG',
    'PREVIEW_GATE_BUG',
    'REPORTING_ONLY_BUG',
  ];
  const grouped = {} as Record<BlockerClass, ClassifiedBlocker[]>;
  for (const cls of classes) grouped[cls] = [];
  for (const blocker of blockers) {
    grouped[blocker.blockerClass].push(blocker);
  }
  return grouped;
}

export function detectSystemicPatterns(blockers: readonly ClassifiedBlocker[]): {
  systemicBlockerPatterns: string[];
  profileMisroutePatterns: string[];
  overstrictGatePatterns: string[];
  authInjectionBugs: string[];
  previewGateBugs: string[];
} {
  const systemicBlockerPatterns: string[] = [];
  const profileMisroutePatterns: string[] = [];
  const overstrictGatePatterns: string[] = [];
  const authInjectionBugs: string[] = [];
  const previewGateBugs: string[] = [];

  for (const b of blockers) {
    switch (b.blockerClass) {
      case 'PROFILE_MISROUTE_BLOCKER':
        profileMisroutePatterns.push(`${b.stage}: ${b.reason}`);
        break;
      case 'OVERSTRICT_BLOCKER':
      case 'MISSING_FALLBACK_BLOCKER':
        overstrictGatePatterns.push(`${b.stage}: ${b.reason}`);
        break;
      case 'AUTH_INJECTION_BUG':
        authInjectionBugs.push(b.reason);
        break;
      case 'PREVIEW_GATE_BUG':
        previewGateBugs.push(b.reason);
        break;
      default:
        if (!b.legitimate) systemicBlockerPatterns.push(`${b.blockerClass} @ ${b.stage}: ${b.reason}`);
    }
  }

  return {
    systemicBlockerPatterns: [...new Set(systemicBlockerPatterns)],
    profileMisroutePatterns: [...new Set(profileMisroutePatterns)],
    overstrictGatePatterns: [...new Set(overstrictGatePatterns)],
    authInjectionBugs: [...new Set(authInjectionBugs)],
    previewGateBugs: [...new Set(previewGateBugs)],
  };
}

export function buildRecommendedFixes(input: {
  overstrictGatePatterns: readonly string[];
  profileMisroutePatterns: readonly string[];
  authInjectionBugs: readonly string[];
  previewGateBugs: readonly string[];
}): Array<{ priority: number; fix: string; rationale: string }> {
  const fixes: Array<{ priority: number; fix: string; rationale: string }> = [];

  if (input.overstrictGatePatterns.length > 0) {
    fixes.push({
      priority: 1,
      fix: 'Apply universal continuation policy before npm install — do not abort on workspace-proven feature reality gaps.',
      rationale: `${input.overstrictGatePatterns.length} over-strict gate(s) prevented build execution despite generated source.`,
    });
  }
  if (input.profileMisroutePatterns.length > 0) {
    fixes.push({
      priority: 2,
      fix: 'Strengthen prompt-profile-selection-guard to reject ExpenseTracker for custom-domain prompts.',
      rationale: `${input.profileMisroutePatterns.length} profile misroute(s) detected.`,
    });
  }
  if (input.authInjectionBugs.length > 0) {
    fixes.push({
      priority: 3,
      fix: 'Only inject auth requirements when prompt explicitly mentions login, accounts, users, roles, or sessions.',
      rationale: `${input.authInjectionBugs.length} auth injection bug(s) detected.`,
    });
  }
  if (input.previewGateBugs.length > 0) {
    fixes.push({
      priority: 4,
      fix: 'Allow degraded preview when npm build succeeds but live preview verification is incomplete.',
      rationale: `${input.previewGateBugs.length} preview gate bug(s) detected.`,
    });
  }

  return fixes.sort((a, b) => a.priority - b.priority);
}
