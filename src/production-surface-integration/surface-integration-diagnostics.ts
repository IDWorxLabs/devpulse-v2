export const SURFACE_INTEGRATION_DIAGNOSTIC_CODES = [
  'previous_project_identity_contamination',
  'previous_workspace_title_contamination',
  'template_navigation_injection',
  'legacy_navigation_source',
  'duplicate_status_projection',
  'duplicate_product_faithfulness_provider',
  'preview_readiness_while_blocked',
  'engineering_report_stale_build_context',
  'surface_missing_canonical_source',
  'legacy_surface_provider_active',
] as const;

export type SurfaceIntegrationDiagnosticCode = (typeof SURFACE_INTEGRATION_DIAGNOSTIC_CODES)[number];
