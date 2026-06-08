/**
 * Brain system awareness — understands registered DevPulse systems. No replacement.
 */

import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import type { BrainSystemRecord } from './brain-types.js';
import { COMMAND_CENTER_BRAIN_OWNER_MODULE } from './brain-types.js';

export const COMMAND_CENTER_AWARE_SYSTEMS: BrainSystemRecord[] = [
  {
    systemId: 'governance_stack',
    displayName: 'Governance Stack',
    phase: '6.x',
    purpose: 'Execution authority, verification, evidence, founder approval gates — foundation complete',
    status: 'FOUNDATION_COMPLETE',
    ownerModule: 'multiple_phase_6',
  },
  {
    systemId: 'world2_foundation',
    displayName: 'World 2 Foundation',
    phase: '7.x',
    purpose: 'Workspace, simulation, builder, completion verifier — planning foundations exist',
    status: 'RUNTIME_NOT_CONNECTED',
    ownerModule: getDevPulseV2Owner('world2_workspace_foundation').ownerModule,
  },
  {
    systemId: 'mobile_command_foundation',
    displayName: 'Mobile Command Foundation',
    phase: '8.x',
    purpose: 'Mobile command, chat, preview, approval — foundation only',
    status: 'RUNTIME_NOT_CONNECTED',
    ownerModule: getDevPulseV2Owner('mobile_command_foundation').ownerModule,
  },
  {
    systemId: 'self_evolution_foundation',
    displayName: 'Self-Evolution Foundation',
    phase: '9.x',
    purpose: 'Capability gaps, learning, drift, complexity, prediction — observer only',
    status: 'FOUNDATION_COMPLETE',
    ownerModule: getDevPulseV2Owner('missing_capability_detector').ownerModule,
  },
  {
    systemId: 'experience_layer_foundation',
    displayName: 'Experience Layer',
    phase: '10.1',
    purpose: 'Founder experience map — descriptive only, no execution',
    status: 'FOUNDATION_COMPLETE',
    ownerModule: getDevPulseV2Owner('experience_layer_foundation').ownerModule,
  },
  {
    systemId: 'trust_engine_expansion',
    displayName: 'Trust Engine Expansion',
    phase: '10.2',
    purpose: 'Trust signal aggregation — does not replace verification or evidence systems',
    status: 'FOUNDATION_COMPLETE',
    ownerModule: getDevPulseV2Owner('trust_engine_expansion').ownerModule,
  },
  {
    systemId: 'founder_reality_surface',
    displayName: 'Founder Reality Surface',
    phase: '10.3',
    purpose: 'Runnable visibility surface for foundation status',
    status: 'SHELL_ONLY',
    ownerModule: getDevPulseV2Owner('founder_reality_surface').ownerModule,
  },
  {
    systemId: 'command_center_runtime_shell',
    displayName: 'Command Center Runtime Shell',
    phase: '10.3.1',
    purpose: 'Three-zone UI shell — hosts Command Center intelligence',
    status: 'SHELL_ONLY',
    ownerModule: getDevPulseV2Owner('command_center_runtime_shell').ownerModule,
  },
  {
    systemId: 'command_center_brain',
    displayName: 'Unified Command Center Brain',
    phase: '11.1',
    purpose: 'Local intelligence orchestration — understands systems, does not execute',
    status: 'FOUNDATION_COMPLETE',
    ownerModule: COMMAND_CENTER_BRAIN_OWNER_MODULE,
  },
];

export function systemsAwarenessKey(systems: BrainSystemRecord[]): string {
  return systems.map((s) => s.systemId).sort().join('|');
}

export function getCommandCenterAwareSystems(): BrainSystemRecord[] {
  return COMMAND_CENTER_AWARE_SYSTEMS.map((s) => ({ ...s }));
}

export function findSystemByKeyword(message: string): BrainSystemRecord[] {
  const lower = message.toLowerCase();
  return COMMAND_CENTER_AWARE_SYSTEMS.filter((s) => {
    const haystack = `${s.displayName} ${s.systemId} ${s.purpose}`.toLowerCase();
    return (
      lower.includes(s.systemId.replace(/_/g, ' ')) ||
      lower.includes(s.displayName.toLowerCase()) ||
      (lower.includes('trust') && s.systemId.includes('trust')) ||
      (lower.includes('world 2') && s.systemId.includes('world2')) ||
      (lower.includes('world2') && s.systemId.includes('world2')) ||
      (lower.includes('governance') && s.systemId.includes('governance')) ||
      (lower.includes('mobile') && s.systemId.includes('mobile')) ||
      (lower.includes('experience') && s.systemId.includes('experience')) ||
      haystack.split(' ').some((word) => word.length > 4 && lower.includes(word))
    );
  });
}

export function assertDistinctFromCentralBrain(): boolean {
  const central = getDevPulseV2Owner('central_brain');
  const commandBrain = getDevPulseV2Owner('command_center_brain');
  return central.ownerModule !== commandBrain.ownerModule;
}

export function assertBrainNotSecondCentralBrain(): boolean {
  const centralModule = getDevPulseV2Owner('central_brain').ownerModule;
  return !COMMAND_CENTER_AWARE_SYSTEMS.some(
    (s) => s.systemId === 'command_center_brain' && s.ownerModule === centralModule,
  );
}

export function getRegistrySystemCount(): number {
  return listDevPulseV2Owners().length;
}

export function summarizeSystemMaturity(): string {
  const complete = COMMAND_CENTER_AWARE_SYSTEMS.filter((s) => s.status === 'FOUNDATION_COMPLETE').length;
  const runtimeMissing = COMMAND_CENTER_AWARE_SYSTEMS.filter((s) => s.status === 'RUNTIME_NOT_CONNECTED').length;
  return `${complete} foundation-complete system(s), ${runtimeMissing} without runtime connection, ${COMMAND_CENTER_AWARE_SYSTEMS.length} total in Command Center awareness map`;
}
