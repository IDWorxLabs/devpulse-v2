/**
 * DevPulse V2 Phase 12.2 — Dependency Intelligence types.
 * Intelligence only — relationship awareness between systems, capabilities, modules, phases.
 */

import type { RiskLevel } from '../foundation/types.js';

export const DEPENDENCY_INTELLIGENCE_PASS_TOKEN =
  'DEVPULSE_V2_DEPENDENCY_INTELLIGENCE_FOUNDATION_V1_PASS';
export const DEPENDENCY_INTELLIGENCE_OWNER_MODULE = 'devpulse_v2_dependency_intelligence';

export type DependencyEntityKind = 'system' | 'capability' | 'module' | 'phase' | 'question';

export type DependencyType =
  | 'DEPENDS_ON'
  | 'REQUIRED_FOR'
  | 'FEEDS'
  | 'INFORMS'
  | 'BLOCKS'
  | 'SUPERSEDES';

export type DependencyConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DependencyEdgeBase {
  dependencyId: string;
  entityKind: DependencyEntityKind;
  source: string;
  target: string;
  dependencyType: DependencyType;
  confidence: DependencyConfidence;
  riskLevel: RiskLevel;
  required: boolean;
  blocked: boolean;
  reason: string;
  readOnly: true;
}

export type SystemDependency = DependencyEdgeBase & { entityKind: 'system' };
export type CapabilityDependency = DependencyEdgeBase & { entityKind: 'capability' };
export type ModuleDependency = DependencyEdgeBase & { entityKind: 'module' };
export type PhaseDependency = DependencyEdgeBase & { entityKind: 'phase' };
export type QuestionDependency = DependencyEdgeBase & { entityKind: 'question' };

export type DependencyEdge =
  | SystemDependency
  | CapabilityDependency
  | ModuleDependency
  | PhaseDependency
  | QuestionDependency;

export interface DependencyGraph {
  edges: DependencyEdge[];
  systems: string[];
  dependencyCount: number;
  blockedCount: number;
  isolatedSystems: string[];
  duplicateRisks: string[];
  graphHealth: 'healthy' | 'warning' | 'degraded';
  builtAt: number;
}

export interface DependencyPathResult {
  source: string;
  target: string;
  found: boolean;
  path: string[];
  edges: DependencyEdge[];
  confidence: DependencyConfidence;
}

export interface DependencyAnalysis {
  query: string;
  targetSystem: string | null;
  upstream: DependencyEdge[];
  downstream: DependencyEdge[];
  blockedDependencies: DependencyEdge[];
  missingDependencies: string[];
  highestRisk: DependencyEdge | null;
  isolatedSystems: string[];
  duplicateRisks: string[];
  paths: DependencyPathResult[];
}

export interface DependencyIntelligenceDiagnostics {
  dependencyIntelligenceActive: boolean;
  dependencyCount: number;
  blockedDependencyCount: number;
  highestRiskDependency: string | null;
  lastDependencyQuery: string | null;
  duplicateDependencyRisk: 'clear' | 'warning';
  dependencyGraphHealth: 'healthy' | 'warning' | 'degraded';
}

export interface DependencyAnswer {
  query: string;
  analysis: DependencyAnalysis;
  responseText: string;
}

export const DEPENDENCY_QUESTION_SIGNALS = [
  'dependency',
  'depends on',
  'depend on',
  'required for',
  'blocked by',
  'upstream',
  'downstream',
  'dependency path',
  'what breaks if',
  'breaks if',
  'missing dependency',
  'missing dependencies',
  'what depends on',
  'what does',
  'depend on',
  'isolated',
  'highest-risk dependency',
  'highest risk dependency',
  'duplicate dependency',
  'built before',
  'build before',
  'capabilities are blocked',
  'capability blocked',
] as const;

export const FORBIDDEN_DEPENDENCY_INTELLIGENCE_DUPLICATES = [
  'dependency_brain',
  'dependency_understanding_v2',
  'brain_v2',
  'project_brain',
  'memory_brain',
  'dependency_graph_engine',
  'capability_dependency_engine',
  'second_dependency_intelligence',
] as const;

export function isDependencyIntelligenceQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return DEPENDENCY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateDependencyBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('create a new dependency brain') ||
    lower.includes('dependency brain') ||
    lower.includes('second dependency intelligence') ||
    lower.includes('dependency understanding v2') ||
    lower.includes('replace dependency intelligence')
  );
}

export const DEPENDENCY_DISPLAY_NAMES: Record<string, string> = {
  project_vault: 'Project Vault',
  project_vault_intelligence: 'Project Vault Intelligence',
  project_understanding_engine: 'Project Understanding Engine',
  shared_memory_layer: 'Shared Memory Layer',
  timeline_intelligence: 'Timeline Intelligence',
  unified_decision_layer: 'Unified Decision Layer',
  general_question_understanding: 'General Question Understanding',
  command_center_brain: 'Command Center Brain',
  cross_system_awareness: 'Cross-System Awareness',
  dependency_intelligence: 'Dependency Intelligence',
  execution_runtime: 'Execution Runtime',
  execution_verification: 'Execution Verification',
  world2_execution: 'World 2 Execution',
  governance_stack: 'Governance Stack',
};

export function displayNameFor(systemId: string): string {
  return DEPENDENCY_DISPLAY_NAMES[systemId] ?? systemId.replace(/_/g, ' ');
}
