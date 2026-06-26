/**
 * Launch Readiness Authority V2 — residual risk assessment.
 */

import type {
  LaunchEvidenceCollectionResult,
  LaunchEvidenceSourceRecord,
  LaunchRiskCategory,
  LaunchRiskRecord,
} from './launch-readiness-types.js';

let riskCounter = 0;

function nextRiskId(): string {
  riskCounter += 1;
  return `launch-risk-${riskCounter}`;
}

const SOURCE_RISK_MAP: Partial<
  Record<LaunchEvidenceSourceRecord['sourceId'], LaunchRiskCategory[]>
> = {
  PROMPT_FAITHFULNESS: ['PROMPT_FAITHFULNESS'],
  CAPABILITY_PLANNING: ['CAPABILITY', 'ARCHITECTURE'],
  BEHAVIOR_SIMULATION: ['BEHAVIOR', 'RELIABILITY'],
  VIRTUAL_USER: ['USABILITY', 'BEHAVIOR'],
  VIRTUAL_DEVICE: ['DEVICE_COMPATIBILITY', 'USABILITY'],
  INTERACTION_PROOF: ['INTERACTION_INTEGRITY', 'USABILITY'],
  AUTONOMOUS_DEBUGGING: ['RELIABILITY', 'RECOVERY'],
  CONTINUOUS_IMPROVEMENT: ['MAINTAINABILITY', 'RELIABILITY'],
  ACCESSIBILITY_VALIDATION: ['ACCESSIBILITY'],
  SECURITY_VALIDATION: ['SECURITY', 'DATA_INTEGRITY'],
  PERFORMANCE_VALIDATION: ['PERFORMANCE', 'SCALABILITY'],
  WORKSPACE_REALITY: ['ARCHITECTURE', 'MAINTAINABILITY'],
  MATERIALIZATION_REALITY: ['ARCHITECTURE'],
  BUILD_REALITY: ['RELIABILITY'],
};

export function resetLaunchRiskAnalyzerForTests(): void {
  riskCounter = 0;
}

export function analyzeLaunchRisk(evidence: LaunchEvidenceCollectionResult): readonly LaunchRiskRecord[] {
  const risks: LaunchRiskRecord[] = [];

  for (const source of evidence.sources) {
    const categories = SOURCE_RISK_MAP[source.sourceId] ?? ['RELIABILITY'];
    const severity =
      source.status === 'FAIL'
        ? 'HIGH'
        : source.status === 'WARNING'
          ? 'MEDIUM'
          : source.residualRisk.some((r) => /critical|high/i.test(r))
            ? 'HIGH'
            : 'LOW';
    const likelihood = source.blockers.length ? 'HIGH' : source.warnings.length ? 'MEDIUM' : 'LOW';
    const impact = source.status === 'FAIL' ? 'HIGH' : source.warnings.length ? 'MEDIUM' : 'LOW';
    const residualRisk: LaunchRiskRecord['residualRisk'] =
      severity === 'HIGH' || source.residualRisk.some((r) => /high/i.test(r))
        ? 'HIGH'
        : severity === 'MEDIUM'
          ? 'MEDIUM'
          : 'LOW';

    for (const category of categories) {
      risks.push({
        readOnly: true,
        riskId: nextRiskId(),
        category,
        severity,
        likelihood,
        impact,
        evidence: [
          ...source.blockers.slice(0, 2),
          ...source.warnings.slice(0, 2),
          ...source.residualRisk.slice(0, 2),
        ],
        mitigation:
          source.status === 'PASS'
            ? 'Evidence indicates mitigation applied'
            : `Route to ${source.sourceName} repair path`,
        residualRisk,
        sourceId: source.sourceId,
      });
    }
  }

  return risks;
}

export function hasResidualHighRisk(risks: readonly LaunchRiskRecord[]): boolean {
  return risks.some((r) => r.residualRisk === 'HIGH' && (r.severity === 'HIGH' || r.severity === 'CRITICAL'));
}
