/**
 * Clarifying Question Live Gate — bounded conversation memory and vault sync.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import type { ClarifyingAnswerRecord, LiveGateCategoryId } from './clarifying-question-live-gate-types.js';

const MAX_ANSWER_SCOPES = 12;
const MAX_ANSWERS_PER_SCOPE = 24;
const CLARIFYING_FACT_PREFIX = 'clarifying:';

const scopeAnswers = new Map<string, ClarifyingAnswerRecord[]>();

function scopeKey(requestId?: string, projectId?: string): string {
  return `${projectId ?? 'no-project'}:${requestId ?? 'no-request'}`;
}

function trimScopeStore(): void {
  if (scopeAnswers.size <= MAX_ANSWER_SCOPES) return;
  const oldest = [...scopeAnswers.entries()].sort(
    (left, right) =>
      (left[1][0]?.recordedAt ?? 0) - (right[1][0]?.recordedAt ?? 0),
  )[0]?.[0];
  if (oldest) scopeAnswers.delete(oldest);
}

export function resetClarifyingLiveGateMemoryForTests(): void {
  scopeAnswers.clear();
}

export function recordClarifyingAnswer(input: {
  categoryId: LiveGateCategoryId;
  answer: string;
  requestId?: string;
  projectId?: string;
  source?: ClarifyingAnswerRecord['source'];
  recordedAt?: number;
}): ClarifyingAnswerRecord {
  const key = scopeKey(input.requestId, input.projectId);
  const existing = scopeAnswers.get(key) ?? [];
  const filtered = existing.filter((entry) => entry.categoryId !== input.categoryId);
  const record: ClarifyingAnswerRecord = {
    categoryId: input.categoryId,
    answer: input.answer.trim(),
    recordedAt: input.recordedAt ?? Date.now(),
    source: input.source ?? 'USER',
  };
  const next = [...filtered, record].slice(-MAX_ANSWERS_PER_SCOPE);
  scopeAnswers.set(key, next);
  trimScopeStore();

  if (input.projectId && record.answer.length > 0) {
    const vault = getDevPulseV2ProjectVaultAuthority();
    vault.addProjectFact(input.projectId, {
      source: 'USER',
      label: `${CLARIFYING_FACT_PREFIX}${input.categoryId.toLowerCase()}`,
      value: record.answer,
      confidence: 'HIGH',
    });
  }

  return record;
}

export function listClarifyingAnswers(input: {
  requestId?: string;
  projectId?: string;
}): ClarifyingAnswerRecord[] {
  const stored = scopeAnswers.get(scopeKey(input.requestId, input.projectId)) ?? [];
  const vaultEvidence = loadClarifyingAnswersFromVault(input.projectId);
  const merged = new Map<LiveGateCategoryId, ClarifyingAnswerRecord>();
  for (const entry of vaultEvidence) merged.set(entry.categoryId, entry);
  for (const entry of stored) merged.set(entry.categoryId, entry);
  return [...merged.values()].sort((left, right) => left.recordedAt - right.recordedAt);
}

export function loadClarifyingAnswersFromVault(projectId?: string): ClarifyingAnswerRecord[] {
  if (!projectId) return [];
  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.getProject(projectId);
  if (!project) return [];

  return project.facts
    .filter((fact) => fact.label.startsWith(CLARIFYING_FACT_PREFIX))
    .map((fact) => ({
      categoryId: fact.label.slice(CLARIFYING_FACT_PREFIX.length).toUpperCase() as LiveGateCategoryId,
      answer: fact.value,
      recordedAt: fact.createdAt,
      source: 'VAULT' as const,
    }))
    .slice(-MAX_ANSWERS_PER_SCOPE);
}

export function buildClarifyingEvidenceText(input: {
  userPrompt: string;
  requestId?: string;
  projectId?: string;
  supplementalEvidence?: string;
}): string {
  const answers = listClarifyingAnswers({
    requestId: input.requestId,
    projectId: input.projectId,
  });
  return [
    input.userPrompt,
    input.supplementalEvidence ?? '',
    ...answers.map((entry) => `${entry.categoryId} ${entry.answer}`),
  ]
    .join('\n')
    .toLowerCase();
}

export function getClarifyingLiveGateMemorySize(): number {
  return scopeAnswers.size;
}
