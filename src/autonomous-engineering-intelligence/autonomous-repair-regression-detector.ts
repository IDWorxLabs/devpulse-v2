/**
 * Autonomous Engineering Intelligence V1 — repair regression detection.
 */

import type { ProductionReadinessReport } from '../universal-production-readiness/universal-production-readiness-types.js';
import { detectReadinessRegression } from '../universal-production-readiness/production-readiness-regression-detector.js';

export function detectAutonomousRepairRegression(
  before: ProductionReadinessReport | null,
  after: ProductionReadinessReport | null,
): string[] {
  if (!before || !after) return ['repair_evidence_missing'];
  return detectReadinessRegression(before, after);
}
