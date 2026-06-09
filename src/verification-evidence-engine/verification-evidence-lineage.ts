/**
 * Evidence lineage — parent/child/derived/supporting/contradicting/superseded relationships.
 * Foundation only — no Trust Engine decisions.
 */

import type { EvidenceLineage, EvidenceRecord } from './verification-evidence-types.js';

export function emptyEvidenceLineage(): EvidenceLineage {
  return {
    parentEvidence: [],
    childEvidence: [],
    derivedEvidence: [],
    supportingEvidence: [],
    contradictingEvidence: [],
    supersededEvidence: [],
  };
}

export function linkParentChild(
  parent: EvidenceRecord,
  child: EvidenceRecord,
): { parent: EvidenceRecord; child: EvidenceRecord } {
  const parentLineage = { ...parent.evidenceLineage };
  const childLineage = { ...child.evidenceLineage };

  if (!parentLineage.childEvidence.includes(child.evidenceId)) {
    parentLineage.childEvidence = [...parentLineage.childEvidence, child.evidenceId];
  }
  if (!childLineage.parentEvidence.includes(parent.evidenceId)) {
    childLineage.parentEvidence = [...childLineage.parentEvidence, parent.evidenceId];
  }

  return {
    parent: { ...parent, evidenceLineage: parentLineage },
    child: { ...child, evidenceLineage: childLineage },
  };
}

export function linkDerivedEvidence(
  source: EvidenceRecord,
  derivedId: string,
): EvidenceRecord {
  const lineage = { ...source.evidenceLineage };
  if (!lineage.derivedEvidence.includes(derivedId)) {
    lineage.derivedEvidence = [...lineage.derivedEvidence, derivedId];
  }
  return { ...source, evidenceLineage: lineage };
}

export function linkSupportingEvidence(
  primary: EvidenceRecord,
  supportingId: string,
): EvidenceRecord {
  const lineage = { ...primary.evidenceLineage };
  if (!lineage.supportingEvidence.includes(supportingId)) {
    lineage.supportingEvidence = [...lineage.supportingEvidence, supportingId];
  }
  return { ...primary, evidenceLineage: lineage };
}

export function countLineageLinks(records: EvidenceRecord[]): number {
  let count = 0;
  for (const r of records) {
    count +=
      r.evidenceLineage.parentEvidence.length +
      r.evidenceLineage.childEvidence.length +
      r.evidenceLineage.derivedEvidence.length +
      r.evidenceLineage.supportingEvidence.length +
      r.evidenceLineage.contradictingEvidence.length +
      r.evidenceLineage.supersededEvidence.length;
  }
  return count;
}

export function extractLineageReportEntries(
  records: EvidenceRecord[],
): Array<{ evidenceId: string; parents: string[]; children: string[] }> {
  return records.map((r) => ({
    evidenceId: r.evidenceId,
    parents: [...r.evidenceLineage.parentEvidence],
    children: [...r.evidenceLineage.childEvidence],
  }));
}

export function detectBrokenLineageReferences(
  records: EvidenceRecord[],
): Array<{ evidenceId: string; missingRef: string }> {
  const ids = new Set(records.map((r) => r.evidenceId));
  const broken: Array<{ evidenceId: string; missingRef: string }> = [];

  for (const r of records) {
    const refs = [
      ...r.evidenceLineage.parentEvidence,
      ...r.evidenceLineage.childEvidence,
      ...r.evidenceLineage.derivedEvidence,
      ...r.evidenceLineage.supportingEvidence,
      ...r.evidenceLineage.contradictingEvidence,
      ...r.evidenceLineage.supersededEvidence,
    ];
    for (const ref of refs) {
      if (!ids.has(ref)) {
        broken.push({ evidenceId: r.evidenceId, missingRef: ref });
      }
    }
  }
  return broken;
}
