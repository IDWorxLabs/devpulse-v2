/**
 * Cloud Verification Foundation — Verification Reporting Engine bridge.
 */

import { getReport, listReports } from '../verification-reporting-engine/index.js';
import {
  getStoredCloudVerification,
  listStoredCloudVerifications,
  storeCloudVerification,
} from './cloud-verification-store.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerification, CloudVerificationReportLink } from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

export function linkCloudVerificationReport(
  verificationId: string,
  reportIds: string[],
): CloudVerificationReportLink | null {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return null;

  const validIds = reportIds.filter((id) => getReport(id) !== null);
  const mismatchDetected = validIds.length !== reportIds.length;

  const link: CloudVerificationReportLink = {
    reportIds: [...new Set([...verification.verificationReportLink.reportIds, ...validIds])],
    linkedAt: Date.now(),
    linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    mismatchDetected,
  };

  storeCloudVerification({
    ...verification,
    verificationReportLink: link,
    updatedAt: Date.now(),
  });

  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'REPORT',
    summary: `Linked reports: ${validIds.join(', ') || 'none'}`,
    scopeUsed: validIds[0] ?? null,
  });

  return link;
}

export function getReportsForCloudVerification(verificationId: string): string[] {
  return getStoredCloudVerification(verificationId)?.verificationReportLink.reportIds ?? [];
}

export function listCloudVerificationsByReport(reportId: string): CloudVerification[] {
  return listStoredCloudVerifications().filter((v) =>
    v.verificationReportLink.reportIds.includes(reportId),
  );
}

export function detectReportMismatch(verificationId: string): boolean {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return true;
  for (const id of verification.verificationReportLink.reportIds) {
    if (!getReport(id)) return true;
  }
  return verification.verificationReportLink.mismatchDetected;
}

export function listAvailableReportIdsForBridge(): string[] {
  return listReports().slice(0, 20).map((r) => r.reportId);
}
