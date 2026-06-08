/**
 * AiDev Engine founder-readable report — intake layer only.
 */

import type { AiDevEngineReport, AiDevEngineState, AiDevRequest } from './types.js';
import { AIDEV_OWNER_MODULE } from './types.js';

export function buildAiDevEngineReport(
  state: AiDevEngineState,
  requests: AiDevRequest[],
): AiDevEngineReport {
  const receivedCount = requests.filter((r) => r.status === 'RECEIVED').length;
  const analyzingCount = requests.filter((r) => r.status === 'ANALYZING').length;
  const readyCount = requests.filter((r) => r.status === 'READY_FOR_PLANNING').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;
  const latestRequest = requests.length > 0 ? requests[requests.length - 1] : null;

  let recommendation =
    'AiDev Engine accepts build requests — planning and execution are future phases.';
  if (state.requestCount === 0) {
    recommendation = 'Intake build requests here — no code generation or project modification in Foundation V1.';
  } else if (rejectedCount > 0) {
    recommendation = 'Review rejected requests — AiDev does not execute or generate code yet.';
  } else if (readyCount > 0) {
    recommendation = 'Requests ready for future planning phase — Requirement Extractor and Product Architect come next.';
  }

  return {
    ownerModule: AIDEV_OWNER_MODULE,
    totalRequests: state.requestCount,
    receivedCount,
    analyzingCount,
    readyCount,
    rejectedCount,
    latestRequest: latestRequest
      ? {
          ...latestRequest,
          warnings: [...latestRequest.warnings],
          errors: [...latestRequest.errors],
        }
      : null,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatAiDevEngineReport(
  state: AiDevEngineState,
  requests: AiDevRequest[],
): string {
  const report = buildAiDevEngineReport(state, requests);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'AiDev Engine Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Engine ID: ${state.engineId}`,
    `Total requests: ${report.totalRequests}`,
    `Received: ${report.receivedCount} | Analyzing: ${report.analyzingCount} | Ready: ${report.readyCount} | Rejected: ${report.rejectedCount}`,
    '',
  ];

  if (report.latestRequest) {
    lines.push(`Latest request: ${report.latestRequest.requestId}`);
    lines.push(`  Status: ${report.latestRequest.status}`);
    lines.push(`  Input: "${report.latestRequest.normalizedInput.slice(0, 60)}..."`);
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
