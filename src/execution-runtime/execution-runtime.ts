/**
 * Execution Runtime Foundation — Phase 14.1 orchestrator.
 * Evaluates readiness and models packets — does NOT execute.
 */

import { publishExecutionRuntimeFeedStages } from '../operator-feed/execution-runtime-feed-bridge.js';
import { createExecutionPacket } from './execution-packet.js';
import { evaluateExecutionReadiness } from './execution-readiness-evaluator.js';
import { governanceAllowsPacketCreation, governanceForbidsActionExecution } from './execution-governance.js';
import {
  getExecutionRuntimeDiagnostics,
  updateExecutionRuntimeDiagnostics,
} from './execution-runtime-diagnostics.js';
import {
  advanceExecutionState,
  initialExecutionState,
  resolveStateFromReadiness,
} from './execution-state-machine.js';
import {
  isDuplicateExecutionRuntimeBrainQuestion,
  type ExecutionPacket,
  type ExecutionRuntimeDiagnostics,
  type ExecutionRuntimeResult,
} from './execution-runtime-types.js';

function composeResponse(query: string, packet: ExecutionPacket): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Execution Runtime Foundation Response', ''];

  if (isDuplicateExecutionRuntimeBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push(
      'Why: Phase 14.1 Execution Runtime Foundation extends readiness architecture — do not create execution_brain, runtime_brain, or apply_engine duplicates.',
    );
    lines.push('Next safe action: Extend Execution Runtime Foundation through Command Center routing.');
    return lines.join('\n');
  }

  if (lower.includes('is execution allowed') || lower.includes('can we execute')) {
    lines.push(`Execution allowed: ${packet.readiness.executionAllowed ? 'Yes' : 'No'}`);
    lines.push(`Why: ${packet.readiness.basis}`);
    lines.push(`Safety status: ${packet.safetyStatus}`);
    lines.push(`State: ${packet.state}`);
  } else if (lower.includes('why is execution blocked') || lower.includes('execution blockers')) {
    lines.push('Execution blockers:');
    if (packet.blockers.length === 0) {
      lines.push('• No blockers beyond foundation simulation-only mode.');
    } else {
      for (const b of packet.blockers.slice(0, 10)) {
        lines.push(`• ${b}`);
      }
    }
  } else if (lower.includes('execution readiness') || lower.includes('readiness')) {
    lines.push(`Readiness level: ${packet.readiness.readinessLevel}`);
    lines.push(`Readiness score: ${packet.readiness.readinessScore}`);
    lines.push(`State: ${packet.state}`);
    lines.push(`Confidence: ${packet.confidence}`);
    lines.push(`Basis: ${packet.readiness.basis}`);
  } else if (lower.includes('approval would be required') || lower.includes('approval')) {
    lines.push('Approval required:');
    if (packet.readiness.approvalRequired.length === 0) {
      lines.push('• Founder approval gate advisory only — foundation does not grant approval.');
    } else {
      for (const gate of packet.readiness.approvalRequired) {
        lines.push(`• ${gate}`);
      }
    }
  } else if (lower.includes('dependencies are missing') || lower.includes('missing dependenc')) {
    lines.push('Missing dependencies:');
    if (packet.readiness.missingDependencies.length === 0) {
      lines.push('• No additional missing dependencies identified.');
    } else {
      for (const dep of packet.readiness.missingDependencies.slice(0, 10)) {
        lines.push(`• ${dep}`);
      }
    }
  } else if (lower.includes('capabilities must exist') || lower.includes('capabilities')) {
    lines.push('Required capabilities before execution:');
    for (const cap of packet.readiness.requiredCapabilities) {
      lines.push(`• ${cap}`);
    }
  } else if (lower.includes('execution status') || lower.includes('status')) {
    lines.push(`Packet: ${packet.executionId}`);
    lines.push(`State: ${packet.state}`);
    lines.push(`Safety: ${packet.safetyStatus}`);
    lines.push(`Blockers: ${packet.blockers.length}`);
    lines.push(`Readiness: ${packet.readiness.readinessLevel} (${packet.readiness.readinessScore})`);
  } else {
    lines.push(`Execution packet ${packet.executionId}: ${packet.title}`);
    lines.push(`State: ${packet.state} | Safety: ${packet.safetyStatus}`);
    lines.push(`Readiness: ${packet.readiness.readinessLevel} (${packet.readiness.readinessScore})`);
    lines.push(`Blockers: ${packet.blockers.length}`);
    lines.push(`Missing dependencies: ${packet.readiness.missingDependencies.length}`);
    lines.push(`Required capabilities: ${packet.readiness.requiredCapabilities.length}`);
  }

  lines.push('');
  lines.push('Readiness evaluation only — no execution, file writes, code generation, or deployment performed.');
  if (governanceForbidsActionExecution()) {
    lines.push('Governance: Phase 14.1 forbids real execution.');
  }
  return lines.join('\n');
}

export function buildExecutionRuntimePacket(query: string): ExecutionPacket {
  if (!governanceAllowsPacketCreation()) {
    throw new Error('Execution Runtime governance does not allow packet creation.');
  }

  const { readiness, confidence, blockers } = evaluateExecutionReadiness(query);
  let state = initialExecutionState();
  state = advanceExecutionState(state, readiness);
  state = resolveStateFromReadiness(readiness);

  return createExecutionPacket({
    title: 'Execution Readiness Evaluation',
    description: 'Advisory execution packet for Phase 14.1 foundation — simulation only.',
    sourceSystem: 'execution_runtime',
    requestedAction: 'readiness_evaluation',
    state,
    readiness,
    confidence,
    blockers,
    safetyStatus: readiness.safetyStatus,
  });
}

export function processExecutionRuntimeRequest(query: string): ExecutionRuntimeResult {
  publishExecutionRuntimeFeedStages(query);
  const packet = buildExecutionRuntimePacket(query);
  updateExecutionRuntimeDiagnostics(query, [packet]);

  return {
    query,
    packets: [packet],
    primaryPacket: packet,
    responseText: composeResponse(query, packet),
  };
}

export function getExecutionRuntimeContext(query: string): {
  result: ExecutionRuntimeResult;
  diagnostics: ExecutionRuntimeDiagnostics;
  executionBlockers: string[];
  executionReadinessBasis: string;
} {
  const result = processExecutionRuntimeRequest(query);
  return {
    result,
    diagnostics: getExecutionRuntimeDiagnostics(),
    executionBlockers: result.primaryPacket.blockers,
    executionReadinessBasis: result.primaryPacket.readiness.basis,
  };
}
