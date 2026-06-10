/**
 * Security Hardening — secret exposure analyzer.
 * Safe static pattern detection only. Never prints raw secret values.
 */

import type {
  RedactedExposureFinding,
  SecretExposureAnalysis,
  SecretExposureType,
  SecurityHardeningInput,
  SecurityRiskLevel,
} from './security-hardening-types.js';
import { redactSecretValue, resolveSecurityRiskLevel } from './security-hardening-types.js';
import { getCachedExposureAnalysis, setCachedExposureAnalysis } from './security-hardening-cache.js';

let exposureAnalysisCount = 0;

interface SecretPattern {
  type: SecretExposureType;
  pattern: RegExp;
  severity: SecurityRiskLevel;
  recommendation: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  { type: 'api_key', pattern: /sk_live_[A-Za-z0-9]{16,}/, severity: 'CRITICAL', recommendation: 'Move API keys to environment variables or secret vault' },
  { type: 'api_key', pattern: /AKIA[0-9A-Z]{16}/, severity: 'CRITICAL', recommendation: 'Rotate AWS access keys and use IAM roles' },
  { type: 'token', pattern: /Bearer\s+[A-Za-z0-9._-]{20,}/, severity: 'HIGH', recommendation: 'Store bearer tokens in secure secret storage' },
  { type: 'private_key', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, severity: 'CRITICAL', recommendation: 'Remove private keys from source and use secure key management' },
  { type: 'access_secret', pattern: /access_secret[=:]\s*['"]?[A-Za-z0-9._-]{12,}/i, severity: 'HIGH', recommendation: 'Externalize access secrets' },
  { type: 'signing_secret', pattern: /signing_secret[=:]\s*['"]?[A-Za-z0-9._-]{12,}/i, severity: 'HIGH', recommendation: 'Use signing secret vault' },
  { type: 'cloud_credential', pattern: /cloud_credential[=:]\s*['"]?[A-Za-z0-9._-]{12,}/i, severity: 'HIGH', recommendation: 'Use cloud credential manager' },
  { type: 'webhook_secret', pattern: /whsec_[A-Za-z0-9]{16,}/, severity: 'HIGH', recommendation: 'Rotate webhook secrets' },
  { type: 'database_url', pattern: /postgres(ql)?:\/\/[^:]+:[^@]+@/i, severity: 'CRITICAL', recommendation: 'Use connection string secrets manager' },
  { type: 'payment_secret', pattern: /sk_test_[A-Za-z0-9]{16,}/, severity: 'CRITICAL', recommendation: 'Rotate payment provider secrets immediately' },
  { type: 'mobile_signing_credential', pattern: /mobile_signing[=:]\s*['"]?[A-Za-z0-9._-]{12,}/i, severity: 'HIGH', recommendation: 'Store mobile signing credentials in CI secret store' },
];

function extractMatchValue(content: string, pattern: RegExp): string | undefined {
  const match = content.match(pattern);
  if (!match) return undefined;
  const full = match[0];
  const eqSplit = full.split(/[=:]\s*/);
  return eqSplit.length > 1 ? eqSplit[1].replace(/['"]/g, '') : full;
}

function scanContent(
  content: string,
  filePath: string,
  findings: RedactedExposureFinding[],
  warnings: string[],
): void {
  for (const { type, pattern, severity, recommendation } of SECRET_PATTERNS) {
    if (!pattern.test(content)) continue;
    const raw = extractMatchValue(content, pattern) ?? 'detected';
    const redactedPreview = redactSecretValue(raw);
    findings.push({
      filePath,
      riskType: type,
      redactedPreview,
      severity,
      recommendation,
    });
    warnings.push(`${type}_exposure_risk`);
  }
}

export function analyzeSecretExposure(input: SecurityHardeningInput): SecretExposureAnalysis {
  const contentKey = (input.secretScanContent ?? []).join('|').slice(0, 120);
  const pathKey = (input.secretScanPaths ?? []).join('|');
  const cacheKey = [contentKey, pathKey].join('::');

  const cached = getCachedExposureAnalysis(cacheKey);
  if (cached) return cached;

  exposureAnalysisCount += 1;
  const exposureWarnings: string[] = [];
  const redactedFindings: RedactedExposureFinding[] = [];
  let penalty = 0;

  const contents = input.secretScanContent ?? [];
  const paths = input.secretScanPaths ?? [];

  for (let i = 0; i < contents.length; i++) {
    const filePath = paths[i] ?? `scan-target-${i}`;
    scanContent(contents[i], filePath, redactedFindings, exposureWarnings);
  }

  penalty += redactedFindings.length * 12;
  const uniqueWarnings = [...new Set(exposureWarnings)];

  const exposureScore = Math.max(0, Math.min(100, Math.round(95 - penalty)));

  const result: SecretExposureAnalysis = {
    exposureScore,
    exposureRiskLevel: resolveSecurityRiskLevel(exposureScore),
    exposureWarnings: uniqueWarnings,
    redactedFindings,
  };

  setCachedExposureAnalysis(cacheKey, result);
  return result;
}

export function getExposureAnalysisCount(): number {
  return exposureAnalysisCount;
}

export function resetSecretExposureAnalyzerForTests(): void {
  exposureAnalysisCount = 0;
}
