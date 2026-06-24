/**
 * General-Purpose Code Generation V1 — type definitions.
 */

export type GenerationStrategy =
  | 'CRUD_APP'
  | 'WORKFLOW_APP'
  | 'MARKETPLACE_APP'
  | 'DASHBOARD_APP'
  | 'PORTAL_APP'
  | 'BOOKING_APP'
  | 'CONTENT_APP'
  | 'COMMUNITY_APP'
  | 'AI_ASSISTED_APP'
  | 'CUSTOM_APP';

export interface GenerationStrategyDefinition {
  readOnly: true;
  strategy: GenerationStrategy;
  label: string;
  requiredEntities: readonly string[];
  expectedWorkflows: readonly string[];
  userRoles: readonly string[];
  screenExpectations: readonly string[];
  dataModelComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  validationNeeds: readonly string[];
}

export interface GeneralPurposeEntity {
  readOnly: true;
  id: string;
  label: string;
  pluralLabel: string;
  primary: boolean;
}

export interface GeneralPurposeWorkflow {
  readOnly: true;
  id: string;
  label: string;
  steps: readonly string[];
  critical: boolean;
}

export interface GeneralPurposeRole {
  readOnly: true;
  id: string;
  label: string;
  permissions: readonly string[];
}

export interface GeneralPurposeScreen {
  readOnly: true;
  id: string;
  label: string;
  screenType: string;
  critical: boolean;
}

export interface GeneralPurposeDomainLogic {
  readOnly: true;
  id: string;
  label: string;
  indicatorType: string;
  description: string;
}

export interface GeneralPurposeAppModel {
  readOnly: true;
  appType: string;
  domain: string;
  strategy: GenerationStrategy;
  profile: string;
  productName: string;
  prompt: string;
  entities: readonly GeneralPurposeEntity[];
  roles: readonly GeneralPurposeRole[];
  permissions: readonly string[];
  workflows: readonly GeneralPurposeWorkflow[];
  screens: readonly GeneralPurposeScreen[];
  actions: readonly string[];
  dataModels: readonly string[];
  automations: readonly string[];
  integrations: readonly string[];
  aiFeatures: readonly string[];
}

export interface WorkflowContract {
  readOnly: true;
  profile: string;
  domain: string;
  workflows: readonly GeneralPurposeWorkflow[];
  primaryWorkflowComplete: boolean;
  stateTransitions: readonly string[];
}

export interface RoleContract {
  readOnly: true;
  profile: string;
  domain: string;
  roles: readonly GeneralPurposeRole[];
  roleNavigationPresent: boolean;
  permissionPlaceholdersPresent: boolean;
}

export interface DomainLogicReportEntry {
  readOnly: true;
  profile: string;
  domain: string;
  logicIndicators: readonly GeneralPurposeDomainLogic[];
  visibleInGeneratedApp: boolean;
}

export interface GeneralPurposeDomainResult {
  readOnly: true;
  profile: string;
  domain: string;
  productName: string;
  strategy: GenerationStrategy;
  appModel: GeneralPurposeAppModel;
  workflowContract: WorkflowContract;
  roleContract: RoleContract;
  generated: boolean;
  buildSuccess: boolean;
  previewSuccess: boolean;
  workflowValidationPassed: boolean;
  roleCoveragePassed: boolean;
  domainLogicPassed: boolean;
  paiReviewPassed: boolean;
  aflaReviewPassed: boolean;
  productionReadinessPassed: boolean;
  productionReadinessScore: number | null;
  overallPassed: boolean;
  generatedFiles: readonly string[];
  workspacePath: string | null;
}

export interface GeneralPurposeCodeGenerationV1Assessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: string;
  passToken: string;
  version: 'V1';
  generatedAt: string;
  domainsEvaluated: number;
  domainsGenerated: number;
  domainsBuildProven: number;
  domainsPreviewProven: number;
  domainsWorkflowProven: number;
  domainsProductionReady: number;
  generalPurposeMaturityScore: number;
  supportsComplexWorkflows: boolean;
  supportsMultiRoleSystems: boolean;
  supportsAdvancedBusinessLogic: boolean;
  supportsDomainSpecificApps: boolean;
  proofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  domainResults: readonly GeneralPurposeDomainResult[];
}
