/**
 * API Documentation — command surface analyzer.
 */

import type { ApiDocumentationInput, CommandSurfaceAnalysis } from './api-documentation-types.js';
import { getCachedCommandAnalysis, setCachedCommandAnalysis } from './api-documentation-cache.js';

export interface CommandSurfaceSnapshot {
  validationCommandCount: number;
  orchestrationCommandCount: number;
  reportingCommandCount: number;
}

const BASE_COMMANDS = [
  'validation_commands',
  'orchestration_commands',
  'reporting_commands',
  'governance_commands',
  'documentation_commands',
] as const;

let commandAnalysisCount = 0;

export function analyzeCommandSurface(
  input: ApiDocumentationInput,
  snapshot: CommandSurfaceSnapshot,
): CommandSurfaceAnalysis {
  const cacheKey = [
    snapshot.validationCommandCount,
    snapshot.orchestrationCommandCount,
    input.missingValidationCommandGuidance,
    input.missingOrchestrationCommandGuidance,
    ...(input.undocumentedCommands ?? []),
  ].join('|');

  const cached = getCachedCommandAnalysis(cacheKey);
  if (cached) return cached;

  commandAnalysisCount += 1;
  const commandWarnings: string[] = [];
  const undocumentedCommands: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingValidationCommandGuidance, 'missing_validation_command_guidance', 'validation_commands'],
    [input.missingOrchestrationCommandGuidance, 'missing_orchestration_command_guidance', 'orchestration_commands'],
    [input.missingReportingCommandGuidance, 'missing_reporting_command_guidance', 'reporting_commands'],
    [input.missingGovernanceCommandGuidance, 'missing_governance_command_guidance', 'governance_commands'],
    [input.missingDocumentationCommandGuidance, 'missing_documentation_command_guidance', 'documentation_commands'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      commandWarnings.push(warning);
      undocumentedCommands.push(area);
      penalty += 9;
    }
  }

  for (const command of input.undocumentedCommands ?? []) {
    if (!undocumentedCommands.includes(command)) {
      undocumentedCommands.push(command);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.validationCommandCount > 0 ? 12 : 0)
    + (snapshot.orchestrationCommandCount > 0 ? 8 : 0)
    + (snapshot.reportingCommandCount > 0 ? 7 : 0);
  const documented = BASE_COMMANDS.length - undocumentedCommands.filter(
    (c) => BASE_COMMANDS.includes(c as typeof BASE_COMMANDS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_COMMANDS.length) * 80 + systemBonus);
  const commandCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: CommandSurfaceAnalysis = { commandCoverageScore, undocumentedCommands, commandWarnings };
  setCachedCommandAnalysis(cacheKey, result);
  return result;
}

export function getCommandAnalysisCount(): number {
  return commandAnalysisCount;
}

export function resetCommandSurfaceAnalyzerForTests(): void {
  commandAnalysisCount = 0;
}

export function listBaseCommands(): readonly string[] {
  return BASE_COMMANDS;
}
