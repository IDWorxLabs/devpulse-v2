/**
 * Production Readiness Gate V1 — production risk assessment engine.
 */

import type {
  ProductionCategoryResult,
  ProductionRiskEntry,
  ProductionRiskLevel,
} from './production-readiness-gate-v1-types.js';
import type { WorkspaceProductionSignals } from './workspace-production-checks.js';
import type { UpstreamEvidenceSnapshot } from './production-readiness-gate-v1-types.js';

function risk(
  profile: string,
  productName: string,
  level: ProductionRiskLevel,
  category: string,
  detail: string,
  recommendation: string,
): ProductionRiskEntry {
  return {
    readOnly: true,
    profile,
    productName,
    riskLevel: level,
    category,
    detail,
    recommendation,
  };
}

export function assessProductionRisks(input: {
  profile: string;
  productName: string;
  upstream: UpstreamEvidenceSnapshot;
  signals: WorkspaceProductionSignals;
  domainScores: ProductionCategoryResult['domainScores'];
}): ProductionRiskEntry[] {
  const risks: ProductionRiskEntry[] = [];
  const { profile, productName, upstream, signals, domainScores } = input;

  if (signals.hasHardcodedSecrets) {
    risks.push(
      risk(
        profile,
        productName,
        'CRITICAL',
        'Security',
        'Hardcoded secrets detected in generated source',
        'Move secrets to environment variables and rotate exposed credentials',
      ),
    );
  }

  if (!signals.hasEnvExample && !signals.usesProcessEnv) {
    risks.push(
      risk(
        profile,
        productName,
        'HIGH',
        'Configuration',
        'Missing environment configuration documentation',
        'Add .env.example and document required production variables',
      ),
    );
  }

  if (!signals.hasHealthIndicator) {
    risks.push(
      risk(
        profile,
        productName,
        'MEDIUM',
        'Observability',
        'No health check or operational visibility endpoint',
        'Add /health or equivalent runtime health indicator',
      ),
    );
  }

  if (!signals.hasAuthPatterns) {
    risks.push(
      risk(
        profile,
        productName,
        'MEDIUM',
        'Security',
        'No authentication layer for public deployment',
        'Add authentication before exposing to untrusted users',
      ),
    );
  }

  if (!signals.hasReadme) {
    risks.push(
      risk(
        profile,
        productName,
        'HIGH',
        'Recovery',
        'No recovery or operational runbook documentation',
        'Add README with deployment, backup, and recovery steps',
      ),
    );
  }

  if (!upstream.verificationProven) {
    risks.push(
      risk(
        profile,
        productName,
        'CRITICAL',
        'Verification',
        'UVL verification not proven for this category',
        'Complete UVL verification before production deployment',
      ),
    );
  }

  if (!upstream.launchReady) {
    risks.push(
      risk(
        profile,
        productName,
        'HIGH',
        'Launch Readiness',
        'AFLA launch verdict not LAUNCH_READY',
        'Resolve launch readiness blockers before production gate',
      ),
    );
  }

  const observability = domainScores.find((d) => d.domain === 'OBSERVABILITY');
  if (observability && observability.score < 65) {
    risks.push(
      risk(
        profile,
        productName,
        'MEDIUM',
        'Observability',
        'Insufficient logging and error reporting for production operations',
        'Add structured logging and error reporting hooks',
      ),
    );
  }

  if (risks.length === 0) {
    risks.push(
      risk(
        profile,
        productName,
        'LOW',
        'Operational',
        'No critical production risks detected — maintain hardening guidance',
        'Review warnings and apply recommended production hardening',
      ),
    );
  }

  return risks;
}

export function buildHardeningRecommendations(
  risks: readonly ProductionRiskEntry[],
  domainScores: ProductionCategoryResult['domainScores'],
): string[] {
  const recommendations = new Set<string>();
  for (const entry of risks) {
    if (entry.riskLevel === 'CRITICAL' || entry.riskLevel === 'HIGH') {
      recommendations.add(entry.recommendation);
    }
  }
  for (const domain of domainScores) {
    if (domain.score < 75) {
      for (const finding of domain.findings) {
        if (/add|missing|document|recommended/i.test(finding)) {
          recommendations.add(`${domain.label}: ${finding}`);
        }
      }
    }
  }
  if (recommendations.size === 0) {
    recommendations.add('Maintain production evidence freshness and monitor domain scores each release');
  }
  return [...recommendations];
}

export function buildMissingRequirements(input: {
  upstream: UpstreamEvidenceSnapshot;
  signals: WorkspaceProductionSignals;
}): string[] {
  const missing: string[] = [];
  if (!input.upstream.buildProven) missing.push('Build proof');
  if (!input.upstream.previewProven) missing.push('Preview proof');
  if (!input.upstream.verificationProven) missing.push('UVL verification proof');
  if (!input.upstream.launchReady) missing.push('AFLA launch readiness');
  if (!input.signals.hasEnvExample) missing.push('Environment configuration documentation');
  if (!input.signals.hasHealthIndicator) missing.push('Health/operational visibility indicator');
  if (!input.signals.hasReadme) missing.push('Operational recovery documentation');
  return missing;
}
