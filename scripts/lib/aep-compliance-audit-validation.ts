/**
 * AEP Compliance Audit V1 — shared validation helpers (read-only).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const AEP_COMPLIANCE_AUDIT_V1_PASS_TOKEN = 'AEP_COMPLIANCE_AUDIT_V1_PASS' as const;
export const AEP_AUDIT_REPORT_PATH = 'architecture/AEP_COMPLIANCE_AUDIT_V1.md';
export const AEP_AUDIT_JSON_PATH = 'architecture/aep-compliance-audit-v1.json';

export const AEP_CATEGORIES = [
  'AEP-1',
  'AEP-2',
  'AEP-3',
  'AEP-4',
  'AEP-5',
  'AEP-6',
  'AEP-7',
  'AEP-8',
  'AEP-9',
  'AEP-10',
] as const;

export const AEP_SEVERITIES = ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW'] as const;

export type AepSeverity = (typeof AEP_SEVERITIES)[number];
export type AepCategory = (typeof AEP_CATEGORIES)[number];

export type AepFinding = {
  id: string;
  category: string;
  severity: AepSeverity;
  title: string;
  description: string;
  affectedFiles: string[];
  violates: string;
  recommendedFix: string;
  suggestedValidator: string;
  implementationOrder: number;
};

export type AepAudit = {
  version: '1.0.0';
  generatedAt: string;
  maturityScore: number;
  blockers: number;
  high: number;
  medium: number;
  low: number;
  findings: AepFinding[];
};

export interface AepAuditCheck {
  name: string;
  passed: boolean;
  detail: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function loadAepAudit(rootDir: string): AepAudit {
  const raw = readFileSync(join(rootDir, AEP_AUDIT_JSON_PATH), 'utf8');
  return JSON.parse(raw) as AepAudit;
}

export function validateAepAuditReportExists(rootDir: string): AepAuditCheck[] {
  const checks: AepAuditCheck[] = [];
  const reportPath = join(rootDir, AEP_AUDIT_REPORT_PATH);
  const exists = existsSync(reportPath);
  checks.push({
    name: 'report file exists',
    passed: exists,
    detail: AEP_AUDIT_REPORT_PATH,
  });

  if (exists) {
    const content = readFileSync(reportPath, 'utf8');
    checks.push({
      name: 'report contains executive summary',
      passed: /executive summary/i.test(content),
      detail: 'Executive Summary section',
    });
    checks.push({
      name: 'report contains maturity score',
      passed: /maturity score/i.test(content) && /\b\d{1,3}\s*\/\s*100\b/.test(content),
      detail: '0–100 maturity score',
    });
    checks.push({
      name: 'report contains top 10 violations',
      passed: /top 10/i.test(content),
      detail: 'Top 10 AEP violations',
    });
    checks.push({
      name: 'report references pass token',
      passed: content.includes(AEP_COMPLIANCE_AUDIT_V1_PASS_TOKEN),
      detail: AEP_COMPLIANCE_AUDIT_V1_PASS_TOKEN,
    });
  }

  return checks;
}

export function validateAepAuditJsonSchema(rootDir: string): AepAuditCheck[] {
  const checks: AepAuditCheck[] = [];
  const jsonPath = join(rootDir, AEP_AUDIT_JSON_PATH);
  checks.push({
    name: 'json file exists',
    passed: existsSync(jsonPath),
    detail: AEP_AUDIT_JSON_PATH,
  });

  if (!existsSync(jsonPath)) {
    return checks;
  }

  let audit: AepAudit;
  try {
    audit = loadAepAudit(rootDir);
    checks.push({ name: 'json parses', passed: true, detail: 'valid JSON' });
  } catch (error) {
    checks.push({
      name: 'json parses',
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    });
    return checks;
  }

  checks.push({
    name: 'version is 1.0.0',
    passed: audit.version === '1.0.0',
    detail: String(audit.version),
  });
  checks.push({
    name: 'generatedAt is ISO timestamp',
    passed: isNonEmptyString(audit.generatedAt) && !Number.isNaN(Date.parse(audit.generatedAt)),
    detail: audit.generatedAt,
  });
  checks.push({
    name: 'maturityScore is 0–100',
    passed:
      typeof audit.maturityScore === 'number' &&
      audit.maturityScore >= 0 &&
      audit.maturityScore <= 100,
    detail: String(audit.maturityScore),
  });

  for (const key of ['blockers', 'high', 'medium', 'low'] as const) {
    checks.push({
      name: `count ${key} is number`,
      passed: typeof audit[key] === 'number' && audit[key] >= 0,
      detail: String(audit[key]),
    });
  }

  checks.push({
    name: 'findings is non-empty array',
    passed: Array.isArray(audit.findings) && audit.findings.length >= 10,
    detail: String(audit.findings?.length ?? 0),
  });

  const severityTotals = { BLOCKER: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const ids = new Set<string>();

  for (const [index, finding] of audit.findings.entries()) {
    const prefix = `finding[${index}]`;
    checks.push({
      name: `${prefix} id`,
      passed: isNonEmptyString(finding.id) && !ids.has(finding.id),
      detail: finding.id ?? 'missing',
    });
    if (finding.id) ids.add(finding.id);

    checks.push({
      name: `${prefix} category`,
      passed: AEP_CATEGORIES.includes(finding.category as AepCategory),
      detail: finding.category ?? 'missing',
    });
    checks.push({
      name: `${prefix} severity`,
      passed: AEP_SEVERITIES.includes(finding.severity),
      detail: finding.severity ?? 'missing',
    });
    if (AEP_SEVERITIES.includes(finding.severity)) {
      severityTotals[finding.severity] += 1;
    }

    for (const field of [
      'title',
      'description',
      'violates',
      'recommendedFix',
      'suggestedValidator',
    ] as const) {
      checks.push({
        name: `${prefix} ${field}`,
        passed: isNonEmptyString(finding[field]),
        detail: finding[field] ? 'ok' : 'missing',
      });
    }

    checks.push({
      name: `${prefix} affectedFiles`,
      passed: isStringArray(finding.affectedFiles) && finding.affectedFiles.length > 0,
      detail: String(finding.affectedFiles?.length ?? 0),
    });
    checks.push({
      name: `${prefix} implementationOrder`,
      passed: Number.isInteger(finding.implementationOrder) && finding.implementationOrder > 0,
      detail: String(finding.implementationOrder),
    });
  }

  checks.push({
    name: 'severity counts match findings',
    passed:
      audit.blockers === severityTotals.BLOCKER &&
      audit.high === severityTotals.HIGH &&
      audit.medium === severityTotals.MEDIUM &&
      audit.low === severityTotals.LOW,
    detail: `json=${audit.blockers}/${audit.high}/${audit.medium}/${audit.low} computed=${severityTotals.BLOCKER}/${severityTotals.HIGH}/${severityTotals.MEDIUM}/${severityTotals.LOW}`,
  });

  return checks;
}

export function validateAepAuditFindingCoverage(rootDir: string): AepAuditCheck[] {
  const checks: AepAuditCheck[] = [];
  if (!existsSync(join(rootDir, AEP_AUDIT_JSON_PATH))) {
    checks.push({ name: 'json present for coverage', passed: false, detail: 'missing json' });
    return checks;
  }

  const audit = loadAepAudit(rootDir);
  const byCategory = new Map<string, number>();
  for (const category of AEP_CATEGORIES) {
    byCategory.set(category, 0);
  }
  for (const finding of audit.findings) {
    byCategory.set(finding.category, (byCategory.get(finding.category) ?? 0) + 1);
  }

  for (const category of AEP_CATEGORIES) {
    const count = byCategory.get(category) ?? 0;
    checks.push({
      name: `category ${category} represented`,
      passed: count >= 3,
      detail: `${count} findings (min 3)`,
    });
  }

  const scopeKeywords = [
    ['server', /server\//],
    ['src', /src\//],
    ['public', /public\//],
    ['scripts', /scripts\//],
    ['package.json', /package\.json/],
  ] as const;

  for (const [label, pattern] of scopeKeywords) {
    const count = audit.findings.filter((f) =>
      f.affectedFiles.some((file) => pattern.test(file)),
    ).length;
    checks.push({
      name: `scope coverage ${label}`,
      passed: count >= 2,
      detail: `${count} findings reference ${label}`,
    });
  }

  checks.push({
    name: 'minimum finding volume',
    passed: audit.findings.length >= 40,
    detail: `${audit.findings.length} findings (min 40)`,
  });

  checks.push({
    name: 'minimum blocker volume',
    passed: audit.blockers >= 5,
    detail: `${audit.blockers} blockers (min 5)`,
  });

  return checks;
}

export function validateAepAuditSeverityRanking(rootDir: string): AepAuditCheck[] {
  const checks: AepAuditCheck[] = [];
  if (!existsSync(join(rootDir, AEP_AUDIT_JSON_PATH))) {
    checks.push({ name: 'json present for ranking', passed: false, detail: 'missing json' });
    return checks;
  }

  const audit = loadAepAudit(rootDir);
  const severityRank: Record<AepSeverity, number> = {
    BLOCKER: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const blockers = audit.findings.filter((f) => f.severity === 'BLOCKER');
  const highs = audit.findings.filter((f) => f.severity === 'HIGH');

  if (blockers.length > 0 && highs.length > 0) {
    const maxBlockerOrder = Math.max(...blockers.map((f) => f.implementationOrder));
    const minHighOrder = Math.min(...highs.map((f) => f.implementationOrder));
    checks.push({
      name: 'blockers precede highs in implementation order',
      passed: maxBlockerOrder < minHighOrder,
      detail: `max blocker order ${maxBlockerOrder}, min high order ${minHighOrder}`,
    });
  }

  let monotonicViolations = 0;
  const sorted = [...audit.findings].sort((a, b) => a.implementationOrder - b.implementationOrder);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    if (severityRank[curr.severity] > severityRank[prev.severity]) {
      monotonicViolations += 1;
    }
  }

  checks.push({
    name: 'implementation order mostly severity-descending',
    passed: monotonicViolations <= Math.ceil(audit.findings.length * 0.15),
    detail: `${monotonicViolations} order inversions (max ${Math.ceil(audit.findings.length * 0.15)})`,
  });

  checks.push({
    name: 'top 10 orders are blockers or high',
    passed: sorted.slice(0, 10).every((f) => f.severity === 'BLOCKER' || f.severity === 'HIGH'),
    detail: sorted
      .slice(0, 10)
      .map((f) => `${f.id}:${f.severity}`)
      .join(', '),
  });

  return checks;
}

export function validateAepAuditImplementationOrder(rootDir: string): AepAuditCheck[] {
  const checks: AepAuditCheck[] = [];
  if (!existsSync(join(rootDir, AEP_AUDIT_JSON_PATH))) {
    checks.push({ name: 'json present for order', passed: false, detail: 'missing json' });
    return checks;
  }

  const audit = loadAepAudit(rootDir);
  const orders = audit.findings.map((f) => f.implementationOrder);
  const uniqueOrders = new Set(orders);

  checks.push({
    name: 'implementation orders are unique',
    passed: uniqueOrders.size === orders.length,
    detail: `${uniqueOrders.size}/${orders.length} unique`,
  });

  checks.push({
    name: 'implementation orders start at 1',
    passed: Math.min(...orders) === 1,
    detail: String(Math.min(...orders)),
  });

  checks.push({
    name: 'implementation orders are contiguous',
    passed: Math.max(...orders) === orders.length,
    detail: `max=${Math.max(...orders)} count=${orders.length}`,
  });

  checks.push({
    name: 'every finding has suggestedValidator',
    passed: audit.findings.every((f) => f.suggestedValidator.startsWith('validate:')),
    detail: 'validate:* prefix',
  });

  return checks;
}

export function runAepComplianceAuditValidation(
  rootDir: string,
  section?: string,
): AepAuditCheck[] {
  switch (section) {
    case 'report-exists':
      return validateAepAuditReportExists(rootDir);
    case 'json-schema':
      return validateAepAuditJsonSchema(rootDir);
    case 'finding-coverage':
      return validateAepAuditFindingCoverage(rootDir);
    case 'severity-ranking':
      return validateAepAuditSeverityRanking(rootDir);
    case 'implementation-order':
      return validateAepAuditImplementationOrder(rootDir);
    default:
      return [
        ...validateAepAuditReportExists(rootDir),
        ...validateAepAuditJsonSchema(rootDir),
        ...validateAepAuditFindingCoverage(rootDir),
        ...validateAepAuditSeverityRanking(rootDir),
        ...validateAepAuditImplementationOrder(rootDir),
      ];
  }
}
