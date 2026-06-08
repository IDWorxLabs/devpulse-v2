/**
 * Visible UI element registry — every physical UI surface must register here.
 */

import type {
  VisibleUiElementInput,
  VisibleUiElementRecord,
  VisibleUiRegistryState,
  VisibleUiSnapshot,
} from './types.js';
import { GUARD_OWNER_MODULE } from './types.js';

function cloneRecord(record: VisibleUiElementRecord): VisibleUiElementRecord {
  return {
    ...record,
    warnings: [...record.warnings],
    errors: [...record.errors],
  };
}

export class VisibleUiRegistry {
  private readonly elements = new Map<string, VisibleUiElementRecord>();
  private readonly snapshots: VisibleUiSnapshot[] = [];
  private registryWarnings: string[] = [];
  private registryErrors: string[] = [];

  registerVisibleUiElement(input: VisibleUiElementInput): VisibleUiElementRecord {
    const record: VisibleUiElementRecord = {
      elementId: input.elementId.trim(),
      ownerSystemId: input.ownerSystemId.trim(),
      ownerModule: input.ownerModule.trim(),
      type: input.type,
      label: input.label.trim(),
      mountTarget: input.mountTarget.trim(),
      expectedSelector: input.expectedSelector.trim(),
      interactive: input.interactive ?? false,
      requiredForPhase: input.requiredForPhase ?? false,
      createdAt: Date.now(),
      warnings: [],
      errors: [],
    };

    if (!record.elementId) {
      record.errors.push('elementId is required');
      this.registryErrors.push('registerVisibleUiElement rejected empty elementId');
      return cloneRecord(record);
    }

    if (this.elements.has(record.elementId)) {
      record.errors.push(`Duplicate elementId: ${record.elementId}`);
      this.registryErrors.push(`duplicate elementId: ${record.elementId}`);
      return cloneRecord(record);
    }

    if (!record.ownerSystemId) {
      record.errors.push('ownerSystemId is required');
    }
    if (!record.mountTarget) {
      record.errors.push('mountTarget is required');
    }
    if (!record.expectedSelector) {
      record.errors.push('expectedSelector is required');
    }
    if (record.interactive && !record.expectedSelector.includes('button') && !record.interactive) {
      // handled below via WARN at authority level if needed
    }
    if (record.interactive && record.errors.length === 0) {
      // interactive with valid registration — clickability checked at verify time
    } else if (record.interactive && record.errors.length > 0) {
      record.warnings.push('Interactive element registered with validation errors.');
    }

    if (record.interactive && record.errors.length === 0 && !record.requiredForPhase) {
      record.warnings.push(
        'Interactive element should declare clickability proof during browser verification.',
      );
    }

    if (record.errors.length === 0) {
      this.elements.set(record.elementId, record);
    }

    return cloneRecord(record);
  }

  getVisibleUiElement(elementId: string): VisibleUiElementRecord | null {
    const record = this.elements.get(elementId);
    return record ? cloneRecord(record) : null;
  }

  listVisibleUiElements(): VisibleUiElementRecord[] {
    return [...this.elements.values()]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(cloneRecord);
  }

  listVisibleUiElementsByOwner(ownerSystemId: string): VisibleUiElementRecord[] {
    return this.listVisibleUiElements().filter((e) => e.ownerSystemId === ownerSystemId);
  }

  createVisibleUiSnapshot(): VisibleUiSnapshot {
    const elements = this.listVisibleUiElements();
    const snapshot: VisibleUiSnapshot = {
      snapshotId: `ui-snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      capturedAt: Date.now(),
      elementCount: elements.length,
      elements,
    };
    this.snapshots.push(snapshot);
    return {
      ...snapshot,
      elements: snapshot.elements.map(cloneRecord),
    };
  }

  getVisibleUiRegistryState(): VisibleUiRegistryState {
    const elements = this.listVisibleUiElements();
    return {
      ownerModule: GUARD_OWNER_MODULE,
      elementCount: elements.length,
      interactiveCount: elements.filter((e) => e.interactive).length,
      snapshotCount: this.snapshots.length,
      warnings: [...this.registryWarnings],
      errors: [...this.registryErrors],
    };
  }

  clearForTests(): void {
    this.elements.clear();
    this.snapshots.length = 0;
    this.registryWarnings = [];
    this.registryErrors = [];
  }
}

let registrySingleton: VisibleUiRegistry | null = null;

export function getVisibleUiRegistry(): VisibleUiRegistry {
  if (!registrySingleton) {
    registrySingleton = new VisibleUiRegistry();
  }
  return registrySingleton;
}

export function resetVisibleUiRegistryForTests(): VisibleUiRegistry {
  registrySingleton = new VisibleUiRegistry();
  return registrySingleton;
}
