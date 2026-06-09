/**
 * Build Task Runtime Foundation — Phase 14.2 orchestrator.
 * Plans build tasks — does NOT execute steps.
 */

import { publishBuildTaskRuntimeFeedStages } from '../operator-feed/build-task-runtime-feed-bridge.js';
import { buildBuildTaskPlan } from './build-task-plan-builder.js';
import { parseBuildTaskRequest } from './build-task-request-parser.js';
import {
  getBuildTaskRuntimeDiagnostics,
  updateBuildTaskRuntimeDiagnostics,
} from './build-task-runtime-diagnostics.js';
import {
  isDuplicateBuildTaskBrainQuestion,
  type BuildTaskPlan,
  type BuildTaskRuntimeDiagnostics,
  type BuildTaskRuntimeResult,
} from './build-task-runtime-types.js';

function composeResponse(query: string, plan: BuildTaskPlan): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Build Task Runtime Foundation Response', ''];

  if (isDuplicateBuildTaskBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push(
      'Why: Phase 14.2 Build Task Runtime Foundation extends planning architecture — do not create build_brain, task_brain, or code_generation_runtime duplicates.',
    );
    lines.push('Next safe action: Extend Build Task Runtime through Command Center routing.');
    return lines.join('\n');
  }

  if (lower.includes('plan the build') || lower.includes('task plan') || lower.includes('build task')) {
    lines.push(`Task: ${plan.taskId} — ${plan.title}`);
    lines.push(`Goal: ${plan.goal}`);
    lines.push(`State: ${plan.state}`);
    lines.push(`Steps: ${plan.steps.length}`);
    lines.push(`Dependencies: ${plan.dependencies.length}`);
    lines.push(`Safety gates: ${plan.safetyGates.length}`);
    lines.push(`Execution packet: ${plan.executionPacketId} (executionAllowed: false)`);
  } else if (lower.includes('what steps')) {
    lines.push(`Build steps (${plan.steps.length}):`);
    for (const step of plan.steps) {
      lines.push(`  ${step.order}. ${step.title} — ${step.description}`);
    }
  } else if (lower.includes('dependencies would this build') || lower.includes('what dependencies')) {
    lines.push('Build dependencies:');
    for (const dep of plan.dependencies.slice(0, 10)) {
      lines.push(`• ${dep.name} [${dep.satisfied ? 'satisfied' : 'missing'}] — ${dep.reason}`);
    }
  } else if (lower.includes('safety gates')) {
    lines.push('Required safety gates:');
    for (const gate of plan.safetyGates) {
      lines.push(`• ${gate.name}: ${gate.passed ? 'passed' : 'required'} — ${gate.description}`);
    }
  } else if (lower.includes('verification would prove') || lower.includes('prove it worked')) {
    lines.push('Verification plan:');
    for (const check of plan.verificationPlan.proofCriteria) {
      lines.push(`• ${check}`);
    }
    lines.push('');
    lines.push('Rollback considerations:');
    for (const rb of plan.verificationPlan.rollbackConsiderations.slice(0, 4)) {
      lines.push(`• ${rb}`);
    }
  } else if (lower.includes('can this build task execute') || lower.includes('build task execute')) {
    lines.push(`Can execute now: No`);
    lines.push(`Task state: ${plan.state}`);
    lines.push(`Blocked: ${plan.blocked}`);
    lines.push(`Execution packet: ${plan.executionPacketId}`);
    lines.push(`Packet executionAllowed: ${plan.executionPacket.readiness.executionAllowed}`);
    lines.push(`Readiness: ${plan.readiness}`);
  } else if (lower.includes('blocking this task') || lower.includes('what is blocking')) {
    lines.push('Task blockers:');
    if (plan.blockers.length === 0) {
      lines.push('• No blockers beyond planning-only mode.');
    } else {
      for (const b of plan.blockers.slice(0, 10)) {
        lines.push(`• ${b}`);
      }
    }
  } else if (lower.includes('implementation plan') || lower.includes('build sequence')) {
    lines.push(`Implementation plan: ${plan.title}`);
    lines.push(`Confidence: ${plan.confidence}`);
    for (const step of plan.steps) {
      lines.push(`  ${step.order}. ${step.title}`);
    }
  } else {
    lines.push(`Build task ${plan.taskId}: ${plan.title}`);
    lines.push(`State: ${plan.state} | Blocked: ${plan.blocked}`);
    lines.push(`Steps: ${plan.steps.length} | Dependencies: ${plan.dependencies.length}`);
    lines.push(`Gates: ${plan.safetyGates.length} | Verification checks: ${plan.verificationPlan.checks.length}`);
    lines.push(`Linked packet: ${plan.executionPacketId}`);
  }

  lines.push('');
  lines.push('Build task planning only — no execution, file writes, code generation, or deployment performed.');
  return lines.join('\n');
}

export function processBuildTaskRuntimeRequest(query: string): BuildTaskRuntimeResult {
  publishBuildTaskRuntimeFeedStages(query);
  const request = parseBuildTaskRequest(query);
  const plan = buildBuildTaskPlan(query);
  updateBuildTaskRuntimeDiagnostics(query, plan);

  return {
    query,
    request,
    plan,
    responseText: composeResponse(query, plan),
  };
}

export function getBuildTaskRuntimeContext(query: string): {
  result: BuildTaskRuntimeResult;
  diagnostics: BuildTaskRuntimeDiagnostics;
  buildTaskBlockers: string[];
  buildTaskReadiness: string;
} {
  const result = processBuildTaskRuntimeRequest(query);
  return {
    result,
    diagnostics: getBuildTaskRuntimeDiagnostics(),
    buildTaskBlockers: result.plan.blockers,
    buildTaskReadiness: result.plan.readiness,
  };
}
