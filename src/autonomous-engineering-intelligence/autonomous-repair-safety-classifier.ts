/**
 * Autonomous Engineering Intelligence V1 — repair safety classification.
 */

import type { AutonomousEngineeringFinding, RepairCategory, RepairSafetyClassification } from './autonomous-engineering-types.js';

export function classifyRepairSafety(
  finding: AutonomousEngineeringFinding,
  category: RepairCategory,
): RepairSafetyClassification {
  if (finding.diagnosticCode.startsWith('blocked_by_')) return 'FORBIDDEN';
  if (category === 'STATIC_SHELL_REPLACEMENT') return 'SAFE_WITH_TARGETED_VALIDATION';
  if (category === 'MISSING_EVIDENCE_EMISSION') return 'SAFE_DETERMINISTIC';
  if (category === 'MISSING_ARTIFACT') return 'GUARDED_PRODUCTION_MUTATION';
  if (category === 'MISSING_HANDLER') return 'GUARDED_PRODUCTION_MUTATION';
  if (category === 'MISSING_RUNTIME_SCOPE') return 'SAFE_WITH_TARGETED_VALIDATION';
  if (category === 'MATERIALIZATION_MISMATCH') return 'HIGH_RISK_REQUIRES_HUMAN';
  if (category === 'CUSTOM_EXTENSION_REQUIRED') return 'UNKNOWN';
  return 'SAFE_WITH_TARGETED_VALIDATION';
}
