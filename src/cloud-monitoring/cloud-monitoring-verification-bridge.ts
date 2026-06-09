/**
 * Cloud Monitoring Foundation — Cloud Verification Foundation bridge.
 */

import { getCloudVerification, listCloudVerifications } from '../cloud-verification/index.js';
import { getStoredCloudMonitoringRecord, listStoredCloudMonitoringRecords, storeCloudMonitoringRecord } from './cloud-monitoring-store.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import type { CloudMonitoringRecord, CloudMonitoringVerificationLink } from './cloud-monitoring-types.js';
import { CLOUD_MONITORING_FOUNDATION_OWNER_MODULE } from './cloud-monitoring-types.js';

export function linkMonitoringToVerification(
  monitoringId: string,
  verificationId: string,
): CloudMonitoringVerificationLink | null {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  const verification = getCloudVerification(verificationId);
  if (!record || !verification) return null;

  const mismatch = verification.verificationOwner.projectId !== record.monitoringOwner.projectId;
  const link: CloudMonitoringVerificationLink = {
    verificationId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudMonitoringRecord({
    ...record,
    monitoringVerificationLink: link,
    monitoringOwner: { ...record.monitoringOwner, verificationId },
    monitoringRelationships: {
      ...record.monitoringRelationships,
      relatedVerificationIds: [
        ...new Set([...record.monitoringRelationships.relatedVerificationIds, verificationId]),
      ],
    },
    updatedAt: Date.now(),
  });

  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'VERIFICATION',
    summary: `Linked to verification ${verificationId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: verificationId,
  });

  return link;
}

export function getVerificationForMonitoring(monitoringId: string): string | null {
  return getStoredCloudMonitoringRecord(monitoringId)?.monitoringVerificationLink.verificationId ?? null;
}

export function listMonitoringByVerification(verificationId: string): CloudMonitoringRecord[] {
  return listStoredCloudMonitoringRecords().filter(
    (r) =>
      r.monitoringVerificationLink.verificationId === verificationId ||
      r.monitoringOwner.verificationId === verificationId,
  );
}

export function detectMonitoringVerificationMismatch(monitoringId: string): boolean {
  const record = getStoredCloudMonitoringRecord(monitoringId);
  if (!record) return true;
  const verification = getCloudVerification(record.monitoringVerificationLink.verificationId);
  if (!verification) return true;
  return (
    verification.verificationOwner.projectId !== record.monitoringOwner.projectId ||
    record.monitoringVerificationLink.mismatchDetected
  );
}

export function resolveVerificationForMonitoringRegistration(
  verificationId: string,
): { exists: boolean; projectId: string | null } {
  const verification = getCloudVerification(verificationId);
  if (!verification) return { exists: false, projectId: null };
  return { exists: true, projectId: verification.verificationOwner.projectId };
}

export function listAvailableVerificationIdsForMonitoringBridge(): string[] {
  return listCloudVerifications().map((v) => v.verificationId);
}
