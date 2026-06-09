/**
 * Code Generation Runtime Foundation — Phase 14.3 orchestrator.
 * Creates proposals — does NOT write to project files.
 */

import { publishCodeGenerationRuntimeFeedStages } from '../operator-feed/code-generation-runtime-feed-bridge.js';
import { buildCodeGenerationPlan, strategyRationale } from './code-generation-plan-builder.js';
import { parseCodeGenerationRequest } from './code-generation-request-parser.js';
import {
  getCodeGenerationRuntimeDiagnostics,
  updateCodeGenerationRuntimeDiagnostics,
} from './code-generation-runtime-diagnostics.js';
import {
  isDuplicateCodeGenerationBrainQuestion,
  type CodeGenerationPlan,
  type CodeGenerationRuntimeDiagnostics,
  type CodeGenerationRuntimeResult,
} from './code-generation-runtime-types.js';

function composeResponse(query: string, plan: CodeGenerationPlan): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Code Generation Runtime Foundation Response', ''];

  if (isDuplicateCodeGenerationBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push(
      'Why: Phase 14.3 Code Generation Runtime Foundation extends proposal architecture — do not create code_generation_brain, code_brain, or file_apply_runtime duplicates.',
    );
    lines.push('Next safe action: Extend Code Generation Runtime through Command Center routing.');
    return lines.join('\n');
  }

  if (lower.includes('generate code')) {
    lines.push(`Generation: ${plan.generationId} — ${plan.title}`);
    lines.push(`Strategy: ${plan.strategy} — ${strategyRationale(query)}`);
    lines.push(`Artifacts proposed: ${plan.artifactProposals.length}`);
    lines.push(`Changes proposed: ${plan.changeProposals.length}`);
    lines.push(`Build task: ${plan.buildTaskId} (blocked: ${plan.buildTaskPlan.blocked})`);
    lines.push(`Execution packet: ${plan.executionPacketId} (executionAllowed: false)`);
    lines.push('');
    lines.push('Simulation-only — no real files were modified.');
    lines.push('Approval/future generation gates are required before any governed code writing.');
  } else if (lower.includes('what code would be generated')) {
    lines.push('Proposed code artifacts:');
    for (const a of plan.artifactProposals) {
      lines.push(`• ${a.name} (${a.language}): ${a.proposedContentSummary}`);
    }
  } else if (lower.includes('what files would change') || lower.includes('target files')) {
    lines.push('Proposed target files:');
    for (const f of plan.targetFiles) {
      lines.push(`• ${f}`);
    }
  } else if (lower.includes('what changes are proposed') || lower.includes('proposed changes')) {
    lines.push('Proposed changes (not applied):');
    for (const c of plan.changeProposals) {
      lines.push(`• [${c.changeType}] ${c.targetFile}: ${c.description}`);
    }
  } else if (lower.includes('generation strategy')) {
    lines.push(`Strategy: ${plan.strategy}`);
    lines.push(strategyRationale(query));
  } else if (lower.includes('validation would prove') || lower.includes('prove the generated code')) {
    lines.push('Validation plan:');
    for (const p of plan.validationPlan.proofCriteria) {
      lines.push(`• ${p}`);
    }
    lines.push('');
    lines.push('Rollback considerations:');
    for (const r of plan.validationPlan.rollbackConsiderations.slice(0, 4)) {
      lines.push(`• ${r}`);
    }
  } else if (lower.includes('can this code generation run') || lower.includes('code generation run')) {
    lines.push('Can generate now: No');
    lines.push(`State: ${plan.state}`);
    lines.push(`Blocked: ${plan.blocked}`);
    lines.push(`Readiness: ${plan.readiness}`);
    lines.push('Generation is simulation-only — no real files modified.');
  } else if (lower.includes('blocking code generation') || lower.includes('what is blocking code')) {
    lines.push('Code generation blockers:');
    for (const b of plan.blockers.slice(0, 10)) {
      lines.push(`• ${b}`);
    }
  } else if (lower.includes('risks')) {
    lines.push('Generation risks:');
    for (const r of plan.risks) {
      lines.push(`• [${r.level}] ${r.summary}`);
    }
  } else {
    lines.push(`Plan ${plan.generationId}: ${plan.title}`);
    lines.push(`State: ${plan.state} | Strategy: ${plan.strategy}`);
    lines.push(`Artifacts: ${plan.artifactProposals.length} | Changes: ${plan.changeProposals.length}`);
    lines.push(`Risks: ${plan.risks.length} | Target files: ${plan.targetFiles.length}`);
    lines.push(`Linked build task: ${plan.buildTaskId} | Packet: ${plan.executionPacketId}`);
  }

  lines.push('');
  lines.push('Proposal only — no file writes, no applied patches, no real project code modification.');
  lines.push('All change proposals have applied: false. Generation is simulation-only.');
  return lines.join('\n');
}

export function processCodeGenerationRuntimeRequest(query: string): CodeGenerationRuntimeResult {
  publishCodeGenerationRuntimeFeedStages(query);
  const request = parseCodeGenerationRequest(query);
  const plan = buildCodeGenerationPlan(query);
  updateCodeGenerationRuntimeDiagnostics(query, plan);

  return {
    query,
    request,
    plan,
    responseText: composeResponse(query, plan),
  };
}

export function getCodeGenerationRuntimeContext(query: string): {
  result: CodeGenerationRuntimeResult;
  diagnostics: CodeGenerationRuntimeDiagnostics;
  generationBlockers: string[];
  generationReadiness: string;
} {
  const result = processCodeGenerationRuntimeRequest(query);
  return {
    result,
    diagnostics: getCodeGenerationRuntimeDiagnostics(),
    generationBlockers: result.plan.blockers,
    generationReadiness: result.plan.readiness,
  };
}
