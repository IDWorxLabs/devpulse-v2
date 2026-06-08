/**
 * AiDev build request intake — no code generation, execution, planning, or file creation.
 */

import type { AiDevRequest, AiDevRequestStatus } from './types.js';

function createRequestId(): string {
  return `aidev-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeBuildRequest(userInput: string): string {
  return userInput.trim().replace(/\s+/g, ' ');
}

export function createBuildRequest(userInput: string): AiDevRequest {
  const normalizedInput = normalizeBuildRequest(userInput);
  const warnings: string[] = [
    'AiDev Engine intake only — no code generation, execution, or project modification.',
  ];
  const errors: string[] = [];

  if (!normalizedInput) {
    errors.push('Build request input is empty.');
  }

  return {
    requestId: createRequestId(),
    createdAt: Date.now(),
    userInput,
    normalizedInput,
    status: errors.length > 0 ? 'REJECTED' : 'RECEIVED',
    warnings,
    errors,
  };
}

export function updateRequestStatus(
  request: AiDevRequest,
  status: AiDevRequestStatus,
): AiDevRequest {
  return {
    ...request,
    status,
    warnings: [...request.warnings],
    errors: [...request.errors],
  };
}

export function summarizeBuildRequest(request: AiDevRequest): string {
  const intent = request.intentId ? ` intent=${request.intentId}` : '';
  return (
    `AiDev request ${request.requestId}: status=${request.status}${intent} ` +
    `"${request.normalizedInput.slice(0, 80)}${request.normalizedInput.length > 80 ? '...' : ''}"`
  );
}
