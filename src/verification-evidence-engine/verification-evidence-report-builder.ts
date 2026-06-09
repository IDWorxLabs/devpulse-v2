/**
 * Evidence report builder — inventory, ownership, lineage, traceability, diagnostics, summary.
 */

import { extractOwnershipReportEntries } from './verification-evidence-ownership.js';
import { countLineageLinks, extractLineageReportEntries } from './verification-evidence-lineage.js';
import {
  buildTraceabilityIndex,
  countTraceabilityKeys,
  summarizeTraceabilityIndex,
} from './verification-evidence-traceability.js';
import { countEvidenceByCategory } from './verification-evidence-query.js';
import type {
  EvidenceAuthorityState,
  EvidenceDiagnosticsReport,
  EvidenceInventoryReport,
  EvidenceLineageReport,
  EvidenceOwnershipReport,
  EvidenceRecord,
  EvidenceSummaryReport,
  EvidenceTraceabilityReport,
  EvidenceValidationResult,
} from './verification-evidence-types.js';
import { isVerificationEvidenceQuestion } from './verification-evidence-types.js';

let reportCounter = 0;

export function resetVerificationEvidenceReportCounterForTests(): void {
  reportCounter = 0;
}

function nextReportId(prefix: string): string {
  reportCounter += 1;
  return `${prefix}-${reportCounter.toString().padStart(4, '0')}`;
}

export function nextEvidenceAuthorityId(): string {
  reportCounter += 1;
  return `vevauth-${reportCounter.toString().padStart(4, '0')}`;
}

export function buildEvidenceInventoryReport(records: EvidenceRecord[]): EvidenceInventoryReport {
  return {
    reportId: nextReportId('vevinv'),
    evidenceCount: records.length,
    evidenceIds: records.map((r) => r.evidenceId),
    categories: countEvidenceByCategory(records),
    createdAt: Date.now(),
    authorityOnly: true,
  };
}

export function buildEvidenceOwnershipReport(records: EvidenceRecord[]): EvidenceOwnershipReport {
  return {
    reportId: nextReportId('vevown'),
    ownershipRecords: extractOwnershipReportEntries(records),
    createdAt: Date.now(),
    authorityOnly: true,
  };
}

export function buildEvidenceLineageReport(records: EvidenceRecord[]): EvidenceLineageReport {
  return {
    reportId: nextReportId('vevlin'),
    lineageLinks: extractLineageReportEntries(records),
    createdAt: Date.now(),
    authorityOnly: true,
  };
}

export function buildEvidenceTraceabilityReport(records: EvidenceRecord[]): EvidenceTraceabilityReport {
  const index = buildTraceabilityIndex(records);
  return {
    reportId: nextReportId('vevtrc'),
    traceabilityIndex: summarizeTraceabilityIndex(index),
    createdAt: Date.now(),
    authorityOnly: true,
  };
}

export function buildEvidenceDiagnosticsReport(
  validation: EvidenceValidationResult,
): EvidenceDiagnosticsReport {
  return {
    reportId: nextReportId('vevdiag'),
    issueCount: validation.issues.length,
    issues: validation.issues,
    createdAt: Date.now(),
    authorityOnly: true,
  };
}

export function deriveEvidenceAuthorityState(
  blocked: boolean,
  validationValid: boolean,
): EvidenceAuthorityState {
  if (blocked) return 'BLOCKED';
  if (!validationValid) return 'INVALID';
  return 'READY';
}

export function buildEvidenceSummaryReport(opts: {
  authorityState: EvidenceAuthorityState;
  records: EvidenceRecord[];
  validation: EvidenceValidationResult;
  blockedReasons: string[];
}): EvidenceSummaryReport {
  const index = buildTraceabilityIndex(opts.records);
  return {
    reportId: nextReportId('vevsum'),
    authorityId: nextEvidenceAuthorityId(),
    authorityState: opts.authorityState,
    evidenceCount: opts.records.length,
    categoryCount: Object.keys(countEvidenceByCategory(opts.records)).length,
    lineageLinkCount: countLineageLinks(opts.records),
    traceabilityKeyCount: countTraceabilityKeys(index),
    validationValid: opts.validation.valid,
    warnings: opts.validation.warnings,
    blockedReasons: opts.blockedReasons,
    createdAt: Date.now(),
    authorityOnly: true,
  };
}

export function composeVerificationEvidenceResponse(
  query: string,
  summary: EvidenceSummaryReport,
  inventory: EvidenceInventoryReport,
  ownership: EvidenceOwnershipReport,
  lineage: EvidenceLineageReport,
  traceability: EvidenceTraceabilityReport,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Verification Evidence Engine Response', ''];

  lines.push(`Authority ID: ${summary.authorityId}`);
  lines.push(`State: ${summary.authorityState}`);
  lines.push(`Evidence count: ${summary.evidenceCount}`);
  lines.push(`Categories: ${summary.categoryCount}`);
  lines.push('');

  if (lower.includes('inventory') || lower.includes('what evidence exists')) {
    lines.push('Evidence inventory:');
    for (const id of inventory.evidenceIds.slice(0, 12)) {
      lines.push(`• ${id}`);
    }
    lines.push('Categories:');
    for (const [cat, count] of Object.entries(inventory.categories)) {
      lines.push(`• ${cat}: ${count}`);
    }
  }

  if (lower.includes('ownership') || lower.includes('who produced')) {
    lines.push('Evidence ownership:');
    for (const o of ownership.ownershipRecords.slice(0, 8)) {
      lines.push(`• ${o.evidenceId} — ${o.ownerModule} — ${o.producedBy}`);
    }
  }

  if (lower.includes('lineage')) {
    lines.push('Evidence lineage:');
    for (const l of lineage.lineageLinks.filter((x) => x.parents.length > 0 || x.children.length > 0).slice(0, 8)) {
      lines.push(`• ${l.evidenceId} ← ${l.parents.join(', ') || 'none'} → ${l.children.join(', ') || 'none'}`);
    }
  }

  if (lower.includes('traceability') || lower.includes('locate')) {
    lines.push('Traceability index:');
    for (const t of traceability.traceabilityIndex.slice(0, 8)) {
      lines.push(`• ${t.key}: ${t.evidenceIds.length} record(s)`);
    }
  }

  if (lower.includes('validation') || lower.includes('integrity')) {
    lines.push(`Validation valid: ${summary.validationValid}`);
    lines.push(`Lineage links: ${summary.lineageLinkCount}`);
    lines.push(`Traceability keys: ${summary.traceabilityKeyCount}`);
  }

  if (summary.blockedReasons.length > 0) {
    lines.push('Blocked reasons:');
    for (const b of summary.blockedReasons) lines.push(`• ${b}`);
  }

  lines.push('');
  lines.push('Authority only — no verification execution, trust engine decisions, or auto-fix.');
  return lines.join('\n');
}

export interface VerificationEvidenceFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildVerificationEvidenceFailureContext(
  query: string,
): VerificationEvidenceFailureContext[] {
  if (!isVerificationEvidenceQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: VerificationEvidenceFailureContext[] = [
    {
      title: 'Verification evidence: authority only',
      description: 'Phase 16.10 evidence authority layer without provider execution or trust decisions',
      sourceSystem: 'verification_evidence_engine',
      severity: 'LOW',
    },
  ];

  if (lower.includes('duplicate') || lower.includes('duplicate id')) {
    records.push({
      title: 'Duplicate evidence id',
      description: 'Evidence record rejected due to duplicate identifier',
      sourceSystem: 'verification_evidence_engine',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('broken lineage') || lower.includes('lineage')) {
    records.push({
      title: 'Broken lineage reference',
      description: 'Evidence lineage references missing or invalid evidence record',
      sourceSystem: 'verification_evidence_engine',
      severity: 'HIGH',
    });
  }

  if (lower.includes('missing ownership') || lower.includes('ownership')) {
    records.push({
      title: 'Missing ownership',
      description: 'Evidence record lacks required ownership metadata',
      sourceSystem: 'verification_evidence_engine',
      severity: 'HIGH',
    });
  }

  if (lower.includes('invalid reference')) {
    records.push({
      title: 'Invalid evidence reference',
      description: 'Evidence dependency or relationship references non-existent record',
      sourceSystem: 'verification_evidence_engine',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('evidence blocked') || lower.includes('blocked')) {
    records.push({
      title: 'Evidence authority blocked',
      description: 'Evidence authority gates failed — inspect registration and ownership',
      sourceSystem: 'verification_evidence_engine',
      severity: 'CRITICAL',
    });
  }

  return records;
}
