/**
 * Production Readiness Gate V1 — domain scoring.
 */

import type {
  ProductionReadinessDomainId,
  ProductionReadinessDomainScore,
} from './production-readiness-gate-v1-types.js';
import type { UpstreamEvidenceSnapshot } from './production-readiness-gate-v1-types.js';
import type { WorkspaceProductionSignals } from './workspace-production-checks.js';

const DOMAIN_LABELS: Record<ProductionReadinessDomainId, string> = {
  SECURITY: 'Security',
  RELIABILITY: 'Reliability',
  OBSERVABILITY: 'Observability',
  CONFIGURATION: 'Configuration',
  DEPLOYMENT: 'Deployment',
  RECOVERY: 'Recovery',
  SCALABILITY: 'Scalability',
  DATA_PROTECTION: 'Data Protection',
  OPERATIONAL_RISK: 'Operational Risk',
};

function statusFromScore(score: number): ProductionReadinessDomainScore['status'] {
  if (score >= 80) return 'MATURE';
  if (score >= 55) return 'PARTIAL';
  return 'MISSING';
}

function scoreSecurity(signals: WorkspaceProductionSignals): ProductionReadinessDomainScore {
  let score = 70;
  const findings: string[] = [];
  if (signals.hasHardcodedSecrets) {
    score -= 40;
    findings.push('Hardcoded secrets detected in source');
  } else {
    score += 10;
    findings.push('No hardcoded secrets detected');
  }
  if (signals.hasAuthPatterns) {
    score += 8;
    findings.push('Authentication patterns present');
  } else {
    findings.push('No authentication layer — acceptable for demo, required for public deployment');
  }
  if (signals.usesProcessEnv || signals.hasEnvExample) {
    score += 8;
    findings.push('Environment-aware configuration detected');
  }
  return {
    readOnly: true,
    domain: 'SECURITY',
    label: DOMAIN_LABELS.SECURITY,
    score: Math.max(0, Math.min(100, score)),
    status: statusFromScore(score),
    findings,
  };
}

function scoreReliability(
  signals: WorkspaceProductionSignals,
  upstream: UpstreamEvidenceSnapshot,
): ProductionReadinessDomainScore {
  let score = 60;
  const findings: string[] = [];
  if (upstream.buildProven && signals.hasBuildOutput) {
    score += 20;
    findings.push('Build proven with reproducible artifacts');
  }
  if (upstream.previewProven) {
    score += 10;
    findings.push('Preview runtime proven stable');
  }
  if (signals.hasErrorBoundary) {
    score += 8;
    findings.push('Error boundary patterns detected');
  } else {
    findings.push('No explicit error boundaries — add for production resilience');
  }
  if (signals.hasBuildScript) {
    score += 5;
    findings.push('Build script defined in package.json');
  }
  return {
    readOnly: true,
    domain: 'RELIABILITY',
    label: DOMAIN_LABELS.RELIABILITY,
    score: Math.max(0, Math.min(100, score)),
    status: statusFromScore(score),
    findings,
  };
}

function scoreObservability(signals: WorkspaceProductionSignals): ProductionReadinessDomainScore {
  let score = 55;
  const findings: string[] = [];
  if (signals.hasLogging) {
    score += 20;
    findings.push('Logging instrumentation present');
  } else {
    findings.push('Minimal logging — add structured logging for production');
  }
  if (signals.hasHealthIndicator) {
    score += 15;
    findings.push('Health/status indicators detected');
  } else {
    findings.push('No health check endpoint — recommended for production');
  }
  if (signals.hasErrorBoundary) score += 5;
  return {
    readOnly: true,
    domain: 'OBSERVABILITY',
    label: DOMAIN_LABELS.OBSERVABILITY,
    score: Math.max(0, Math.min(100, score)),
    status: statusFromScore(score),
    findings,
  };
}

function scoreConfiguration(signals: WorkspaceProductionSignals): ProductionReadinessDomainScore {
  let score = 58;
  const findings: string[] = [];
  if (signals.hasEnvExample) {
    score += 25;
    findings.push('.env.example documents required configuration');
  } else {
    findings.push('Missing .env.example — document environment variables');
  }
  if (signals.usesProcessEnv) {
    score += 12;
    findings.push('Environment variable usage detected');
  }
  return {
    readOnly: true,
    domain: 'CONFIGURATION',
    label: DOMAIN_LABELS.CONFIGURATION,
    score: Math.max(0, Math.min(100, score)),
    status: statusFromScore(score),
    findings,
  };
}

function scoreDeployment(
  signals: WorkspaceProductionSignals,
  upstream: UpstreamEvidenceSnapshot,
): ProductionReadinessDomainScore {
  let score = 55;
  const findings: string[] = [];
  if (signals.hasBuildOutput) {
    score += 25;
    findings.push('Production build artifacts present in dist/');
  }
  if (signals.hasBuildScript) {
    score += 10;
    findings.push('Build pipeline script available');
  }
  if (signals.hasStartScript) {
    score += 8;
    findings.push('Production startup script available');
  } else {
    findings.push('No start/preview script — add production startup path');
  }
  if (upstream.previewProven) {
    score += 10;
    findings.push('Preview deployment path validated');
  }
  return {
    readOnly: true,
    domain: 'DEPLOYMENT',
    label: DOMAIN_LABELS.DEPLOYMENT,
    score: Math.max(0, Math.min(100, score)),
    status: statusFromScore(score),
    findings,
  };
}

function scoreRecovery(signals: WorkspaceProductionSignals): ProductionReadinessDomainScore {
  let score = 62;
  const findings: string[] = [];
  if (signals.hasReadme) {
    score += 12;
    findings.push('README provides operational guidance');
  } else {
    findings.push('No recovery/runbook documentation');
  }
  if (signals.hasLocalStorage) {
    score += 8;
    findings.push('Client-side persistence detected — document backup assumptions');
  }
  findings.push('Restart resilience inferred from static SPA build output');
  score += 10;
  return {
    readOnly: true,
    domain: 'RECOVERY',
    label: DOMAIN_LABELS.RECOVERY,
    score: Math.max(0, Math.min(100, score)),
    status: statusFromScore(score),
    findings,
  };
}

function scoreScalability(signals: WorkspaceProductionSignals): ProductionReadinessDomainScore {
  let score = 68;
  const findings: string[] = [];
  if (signals.hasModularStructure) {
    score += 15;
    findings.push('Modular component structure supports scaling');
  }
  if (signals.sourceFileCount >= 5) {
    score += 8;
    findings.push('Multi-file architecture detected');
  }
  findings.push('Static SPA deployment model — horizontal scale via CDN');
  score += 5;
  return {
    readOnly: true,
    domain: 'SCALABILITY',
    label: DOMAIN_LABELS.SCALABILITY,
    score: Math.max(0, Math.min(100, score)),
    status: statusFromScore(score),
    findings,
  };
}

function scoreDataProtection(signals: WorkspaceProductionSignals): ProductionReadinessDomainScore {
  let score = 70;
  const findings: string[] = [];
  if (signals.hasLocalStorage) {
    score += 5;
    findings.push('Local storage used — document retention and PII handling');
  }
  if (!signals.hasHardcodedSecrets) {
    score += 10;
    findings.push('No sensitive data hardcoded in source');
  }
  if (!signals.hasAuthPatterns) {
    findings.push('No auth layer — user data isolation not enforced');
    score -= 5;
  }
  return {
    readOnly: true,
    domain: 'DATA_PROTECTION',
    label: DOMAIN_LABELS.DATA_PROTECTION,
    score: Math.max(0, Math.min(100, score)),
    status: statusFromScore(score),
    findings,
  };
}

function scoreOperationalRisk(
  domainScores: ProductionReadinessDomainScore[],
  upstream: UpstreamEvidenceSnapshot,
): ProductionReadinessDomainScore {
  const avg = domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length;
  let score = Math.round(avg);
  const findings: string[] = [];
  if (!upstream.launchReady) {
    score -= 15;
    findings.push('Launch readiness not proven — operational risk elevated');
  } else {
    findings.push('Launch readiness proven via AFLA');
  }
  if (!upstream.verificationProven) {
    score -= 20;
    findings.push('Verification not proven — operational risk elevated');
  } else {
    findings.push('Verification proven via UVL');
  }
  const lowDomains = domainScores.filter((d) => d.score < 60).map((d) => d.label);
  if (lowDomains.length > 0) {
    findings.push(`Low-scoring domains: ${lowDomains.join(', ')}`);
    score -= lowDomains.length * 3;
  } else {
    findings.push('All operational domains above minimum threshold');
  }
  return {
    readOnly: true,
    domain: 'OPERATIONAL_RISK',
    label: DOMAIN_LABELS.OPERATIONAL_RISK,
    score: Math.max(0, Math.min(100, score)),
    status: statusFromScore(score),
    findings,
  };
}

export function assessProductionDomains(input: {
  signals: WorkspaceProductionSignals;
  upstream: UpstreamEvidenceSnapshot;
}): readonly ProductionReadinessDomainScore[] {
  const base = [
    scoreSecurity(input.signals),
    scoreReliability(input.signals, input.upstream),
    scoreObservability(input.signals),
    scoreConfiguration(input.signals),
    scoreDeployment(input.signals, input.upstream),
    scoreRecovery(input.signals),
    scoreScalability(input.signals),
    scoreDataProtection(input.signals),
  ];
  return [...base, scoreOperationalRisk(base, input.upstream)];
}

export function computeCategoryProductionScore(input: {
  upstream: UpstreamEvidenceSnapshot;
  domainScores: readonly ProductionReadinessDomainScore[];
}): number {
  const upstreamPoints =
    (input.upstream.buildProven ? 15 : 0) +
    (input.upstream.previewProven ? 15 : 0) +
    (input.upstream.verificationProven ? 15 : 0) +
    (input.upstream.launchReady ? 15 : 0) +
    (input.upstream.productArchitectReviewed ? 10 : 0);
  const upstreamNormalized = (upstreamPoints / 70) * 100;
  const domainAvg =
    input.domainScores.reduce((sum, d) => sum + d.score, 0) / input.domainScores.length;
  return Math.round(0.35 * upstreamNormalized + 0.65 * domainAvg);
}

export function deriveProductionVerdict(score: number): import('./production-readiness-gate-v1-types.js').ProductionReadinessVerdict {
  if (score >= 80) return 'PRODUCTION_READY';
  if (score >= 70) return 'PRODUCTION_READY_WITH_WARNINGS';
  if (score >= 55) return 'NEEDS_PRODUCTION_HARDENING';
  return 'NOT_PRODUCTION_READY';
}
