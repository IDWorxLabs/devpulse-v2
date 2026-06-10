/**
 * API Documentation — reporting.
 */

import type {
  ApiDocumentationEvaluation,
  ApiDocumentationRecord,
  ApiDocumentationReport,
  ApiSurfaceAnalysis,
  CommandSurfaceAnalysis,
  ContractDocumentationAnalysis,
  IntegrationApiAnalysis,
  InterfaceDocumentationAnalysis,
} from './api-documentation-types.js';
import { getApiDocumentationCacheStats } from './api-documentation-cache.js';
import { getApiDocumentationHistorySize } from './api-documentation-history.js';

let reportCount = 0;

export function generateApiDocumentationReport(
  record: ApiDocumentationRecord,
  evaluation: ApiDocumentationEvaluation,
  apiSurface: ApiSurfaceAnalysis,
  interfaces: InterfaceDocumentationAnalysis,
  contracts: ContractDocumentationAnalysis,
  integration: IntegrationApiAnalysis,
  commands: CommandSurfaceAnalysis,
  missingSignals: string[],
): ApiDocumentationReport {
  reportCount += 1;
  const cache = getApiDocumentationCacheStats();
  const recommendations: string[] = [];

  if (apiSurface.undocumentedApis.length > 0) {
    recommendations.push('Document public, service, and orchestration API surfaces');
  }
  if (interfaces.undocumentedInterfaces.length > 0) {
    recommendations.push('Document module, service, and authority interfaces');
  }
  if (contracts.undocumentedContracts.length > 0) {
    recommendations.push('Document input, output, and type contracts for all APIs');
  }
  if (integration.undocumentedIntegrations.length > 0) {
    recommendations.push('Document registry, UVL, and governance integration APIs');
  }
  if (commands.undocumentedCommands.length > 0) {
    recommendations.push('Document validation, orchestration, and reporting commands');
  }
  if (missingSignals.length > 0) {
    recommendations.push('Collect missing API documentation signals before release');
  }
  if (evaluation.state === 'DOCUMENTED' || evaluation.state === 'PARTIALLY_DOCUMENTED') {
    recommendations.push('Continue API documentation monitoring');
  } else {
    recommendations.push('Require API documentation review before external integration');
  }

  return {
    apiCoverageScore: record.apiCoverageScore,
    interfaceCoverageScore: record.interfaceCoverageScore,
    integrationCoverageScore: record.integrationCoverageScore,
    contractCoverageScore: evaluation.contractCoverageScore,
    commandCoverageScore: evaluation.commandCoverageScore,
    coverageLevel: record.coverageLevel,
    state: record.state,
    confidence: record.confidence,
    apiCoverage: [
      'Public APIs expose read-only integration surfaces',
      'Service APIs connect modules without execution',
      ...apiSurface.apiWarnings,
    ],
    interfaceCoverage: [
      'Module interfaces define input and output contracts',
      'Authority interfaces govern safe call boundaries',
      ...interfaces.interfaceWarnings,
    ],
    contractCoverage: [
      'Input contracts define accepted parameters',
      'Output contracts define produced results',
      ...contracts.contractWarnings,
    ],
    integrationCoverage: [
      'Registry integrations wire capability lookups',
      'UVL integrations expose verification rows',
      ...integration.integrationWarnings,
    ],
    commandCoverage: [
      'Validation commands run bounded checks',
      'Orchestration commands coordinate read-only pipelines',
      ...commands.commandWarnings,
    ],
    undocumentedApis: [...apiSurface.undocumentedApis],
    undocumentedInterfaces: [...interfaces.undocumentedInterfaces],
    undocumentedContracts: [...contracts.undocumentedContracts],
    undocumentedIntegrations: [...integration.undocumentedIntegrations],
    undocumentedCommands: [...commands.undocumentedCommands],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getApiDocumentationHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetApiDocumentationReportingForTests(): void {
  reportCount = 0;
}
