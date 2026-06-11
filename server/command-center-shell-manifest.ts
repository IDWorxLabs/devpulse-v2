/**
 * DevPulse V2 Phase 10.3.1 — Command Center Runtime Shell manifest.
 * UI shell only. No intelligence, execution, or persistence.
 */

export const COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE = 'devpulse_v2_command_center_runtime_shell';
export const COMMAND_CENTER_RUNTIME_SHELL_PASS_TOKEN = 'DEVPULSE_V2_COMMAND_CENTER_RUNTIME_SHELL_V1_PASS';

/** Internal shell nav — preserved for architecture compatibility. */
export const SHELL_NAV_ITEMS = [
  'Command Center',
  'Projects',
  'World 2',
  'Project Vault',
  'Notifications',
  'Validators',
  'Founder Reality',
] as const;

/** User-facing AiDevEngine product navigation labels. */
export const PRODUCT_NAV_ITEMS = [
  'Command Center',
  'Projects',
  'Autonomous Builder',
  'Live Preview',
  'Project Memory',
  'Verification',
  'Notifications',
  'Project Insights',
  'System Diagnostics',
] as const;

export const OPERATOR_FEED_SECTIONS = [
  'Planning',
  'Execution',
  'Verification',
  'Approvals',
  'Learning',
] as const;

export const STATUS_BAR_ITEMS = [
  'Phase 11.1 Command Center Brain Connected',
  'Founder Reality Surface Connected',
  'World 2 Runtime Not Connected',
  'Execution Runtime Not Connected',
] as const;

/** User-facing runtime status labels for the product shell. */
export const PRODUCT_STATUS_BAR_ITEMS = [
  'AiDevEngine local runtime connected',
  'Command Center brain connected',
  'Autonomous Builder workspace not connected',
  'Live preview runtime idle',
] as const;

export const STATIC_NOTIFICATIONS = [
  'Unified Command Center Brain Connected',
  'Founder Reality Surface Ready',
  'Phase 10.3 Complete',
  'Phase 10.3.1 Runtime Shell Ready',
] as const;

export const WELCOME_MESSAGES = [
  'DevPulse V2 Command Center Runtime Shell',
  'Phase 11.1 Unified Command Center Brain is connected — local intelligence only.',
  'Ask: "What should we build next?" or "Explain the Trust Engine"',
] as const;

export const DUPLICATE_SHELL_PATTERNS = [
  'command_center_runtime_shell',
  'runtime_shell',
  'command_center_shell',
  'founder_command_surface',
] as const;

export interface CommandCenterShellManifest {
  phase: '10.3.1';
  ownerModule: string;
  layout: 'three-zone';
  navItems: readonly string[];
  productNavItems: readonly string[];
  operatorFeedSections: readonly string[];
  statusBarItems: readonly string[];
  productStatusBarItems: readonly string[];
  staticNotifications: readonly string[];
  welcomeMessages: readonly string[];
  productBrand: 'AiDevEngine';
  confirmation: {
    runtimeShellOnly: true;
    localBrainConnected: true;
    noExecutionPerformed: true;
    noPersistence: true;
    noFileModification: true;
    noCodeGeneration: true;
    brainApiLocalOnly: true;
  };
}

export function buildCommandCenterShellManifest(): CommandCenterShellManifest {
  return {
    phase: '10.3.1',
    ownerModule: COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE,
    layout: 'three-zone',
    navItems: SHELL_NAV_ITEMS,
    productNavItems: PRODUCT_NAV_ITEMS,
    operatorFeedSections: OPERATOR_FEED_SECTIONS,
    statusBarItems: STATUS_BAR_ITEMS,
    productStatusBarItems: PRODUCT_STATUS_BAR_ITEMS,
    productBrand: 'AiDevEngine',
    staticNotifications: STATIC_NOTIFICATIONS,
    welcomeMessages: WELCOME_MESSAGES,
    confirmation: {
      runtimeShellOnly: true,
      localBrainConnected: true,
      noExecutionPerformed: true,
      noPersistence: true,
      noFileModification: true,
      noCodeGeneration: true,
      brainApiLocalOnly: true,
    },
  };
}
