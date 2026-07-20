/**
 * Universal Capability Composition Engine V1 — composition phase and materialization ordering.
 */

import { getNativeProviderById } from './native-capability-provider-registry.js';
import { getPack } from '../universal-capability-pack-framework/capability-pack-registry.js';
import type { CompositionPhase } from './universal-capability-composition-types.js';

const PHASE_ORDER: readonly CompositionPhase[] = [
  'FOUNDATION',
  'PERSISTENCE',
  'ENTITY',
  'RELATIONSHIP',
  'RULE',
  'ACTION',
  'WORKFLOW',
  'RUNTIME',
  'UI',
  'ROUTING',
  'PACK_EXTENSION',
  'VERIFICATION',
  'COVERAGE',
  'REPORTING',
];

export function phaseIndex(phase: CompositionPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

export function buildCompositionPhases(input: {
  selectedNativeProviderIds: readonly string[];
  selectedPackIds: readonly string[];
}): { phase: CompositionPhase; providerIds: string[] }[] {
  const phaseMap = new Map<CompositionPhase, string[]>();

  for (const providerId of input.selectedNativeProviderIds) {
    const native = getNativeProviderById(providerId);
    const phase = native?.compositionPhase ?? 'FOUNDATION';
    const list = phaseMap.get(phase) ?? [];
    list.push(providerId);
    phaseMap.set(phase, list);
  }

  for (const packId of input.selectedPackIds) {
    const list = phaseMap.get('PACK_EXTENSION') ?? [];
    list.push(packId);
    phaseMap.set('PACK_EXTENSION', list);
  }

  phaseMap.set('VERIFICATION', ['native.universal-behavioral-verification-engine.v1']);
  phaseMap.set('COVERAGE', ['native.universal-capability-coverage-intelligence.v1']);
  phaseMap.set('REPORTING', ['native.universal-capability-composition-engine.v1']);

  return PHASE_ORDER.filter((p) => phaseMap.has(p)).map((phase) => ({
    phase,
    providerIds: [...(phaseMap.get(phase) ?? [])].sort(),
  }));
}

export function buildMaterializationOrder(input: {
  installationOrder: readonly string[];
  selectedNativeProviderIds: readonly string[];
  selectedPackIds: readonly string[];
}): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const add = (id: string, phase: CompositionPhase) => {
    const key = `${phaseIndex(phase)}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(id);
  };

  for (const id of input.installationOrder) {
    const native = getNativeProviderById(id);
    if (native) add(id, native.compositionPhase);
    else if (getPack(id)) add(id, 'PACK_EXTENSION');
    else add(id, 'FOUNDATION');
  }

  for (const id of input.selectedNativeProviderIds) {
    const native = getNativeProviderById(id);
    if (native) add(id, native.compositionPhase);
  }
  for (const id of input.selectedPackIds) {
    add(id, 'PACK_EXTENSION');
  }

  add('native.universal-behavioral-verification-engine.v1', 'VERIFICATION');
  add('native.universal-capability-coverage-intelligence.v1', 'COVERAGE');

  return ordered;
}
