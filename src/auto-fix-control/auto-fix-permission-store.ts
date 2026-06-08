/**
 * Auto-fix permission store — evidence-backed fix permission records.
 */

import type { AutoFixPermissionRecord, PermissionState } from './types.js';

function cloneRecord(record: AutoFixPermissionRecord): AutoFixPermissionRecord {
  return {
    ...record,
    evidenceLinks: record.evidenceLinks.map((l) => ({ ...l })),
    stateSequence: [...record.stateSequence],
  };
}

export class AutoFixPermissionStore {
  private readonly permissions = new Map<string, AutoFixPermissionRecord>();

  setPermission(record: AutoFixPermissionRecord): AutoFixPermissionRecord {
    const stored = cloneRecord(record);
    this.permissions.set(stored.fixId, stored);
    return cloneRecord(stored);
  }

  allowFix(fixId: string): AutoFixPermissionRecord | null {
    const record = this.permissions.get(fixId);
    if (!record) {
      return null;
    }
    record.permissionState = 'ALLOWED';
    record.updatedAt = Date.now();
    record.stateSequence = [
      ...record.stateSequence.filter(
        (s) => s !== 'FIX_REJECTED' && s !== 'FIX_BLOCKED' && s !== 'FIX_PENDING',
      ),
      'FIX_ALLOWED',
      'FIX_RECORD_CREATED',
    ];
    return cloneRecord(record);
  }

  blockFix(fixId: string): AutoFixPermissionRecord | null {
    const record = this.permissions.get(fixId);
    if (!record) {
      return null;
    }
    record.permissionState = 'BLOCKED';
    record.updatedAt = Date.now();
    if (!record.stateSequence.includes('FIX_BLOCKED')) {
      record.stateSequence.push('FIX_BLOCKED', 'FIX_RECORD_CREATED');
    }
    return cloneRecord(record);
  }

  rejectFix(fixId: string): AutoFixPermissionRecord | null {
    const record = this.permissions.get(fixId);
    if (!record) {
      return null;
    }
    record.permissionState = 'REJECTED';
    record.updatedAt = Date.now();
    if (!record.stateSequence.includes('FIX_REJECTED')) {
      record.stateSequence.push('FIX_REJECTED', 'FIX_RECORD_CREATED');
    }
    return cloneRecord(record);
  }

  getFixPermission(fixId: string): AutoFixPermissionRecord | null {
    const record = this.permissions.get(fixId);
    return record ? cloneRecord(record) : null;
  }

  getAllFixPermissions(): AutoFixPermissionRecord[] {
    return [...this.permissions.values()].map(cloneRecord);
  }

  clear(): void {
    this.permissions.clear();
  }
}

export function permissionStateIsAllowed(state: PermissionState): boolean {
  return state === 'ALLOWED';
}
