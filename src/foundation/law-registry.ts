/**
 * Machine-readable DevPulse V2 constitutional law registry.
 * Source of truth for enforcement thresholds and phase boundaries.
 */

import type { DevPulseV2SystemId } from './types.js';

export interface DevPulseV2Laws {
  /** Maximum main-thread blocking budget during startup Phase 0–1 (ms). */
  startupBudgetMs: number;
  /** Maximum time until shell is clickable (ms). */
  firstClickableBudgetMs: number;
  /** Maximum modules in eager Phase 0 manifest. */
  maxEagerModules: number;
  /** Shell and chat must be interactive before diagnostics run. */
  chatBeforeDiagnostics: boolean;
  /** Diagnostics must not block chat submit or answers. */
  diagnosticsCannotBlockChat: boolean;
  /** Exactly one module owns final answer authority. */
  singleAnswerAuthority: boolean;
  /** Each domain has one write owner / truth source. */
  singleSourceOfTruth: boolean;
  /** Operator Feed must render inline with conversation. */
  operatorFeedInlineRequired: boolean;
  /** Browser verification outranks internal validators. */
  browserRealitySupreme: boolean;
  /** Connect-module bridge pattern is prohibited. */
  connectModulesForbidden: boolean;
  /** World 2 may not modify architecture law documents. */
  world2CannotModifyLaw: boolean;
  /** Systems allowed during Phase 1 foundation build. */
  phase1AllowedSystems: readonly DevPulseV2SystemId[];
  /** Systems forbidden until Phase 1 stability gate passes. */
  phase1ForbiddenSystems: readonly DevPulseV2SystemId[];
  /** Architecture paths protected from automated modification. */
  protectedLawPaths: readonly string[];
  /** Filename patterns that indicate connect-module inflation. */
  connectModulePatterns: readonly RegExp[];
  /** Patterns indicating hidden execution (validator-only paths). */
  hiddenExecutionPatterns: readonly RegExp[];
}

export const DEV_PULSE_V2_LAWS: DevPulseV2Laws = {
  startupBudgetMs: 800,
  firstClickableBudgetMs: 2000,
  maxEagerModules: 6,
  chatBeforeDiagnostics: true,
  diagnosticsCannotBlockChat: true,
  singleAnswerAuthority: true,
  singleSourceOfTruth: true,
  operatorFeedInlineRequired: true,
  browserRealitySupreme: true,
  connectModulesForbidden: true,
  world2CannotModifyLaw: true,
  phase1AllowedSystems: [
    'foundation_enforcement',
    'task_governor',
    'shell',
    'chat',
    'chat_authority',
    'inline_operator_feed',
    'browser_verification_harness',
    'phase_1_stability_soak',
    'real_browser_runner_attachment',
  ],
  phase1ForbiddenSystems: [
    'trust_engine',
    'project_vault',
    'replay',
    'self_vision',
    'founder_notifications',
    'console_intelligence',
    'reality_replay',
    'mobile_command',
    'world2_builder',
    'autonomous_execution',
    'heavy_diagnostics',
  ],
  protectedLawPaths: [
    'architecture/DEVPULSE_V2_CONSTITUTION.md',
    'architecture/DEVPULSE_V2_SYSTEM_LAWS.md',
    'architecture/DEVPULSE_V2_STARTUP_LAWS.md',
    'architecture/DEVPULSE_V2_PERFORMANCE_LAWS.md',
    'architecture/DEVPULSE_V2_OWNERSHIP_LAWS.md',
    'architecture/DEVPULSE_V2_GROWTH_PROTECTION_LAWS.md',
    'architecture/DEVPULSE_V2_WORLD2_LAWS.md',
    'architecture/DEVPULSE_V2_REBUILD_BLUEPRINT.md',
    'architecture/DEVPULSE_V2_FOUNDER_VISION.md',
    'architecture/DEVPULSE_V2_PRODUCT_NORTH_STAR.md',
    'architecture/DEVPULSE_V2_FINAL_STATE_ROADMAP.md',
  ],
  connectModulePatterns: [
    /connect_v\d+/i,
    /_connect_v\d+\./i,
    /safe_real_main_route_runtime/i,
  ],
  hiddenExecutionPatterns: [
    /validator[-_]only/i,
    /headless[-_]only/i,
    /skipBrowserPath/i,
    /post[-_]interceptor/i,
    /recoverCommandCenter/i,
  ],
};

export function isPhase1AllowedSystem(systemId: string): systemId is DevPulseV2SystemId {
  return (DEV_PULSE_V2_LAWS.phase1AllowedSystems as readonly string[]).includes(systemId);
}

export function isPhase1ForbiddenSystem(systemId: string): systemId is DevPulseV2SystemId {
  return (DEV_PULSE_V2_LAWS.phase1ForbiddenSystems as readonly string[]).includes(systemId);
}

export function isConnectModulePath(path: string): boolean {
  return DEV_PULSE_V2_LAWS.connectModulePatterns.some((pattern) => pattern.test(path));
}

export function isHiddenExecutionPath(path: string): boolean {
  return DEV_PULSE_V2_LAWS.hiddenExecutionPatterns.some((pattern) => pattern.test(path));
}

export function isProtectedLawPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  return DEV_PULSE_V2_LAWS.protectedLawPaths.some(
    (protectedPath) =>
      normalized === protectedPath ||
      normalized.endsWith(`/${protectedPath}`) ||
      normalized.includes(protectedPath),
  );
}
