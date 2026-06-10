/**
 * API Documentation — interface documentation analyzer.
 */

import type {
  ApiDocumentationInput,
  InterfaceDocumentationAnalysis,
} from './api-documentation-types.js';
import { getCachedInterfaceAnalysis, setCachedInterfaceAnalysis } from './api-documentation-cache.js';

export interface InterfaceDocumentationSnapshot {
  publicInterfaceCount: number;
  moduleInterfaceCount: number;
  authorityInterfaceCount: number;
}

const BASE_INTERFACES = [
  'public_interfaces',
  'module_interfaces',
  'service_interfaces',
  'authority_interfaces',
  'validation_interfaces',
] as const;

let interfaceAnalysisCount = 0;

export function analyzeInterfaceDocumentation(
  input: ApiDocumentationInput,
  snapshot: InterfaceDocumentationSnapshot,
): InterfaceDocumentationAnalysis {
  const cacheKey = [
    snapshot.publicInterfaceCount,
    snapshot.moduleInterfaceCount,
    input.missingPublicInterfaceGuidance,
    input.missingAuthorityInterfaceGuidance,
    ...(input.undocumentedInterfaces ?? []),
  ].join('|');

  const cached = getCachedInterfaceAnalysis(cacheKey);
  if (cached) return cached;

  interfaceAnalysisCount += 1;
  const interfaceWarnings: string[] = [];
  const undocumentedInterfaces: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingPublicInterfaceGuidance, 'missing_public_interface_guidance', 'public_interfaces'],
    [input.missingModuleInterfaceGuidance, 'missing_module_interface_guidance', 'module_interfaces'],
    [input.missingServiceInterfaceGuidance, 'missing_service_interface_guidance', 'service_interfaces'],
    [input.missingAuthorityInterfaceGuidance, 'missing_authority_interface_guidance', 'authority_interfaces'],
    [input.missingValidationInterfaceGuidance, 'missing_validation_interface_guidance', 'validation_interfaces'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      interfaceWarnings.push(warning);
      undocumentedInterfaces.push(area);
      penalty += 9;
    }
  }

  for (const iface of input.undocumentedInterfaces ?? []) {
    if (!undocumentedInterfaces.includes(iface)) {
      undocumentedInterfaces.push(iface);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.publicInterfaceCount > 0 ? 10 : 0)
    + (snapshot.moduleInterfaceCount > 0 ? 8 : 0)
    + (snapshot.authorityInterfaceCount > 0 ? 8 : 0);
  const documented = BASE_INTERFACES.length - undocumentedInterfaces.filter(
    (i) => BASE_INTERFACES.includes(i as typeof BASE_INTERFACES[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_INTERFACES.length) * 80 + systemBonus);
  const interfaceCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: InterfaceDocumentationAnalysis = {
    interfaceCoverageScore,
    undocumentedInterfaces,
    interfaceWarnings,
  };
  setCachedInterfaceAnalysis(cacheKey, result);
  return result;
}

export function getInterfaceAnalysisCount(): number {
  return interfaceAnalysisCount;
}

export function resetInterfaceDocumentationAnalyzerForTests(): void {
  interfaceAnalysisCount = 0;
}

export function listBaseInterfaces(): readonly string[] {
  return BASE_INTERFACES;
}
