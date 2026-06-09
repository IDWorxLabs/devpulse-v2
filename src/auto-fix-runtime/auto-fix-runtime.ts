/**
 * Auto-Fix Runtime Foundation — Phase 14.5 orchestrator.
 * Creates fix plans and proposals — does NOT apply fixes or modify files.
 */

import { publishAutoFixRuntimeFeedStages } from '../operator-feed/auto-fix-runtime-feed-bridge.js';
import { buildAutoFixPlan } from './auto-fix-plan-builder.js';
import { parseFixRequest } from './fix-request-parser.js';
import { recommendedFix } from './fix-proposal-builder.js';
import {
  getAutoFixRuntimeDiagnostics,
  updateAutoFixRuntimeDiagnostics,
} from './auto-fix-runtime-diagnostics.js';
import { simulatedFailedFixResults } from './simulated-fix-result-model.js';
import {
  isDuplicateAutoFixBrainQuestion,
  type AutoFixPlan,
  type AutoFixRuntimeDiagnostics,
  type AutoFixRuntimeResult,
} from './auto-fix-runtime-types.js';

function composeResponse(query: string, plan: AutoFixPlan): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Auto-Fix Runtime Foundation Response', ''];

  if (isDuplicateAutoFixBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push(
      'Why: Phase 14.5 Auto-Fix Runtime Foundation extends fix planning architecture — do not create auto_fix_brain, fix_brain, or apply_engine duplicates.',
    );
    lines.push('Next safe action: Extend Auto-Fix Runtime through Command Center routing.');
    return lines.join('\n');
  }

  const primary = recommendedFix(plan.fixProposals);

  if (lower.includes('how would you fix') || lower.includes('how would we fix')) {
    lines.push(`Fix plan: ${plan.fixId} — ${plan.title}`);
    lines.push(`Problem: ${plan.problemSummary}`);
    lines.push(`Recommended fix: ${primary?.title ?? 'None'}`);
    lines.push(`Proposals: ${plan.fixProposals.length} | Alternatives: ${plan.alternatives.length}`);
    lines.push(`Linked failures: ${plan.linkedFailureIds.length}`);
    lines.push(`Testing: ${plan.linkedTestingId} | Generation: ${plan.linkedGenerationId}`);
    lines.push(`Build task: ${plan.linkedBuildTaskId} (blocked: ${plan.buildTaskPlan.blocked})`);
    lines.push(`Execution packet: ${plan.linkedExecutionId} (executionAllowed: false)`);
    lines.push('');
    lines.push('Simulation-only — no fixes applied, no files modified, no commands executed.');
    lines.push('Approval/future fixing gates are required before any governed fix application.');
  } else if (lower.includes('what fix is recommended') || lower.includes('recommended fix')) {
    if (primary) {
      lines.push(`Recommended: ${primary.title}`);
      lines.push(primary.description);
      lines.push(`Target: ${primary.targetProblem}`);
    }
  } else if (lower.includes('alternative')) {
    lines.push('Alternative fixes:');
    for (const a of plan.alternatives) {
      lines.push(`• [${a.rank}] ${a.title}: ${a.tradeoff}`);
    }
  } else if (lower.includes('rollback')) {
    lines.push('Rollback plan:');
    for (const s of plan.rollbackPlan.steps) {
      lines.push(`• ${s}`);
    }
    lines.push('');
    lines.push('Prerequisites:');
    for (const p of plan.rollbackPlan.prerequisites) {
      lines.push(`• ${p}`);
    }
  } else if (lower.includes('verification') || lower.includes('prove the fix')) {
    lines.push('Verification plan:');
    for (const p of plan.verificationPlan.proofCriteria.slice(0, 8)) {
      lines.push(`• ${p}`);
    }
    lines.push('');
    lines.push('Checks:');
    for (const c of plan.verificationPlan.checks) {
      lines.push(`• ${c}`);
    }
  } else if (lower.includes('can auto-fix run') || lower.includes('can auto fix run') || lower.includes('blocking auto')) {
    lines.push('Can auto-fix run now: No');
    lines.push(`State: ${plan.state}`);
    lines.push(`Blocked: ${plan.blocked}`);
    lines.push(`Readiness: ${plan.readiness}`);
    lines.push('Auto-fix is simulation-only — no fixes applied, no files modified.');
  } else if (lower.includes('risks')) {
    lines.push('Fix risks:');
    for (const r of plan.risks) {
      lines.push(`• [${r.level}] ${r.summary}`);
    }
  } else {
    lines.push(`Plan ${plan.fixId}: ${plan.title}`);
    lines.push(`State: ${plan.state} | Proposals: ${plan.fixProposals.length}`);
    lines.push(`Failures linked: ${plan.linkedFailureIds.length} | Alternatives: ${plan.alternatives.length}`);
    lines.push(`Risks: ${plan.risks.length} | Simulated: ${plan.simulatedResults.length}`);
    const fails = simulatedFailedFixResults(plan.simulatedResults);
    if (fails.length > 0) {
      lines.push(`Simulated failures: ${fails.length}`);
    }
  }

  lines.push('');
  lines.push('Simulation-only — no fix application, no file modification, no code generation into project.');
  lines.push('All proposals have applied: false. Failures remain advisory — not auto-resolved.');
  return lines.join('\n');
}

export function processAutoFixRuntimeRequest(query: string): AutoFixRuntimeResult {
  publishAutoFixRuntimeFeedStages(query);
  const request = parseFixRequest(query);
  const plan = buildAutoFixPlan(query);
  updateAutoFixRuntimeDiagnostics(query, plan);

  return {
    query,
    request,
    plan,
    responseText: composeResponse(query, plan),
  };
}

export function getAutoFixRuntimeContext(query: string): {
  result: AutoFixRuntimeResult;
  diagnostics: AutoFixRuntimeDiagnostics;
  fixBlockers: string[];
  fixReadiness: string;
} {
  const result = processAutoFixRuntimeRequest(query);
  return {
    result,
    diagnostics: getAutoFixRuntimeDiagnostics(),
    fixBlockers: result.plan.blockers,
    fixReadiness: result.plan.readiness,
  };
}
