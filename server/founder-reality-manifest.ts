/**
 * DevPulse V2 Phase 10.3 — Founder Reality Surface manifest.
 * Static visibility data only. No execution, no runtime mutation.
 */

import type { CommandCenterShellManifest } from './command-center-shell-manifest.js';
import { buildCommandCenterShellManifest } from './command-center-shell-manifest.js';

export const FOUNDER_REALITY_SURFACE_OWNER_MODULE = 'devpulse_v2_founder_reality_surface';
export const FOUNDER_REALITY_SURFACE_PASS_TOKEN = 'DEVPULSE_V2_FOUNDER_REALITY_SURFACE_FOUNDATION_V1_PASS';
export const FOUNDER_REALITY_PORT = 4321;
export const FOUNDER_REALITY_HOST = '0.0.0.0';
export const FOUNDER_REALITY_URL = `http://localhost:${FOUNDER_REALITY_PORT}`;

export interface CompletedStack {
  phase: string;
  name: string;
  status: 'COMPLETE';
  note: string;
}

export interface RealityWarning {
  id: string;
  message: string;
}

export interface FounderChecklistItem {
  question: string;
  answer: 'YES' | 'NOT YET';
}

export interface ExistsVsNotYet {
  exists: string[];
  notYet: string[];
}

export interface FounderRealityManifest {
  title: string;
  subtitle: string;
  phase: string;
  ownerModule: string;
  runtimeShell: CommandCenterShellManifest;
  currentStatus: string;
  completedStacks: CompletedStack[];
  realityWarnings: RealityWarning[];
  founderChecklist: FounderChecklistItem[];
  existsVsNotYet: ExistsVsNotYet;
  experienceLayerPlaceholder: string;
  trustEnginePlaceholder: string;
  nextRecommendedStep: string;
  validators: string[];
  confirmation: {
    visibilityOnly: true;
    noExecutionPerformed: true;
    noValidatorAutoRun: true;
    noFileModification: true;
    noCodeGeneration: true;
    noDeployment: true;
    noAutonomousBuildingClaim: true;
  };
}

export const COMPLETED_STACKS: CompletedStack[] = [
  { phase: 'Phase 6', name: 'Governance Stack', status: 'COMPLETE', note: 'Execution authority, verification, evidence, founder approval gates' },
  { phase: 'Phase 7', name: 'World 2 Foundation Stack', status: 'COMPLETE', note: 'Workspace, simulation, builder, completion verifier — foundation only' },
  { phase: 'Phase 8', name: 'Mobile Command Foundation Stack', status: 'COMPLETE', note: 'Mobile command, chat, preview, approval — foundation only' },
  { phase: 'Phase 9', name: 'Self-Evolution Foundation Stack', status: 'COMPLETE', note: 'Capability gaps, learning, drift, complexity, prediction — observer only' },
  { phase: 'Phase 10.1', name: 'Experience Layer Foundation', status: 'COMPLETE', note: 'Founder experience map — descriptive, no execution' },
  { phase: 'Phase 10.2', name: 'Trust Engine Expansion Foundation', status: 'COMPLETE', note: 'Trust aggregation — does not replace source systems' },
  { phase: 'Phase 10.3', name: 'Founder Reality Surface Foundation', status: 'COMPLETE', note: 'First runnable visibility surface' },
  { phase: 'Phase 10.3.1', name: 'Command Center Runtime Shell Foundation', status: 'COMPLETE', note: 'Command Center UI shell — hosts intelligence' },
  { phase: 'Phase 11.1', name: 'Unified Command Center Brain Foundation', status: 'COMPLETE', note: 'Local intelligence — understands systems, does not execute' },
];

export const REALITY_WARNINGS: RealityWarning[] = [
  { id: 'warn-arch', message: 'Foundation architecture exists.' },
  { id: 'warn-product', message: 'Runnable product experience is just beginning.' },
  { id: 'warn-autonomous', message: 'No real autonomous building yet.' },
  { id: 'warn-cloud', message: 'No real cloud runtime yet.' },
  { id: 'warn-mobile', message: 'No real mobile app yet.' },
  { id: 'warn-preview', message: 'No real live preview runtime yet.' },
  { id: 'warn-execution', message: 'No real execution runtime yet.' },
];

export const FOUNDER_CHECKLIST: FounderChecklistItem[] = [
  { question: 'Can I open DevPulse V2?', answer: 'YES' },
  { question: 'Can I see what has been built?', answer: 'YES' },
  { question: 'Can I see completed stacks?', answer: 'YES' },
  { question: 'Can I see validators?', answer: 'YES' },
  { question: 'Can I type a real project idea and have DevPulse build it?', answer: 'NOT YET' },
  { question: 'Can DevPulse execute builds?', answer: 'NOT YET' },
  { question: 'Can DevPulse run in the cloud?', answer: 'NOT YET' },
  { question: 'Can mobile control real builds?', answer: 'NOT YET' },
  { question: 'Can Self-Evolution modify DevPulse?', answer: 'NOT YET' },
];

export const EXISTS_VS_NOT_YET: ExistsVsNotYet = {
  exists: [
    'Governance foundations (Phase 6)',
    'World 2 foundations (Phase 7)',
    'Mobile command foundations (Phase 8)',
    'Self-evolution foundations (Phase 9)',
    'Experience layer mapping (Phase 10.1)',
    'Trust engine aggregation (Phase 10.2)',
    'Founder reality surface (Phase 10.3)',
    'Command Center runtime shell (Phase 10.3.1)',
    '70+ validation scripts',
    'Ownership registry and type system',
  ],
  notYet: [
    'Full product dashboard',
    'Autonomous building runtime',
    'Cloud deployment runtime',
    'Real mobile app',
    'Live preview runtime',
    'Execution runtime for founders',
    'Product hardening (Phase 10.4+)',
  ],
};

export function buildFounderRealityManifest(validators: string[]): FounderRealityManifest {
  return {
    title: 'DevPulse V2',
    subtitle: 'Command Center Runtime Shell',
    phase: '11.1',
    ownerModule: FOUNDER_REALITY_SURFACE_OWNER_MODULE,
    runtimeShell: buildCommandCenterShellManifest(),
    currentStatus:
      'DevPulse V2 Command Center Brain is connected. Foundations are built and validated — the Brain provides local intelligence only, not execution or autonomous building.',
    completedStacks: COMPLETED_STACKS,
    realityWarnings: REALITY_WARNINGS,
    founderChecklist: FOUNDER_CHECKLIST,
    existsVsNotYet: EXISTS_VS_NOT_YET,
    experienceLayerPlaceholder:
      'Experience Layer (10.1) maps founder journey surfaces — FOUNDER_HOME through PROJECT_COMPLETION. Descriptive only.',
    trustEnginePlaceholder:
      'Trust Engine Expansion (10.2) aggregates trust signals — unified score, no replacement of verification or evidence systems.',
    nextRecommendedStep:
      'Phase 11.2 — Cross-System Awareness (deepen Brain context across registered systems). Execution runtime and autonomous building remain future phases.',
    validators,
    confirmation: {
      visibilityOnly: true,
      noExecutionPerformed: true,
      noValidatorAutoRun: true,
      noFileModification: true,
      noCodeGeneration: true,
      noDeployment: true,
      noAutonomousBuildingClaim: true,
    },
  };
}

export const DUPLICATE_SURFACE_PATTERNS = [
  'founder_reality_surface',
  'founder_surface',
  'reality_surface',
  'devpulse_app_shell',
  'runnable_shell',
  'founder_home_surface',
  'foundation_visibility_surface',
] as const;
