/**
 * World 2 Execution Activation Foundation — Phase 15.1 orchestrator.
 * Creates activation plans — does NOT perform real execution.
 */

import { publishWorld2ExecutionActivationFeedStages } from '../operator-feed/world2-execution-activation-feed-bridge.js';
import { buildWorld2ActivationPlan } from './world2-activation-plan-builder.js';
import { parseWorld2ActivationRequest } from './world2-activation-request-parser.js';
import {
  getWorld2ExecutionActivationDiagnostics,
  updateWorld2ExecutionActivationDiagnostics,
} from './world2-activation-diagnostics.js';
import {
  isDuplicateWorld2BrainQuestion,
  type World2ActivationPlan,
  type World2ExecutionActivationDiagnostics,
  type World2ExecutionActivationResult,
} from './world2-execution-activation-types.js';

function composeResponse(query: string, plan: World2ActivationPlan): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['World 2 Execution Activation Foundation Response', ''];

  if (isDuplicateWorld2BrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push(
      'Why: Phase 15.1 World 2 Execution Activation extends activation architecture — do not create world2_brain, world2_runtime_brain, or ungoverned_execution_runtime duplicates.',
    );
    lines.push('Next safe action: Extend World 2 Execution Activation through Command Center routing.');
    return lines.join('\n');
  }

  if (lower.includes('can world 2 execution') || lower.includes('activate world 2')) {
    lines.push(`Activation: ${plan.activationId} — ${plan.title}`);
    lines.push(`State: ${plan.activationState}`);
    lines.push(`World: ${plan.world} | Project: ${plan.targetProjectId} | Workspace: ${plan.targetWorkspaceId}`);
    lines.push(`Readiness: ${plan.readiness}`);
    lines.push(`Confidence: ${plan.confidence}`);
    lines.push(`Blocked: ${plan.blocked}`);
    lines.push(`Approval required: ${plan.approvalRequired}`);
    lines.push('');
    lines.push('Blockers:');
    for (const b of plan.blockers.slice(0, 8)) {
      lines.push(`• ${b}`);
    }
    lines.push('');
    lines.push('Isolation:');
    lines.push(`• World 1 protected: ${plan.isolationReport.world1Protected}`);
    lines.push(`• World 2 isolated: ${plan.isolationReport.world2Isolated}`);
    lines.push(`• No World 1 modification path: ${plan.isolationReport.noWorld1ModificationPath}`);
    lines.push('');
    lines.push('Governance gates:');
    for (const g of plan.governanceGates.gates) {
      lines.push(`• ${g.name}: ${g.satisfied ? 'SATISFIED' : 'UNSATISFIED'} — ${g.summary}`);
    }
    lines.push('');
    lines.push('Runtime chain (governed, execution blocked):');
    lines.push(`• execution=${plan.runtimeChain.executionRuntimeId} (allowed: ${plan.runtimeChain.executionAllowed})`);
    lines.push(`• build=${plan.runtimeChain.buildTaskRuntimeId}`);
    lines.push(`• generation=${plan.runtimeChain.codeGenerationRuntimeId} (proposal-only)`);
    lines.push(`• testing=${plan.runtimeChain.testingRuntimeId} (simulation-only)`);
    lines.push(`• auto-fix=${plan.runtimeChain.autoFixRuntimeId} (simulation-only)`);
    lines.push(`• verification=${plan.runtimeChain.verificationLayerId}`);
  } else if (lower.includes('is world 2 isolated') || lower.includes('world 2 workspace')) {
    lines.push(`Isolation report: ${plan.isolationReport.reportId}`);
    for (const c of plan.isolationReport.checks) {
      lines.push(`• ${c}`);
    }
  } else if (lower.includes('gates are required') || lower.includes('governance')) {
    lines.push(`Governance report: ${plan.governanceGates.reportId}`);
    for (const g of plan.governanceGates.gates) {
      lines.push(`• ${g.name}: ${g.satisfied ? 'OK' : 'BLOCKED'}`);
    }
  } else if (lower.includes('blocks world 2') || lower.includes('what blocks world 2')) {
    lines.push('Activation blockers:');
    for (const b of plan.blockers) {
      lines.push(`• ${b}`);
    }
  } else if (lower.includes('runtime chain')) {
    lines.push(`Runtime chain link: ${plan.runtimeChain.linkId}`);
    lines.push(`Execution allowed: ${plan.runtimeChain.executionAllowed}`);
    lines.push(`Generation proposal-only: ${plan.runtimeChain.generationProposalOnly}`);
    lines.push(`Testing simulation-only: ${plan.runtimeChain.testingSimulationOnly}`);
    lines.push(`Auto-fix simulation-only: ${plan.runtimeChain.autoFixSimulationOnly}`);
  } else if (lower.includes('can world 2 build')) {
    lines.push(`Can World 2 build now: NO`);
    lines.push(`State: ${plan.activationState}`);
    lines.push(`Readiness: ${plan.readiness}`);
    lines.push('World 2 build requires future governed activation phases.');
  } else if (lower.includes('approval is required') || lower.includes('what approval')) {
    lines.push('Approval required: Founder approval gate');
    lines.push('No World 2 execution may proceed without explicit founder approval in a future phase.');
  } else if (lower.includes('world 1 protected')) {
    lines.push(`World 1 protected: ${plan.isolationReport.world1Protected}`);
    lines.push(`No World 1 modification path: ${plan.isolationReport.noWorld1ModificationPath}`);
  } else {
    lines.push(`Plan ${plan.activationId}: ${plan.title}`);
    lines.push(`State: ${plan.activationState} | Readiness: ${plan.readiness}`);
    lines.push(`Gates: ${plan.governanceGates.gates.filter((g) => g.satisfied).length}/${plan.governanceGates.gates.length}`);
    lines.push(`Blockers: ${plan.blockers.length}`);
  }

  lines.push('');
  lines.push('Simulation-only — World 1 protected — no files modified — no runtime actions executed.');
  lines.push('Future activation gates required before any governed World 2 execution.');
  lines.push('Execution remains blocked. Generation proposal-only. Testing and auto-fix simulation-only.');
  return lines.join('\n');
}

export function processWorld2ExecutionActivationRequest(query: string): World2ExecutionActivationResult {
  publishWorld2ExecutionActivationFeedStages(query);
  const request = parseWorld2ActivationRequest(query);
  const plan = buildWorld2ActivationPlan(query);
  updateWorld2ExecutionActivationDiagnostics(query, plan);

  return {
    query,
    request,
    plan,
    responseText: composeResponse(query, plan),
  };
}

export function getWorld2ExecutionActivationContext(query: string): {
  result: World2ExecutionActivationResult;
  diagnostics: World2ExecutionActivationDiagnostics;
  activationBlockers: string[];
  activationReadiness: string;
} {
  const result = processWorld2ExecutionActivationRequest(query);
  return {
    result,
    diagnostics: getWorld2ExecutionActivationDiagnostics(),
    activationBlockers: result.plan.blockers,
    activationReadiness: result.plan.readiness,
  };
}
