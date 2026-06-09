/**
 * Visual verification report builder and response composer.
 */

import type { VerificationStatus, VisualVerificationReport } from './types.js';
import { isVisualVerificationQuestion } from './types.js';

let reportCounter = 0;

export function resetVisualVerificationReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextVerificationId(): string {
  reportCounter += 1;
  return `vver-${reportCounter.toString().padStart(4, '0')}`;
}

export function buildVisualVerificationReport(
  partial: Omit<VisualVerificationReport, 'verificationId' | 'createdAt' | 'verificationOnly'>,
): VisualVerificationReport {
  return {
    verificationId: nextVerificationId(),
    ...partial,
    createdAt: Date.now(),
    verificationOnly: true,
  };
}

export function composeVisualVerificationResponse(
  query: string,
  report: VisualVerificationReport,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Visual Verification Engine Response', ''];

  lines.push(`Verification ID: ${report.verificationId}`);
  lines.push(`Inspection: ${report.inspectionId ?? 'none'}`);
  lines.push(`Interaction Test: ${report.interactionTestId ?? 'none'}`);
  lines.push(`Self Vision Session: ${report.selfVisionSessionId ?? 'none'}`);
  lines.push(`Status: ${report.verificationStatus}`);
  lines.push(`Targets: ${report.verificationTargets.length}`);
  lines.push(`Results: ${report.verificationResults.length}`);
  lines.push(`Evidence: ${report.verificationEvidence.length}`);
  lines.push(`Risks: ${report.verificationRisks.length}`);
  lines.push('');

  if (lower.includes('passed') || lower.includes('verified')) {
    lines.push('Verification passed:');
    for (const r of report.verificationResults.filter((x) => x.status === 'VERIFIED')) {
      lines.push(`• [${r.targetType}] ${r.observedState}`);
    }
  }

  if (lower.includes('failed') || lower.includes('issue')) {
    lines.push('Verification failed or issues:');
    for (const r of report.verificationResults.filter(
      (x) => x.status === 'FAILED_VERIFICATION' || x.issueClassifications.length > 0,
    )) {
      lines.push(`• [${r.targetType}] ${r.issueClassifications.join(', ') || r.status}`);
    }
  }

  if (lower.includes('evidence')) {
    lines.push('Verification evidence:');
    for (const e of report.verificationEvidence.slice(0, 10)) {
      lines.push(`• [${e.evidenceType}] ${e.summary}`);
    }
  }

  if (lower.includes('risk')) {
    lines.push('Verification risks:');
    for (const risk of report.verificationRisks) {
      lines.push(`• [${risk.level}] ${risk.description}`);
    }
  }

  if (lower.includes('interaction') || lower.includes('outcome')) {
    lines.push('Interaction outcomes verified:');
    for (const r of report.verificationResults.filter((x) => x.targetType === 'INTERACTION_TARGET')) {
      lines.push(`• ${r.observedState}`);
    }
  }

  if (report.blockedReasons.length > 0) {
    lines.push('Blocked reasons:');
    for (const b of report.blockedReasons) lines.push(`• ${b}`);
  }

  lines.push('');
  lines.push('Verification only — no UI modification, code changes, patch application, or auto-fix.');
  return lines.join('\n');
}

export interface VisualVerificationFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildVisualVerificationFailureContext(query: string): VisualVerificationFailureContext[] {
  if (!isVisualVerificationQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: VisualVerificationFailureContext[] = [
    {
      title: 'Visual verification: verification only',
      description: 'Phase 16.6 evaluates visual outcomes without UI modification or repairs',
      sourceSystem: 'visual_verification_engine',
      severity: 'LOW',
    },
  ];

  if (lower.includes('inspection') || lower.includes('missing inspection')) {
    records.push({
      title: 'Missing inspection report',
      description: 'UI inspection report required before visual verification',
      sourceSystem: 'ui_inspection_engine',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('interaction report') || lower.includes('missing interaction')) {
    records.push({
      title: 'Missing interaction report',
      description: 'Interaction testing report required before outcome verification',
      sourceSystem: 'interaction_testing_engine',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('self vision') || lower.includes('missing session')) {
    records.push({
      title: 'Missing self vision session',
      description: 'Self vision session required for verification evidence',
      sourceSystem: 'self_vision_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('missing evidence') || lower.includes('no evidence')) {
    records.push({
      title: 'Missing evidence',
      description: 'Verification evidence not available for assessment',
      sourceSystem: 'visual_verification_engine',
      severity: 'HIGH',
    });
  }

  if (lower.includes('blocked') || lower.includes('verification blocked')) {
    records.push({
      title: 'Verification blocked',
      description: 'Visual verification gates failed',
      sourceSystem: 'visual_verification_engine',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('verification failed') || lower.includes('failed verification')) {
    records.push({
      title: 'Verification failed',
      description: 'One or more verification targets failed assessment',
      sourceSystem: 'visual_verification_engine',
      severity: 'HIGH',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 protection violation',
      description: 'Visual verification must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  return records;
}
