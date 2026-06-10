/**
 * Prediction Trust Layer — prediction registry.
 */

import type {
  PredictionTrustDecision,
  PredictionTrustRecord,
  PredictionTrustRiskLevel,
} from './prediction-trust-types.js';

const byPredictionId = new Map<string, PredictionTrustRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byRiskLevel = new Map<PredictionTrustRiskLevel, Set<string>>();
const byDecision = new Map<PredictionTrustDecision, Set<string>>();

function indexRecord(record: PredictionTrustRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.predictionId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byRiskLevel.has(record.riskLevel)) byRiskLevel.set(record.riskLevel, new Set());
  byRiskLevel.get(record.riskLevel)!.add(record.predictionId);
  if (!byDecision.has(record.decision)) byDecision.set(record.decision, new Set());
  byDecision.get(record.decision)!.add(record.predictionId);
}

export function registerPredictionTrustRecord(record: PredictionTrustRecord): PredictionTrustRecord {
  byPredictionId.set(record.predictionId, record);
  indexRecord(record);
  return record;
}

export function getPredictionTrustRecord(predictionId: string): PredictionTrustRecord | undefined {
  return byPredictionId.get(predictionId);
}

export function lookupPredictionByProjectId(projectId: string): PredictionTrustRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byPredictionId.get(id)!).filter(Boolean);
}

export function lookupPredictionByWorkspaceId(workspaceId: string): PredictionTrustRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byPredictionId.get(id)!).filter(Boolean);
}

export function lookupPredictionByRiskLevel(riskLevel: PredictionTrustRiskLevel): PredictionTrustRecord[] {
  const ids = byRiskLevel.get(riskLevel);
  if (!ids) return [];
  return [...ids].map((id) => byPredictionId.get(id)!).filter(Boolean);
}

export function lookupPredictionByDecision(decision: PredictionTrustDecision): PredictionTrustRecord[] {
  const ids = byDecision.get(decision);
  if (!ids) return [];
  return [...ids].map((id) => byPredictionId.get(id)!).filter(Boolean);
}

export function listPredictionTrustRecords(): PredictionTrustRecord[] {
  return [...byPredictionId.values()];
}

export function getPredictionTrustRecordCount(): number {
  return byPredictionId.size;
}

export function resetPredictionTrustRegistryForTests(): void {
  byPredictionId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byRiskLevel.clear();
  byDecision.clear();
}
