/**
 * Mobile Runtime Validation at Scale V1 — workspace evidence extraction.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveRealBuildSuiteEntry } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { WORKSPACE_ID_PREFIX } from '../real-build-execution-pipeline-v1/real-build-execution-pipeline-bounds.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import type { PreviewEvidenceBundle } from '../mobile-preview-modes/mobile-preview-types.js';
import { getDeviceProfile } from '../mobile-preview-modes/device-profile-library.js';
import type { MobileRuntimeProfileId } from './mobile-runtime-validation-v1-types.js';

const RBEP_ARTIFACT_DIR = '.real-build-execution-pipeline-v1-1';

const PROFILE_TO_DEVICE: Record<MobileRuntimeProfileId, string> = {
  ANDROID_PHONE: 'ANDROID_PHONE_MEDIUM',
  ANDROID_TABLET: 'ANDROID_TABLET',
  IPHONE: 'IPHONE_STANDARD',
  IPAD: 'IPAD',
};

export function resolveRbepWorkspacePath(projectRootDir: string, profile: string): string {
  const workspaceId = `${WORKSPACE_ID_PREFIX}-${profile.toLowerCase().replace(/_/g, '-')}`;
  return join(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR, workspaceId);
}

export function getMobileDeviceProfile(runtimeProfile: MobileRuntimeProfileId) {
  return getDeviceProfile(PROFILE_TO_DEVICE[runtimeProfile] as import('../mobile-preview-modes/mobile-preview-types.js').DeviceProfileId);
}

export interface WorkspaceMobileSignals {
  readOnly: true;
  workspacePath: string;
  profile: string;
  productName: string;
  buildSuccess: boolean;
  previewSuccess: boolean;
  htmlContent: string;
  appSource: string;
  indexHtmlSize: number;
  jsBundleBytes: number;
  hasViewportMeta: boolean;
  hasRootMount: boolean;
  hasNavigation: boolean;
  hasButtons: boolean;
  hasLinks: boolean;
  hasOnClick: boolean;
  hasRoleButton: boolean;
  hasInteractiveElements: boolean;
  hasForms: boolean;
  hasScrollContainer: boolean;
  hasTouchFriendlyClasses: boolean;
  workflowTokens: readonly string[];
}

function collectWorkspaceSourceText(workspacePath: string, maxBytes = 500_000): string {
  const srcDir = join(workspacePath, 'src');
  if (!existsSync(srcDir)) return '';

  const chunks: string[] = [];
  let total = 0;

  function walk(dir: string): void {
    if (total >= maxBytes) return;
    for (const name of readdirSync(dir)) {
      if (total >= maxBytes) return;
      const full = join(dir, name);
      if (name === 'node_modules' || name === 'dist') continue;
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(tsx?|jsx?|css|html)$/i.test(name)) continue;
        const text = readFileSync(full, 'utf8');
        chunks.push(text);
        total += text.length;
      } catch {
        /* skip unreadable paths */
      }
    }
  }

  walk(srcDir);
  return chunks.join('\n');
}

function loadRbepBuildProof(projectRootDir: string, profile: string): {
  buildSuccess: boolean;
  previewSuccess: boolean;
} | null {
  const path = join(projectRootDir, RBEP_ARTIFACT_DIR, 'build-proof.json');
  if (!existsSync(path)) return null;
  try {
    const entries = JSON.parse(readFileSync(path, 'utf8')) as Array<{
      profile?: string;
      buildResult?: string;
      previewResult?: string;
      proofComplete?: boolean;
    }>;
    const entry = entries.find((e) => e.profile === profile);
    if (!entry) return null;
    return {
      buildSuccess: entry.buildResult === 'PASS' && entry.proofComplete === true,
      previewSuccess: entry.previewResult === 'PASS' && entry.proofComplete === true,
    };
  } catch {
    return null;
  }
}

export function extractWorkspaceMobileSignals(
  projectRootDir: string,
  profile: string,
): WorkspaceMobileSignals {
  const suite = resolveRealBuildSuiteEntry(profile);
  const workspacePath = resolveRbepWorkspacePath(projectRootDir, profile);
  const distIndex = join(workspacePath, 'dist', 'index.html');
  const srcApp = join(workspacePath, 'src', 'App.tsx');

  const buildSuccess = existsSync(distIndex);
  const htmlContent = buildSuccess ? readFileSync(distIndex, 'utf8') : '';
  const appSource = existsSync(srcApp) ? readFileSync(srcApp, 'utf8') : '';
  const workspaceSource = collectWorkspaceSourceText(workspacePath);

  let jsBundleBytes = 0;
  const assetsDir = join(workspacePath, 'dist', 'assets');
  if (existsSync(assetsDir)) {
    for (const name of readdirSync(assetsDir)) {
      if (name.endsWith('.js')) {
        jsBundleBytes += readFileSync(join(assetsDir, name)).length;
      }
    }
  }

  const combined = appSource + workspaceSource + htmlContent;
  const workflowTokens = detectWorkflowTokens(suite.profile, combined);
  const rbepProof = loadRbepBuildProof(projectRootDir, profile);

  const resolvedBuildSuccess = buildSuccess || rbepProof?.buildSuccess === true;
  const resolvedPreviewSuccess =
    (buildSuccess && htmlContent.length > 100) || rbepProof?.previewSuccess === true;

  const hasNavigation = /nav|sidebar|AppShell|drawer|menu|route|LaunchScreen|WelcomeScreen/i.test(combined);
  const hasButtons = /<button|Button|onClick|btn|onPress|type=["']submit["']/i.test(combined);
  const hasLinks = /<a\s|href=|Link\s|NavLink/i.test(combined);
  const hasOnClick = /onClick|onclick|onPress|cursor-pointer/i.test(combined);
  const hasRoleButton = /role=["']button["']/i.test(combined);
  const hasInteractiveElements = hasButtons || hasLinks || hasOnClick || hasRoleButton;

  return {
    readOnly: true,
    workspacePath,
    profile: suite.profile,
    productName: suite.productName,
    buildSuccess: resolvedBuildSuccess,
    previewSuccess: resolvedPreviewSuccess,
    htmlContent,
    appSource: appSource + workspaceSource,
    indexHtmlSize: htmlContent.length,
    jsBundleBytes,
    hasViewportMeta: /viewport/i.test(htmlContent) || /viewport/i.test(combined),
    hasRootMount: /id=["']root["']|id=["']app["']/i.test(htmlContent),
    hasNavigation,
    hasButtons,
    hasLinks,
    hasOnClick,
    hasRoleButton,
    hasInteractiveElements,
    hasForms: /<form|input|textarea|select|Form|AuthScreen/i.test(combined),
    hasScrollContainer: /overflow|scroll|Scroll|main-content/i.test(combined),
    hasTouchFriendlyClasses: /min-h-|min-w-|p-4|gap-|touch|tap|btn-primary|action-button/i.test(combined),
    workflowTokens,
  };
}

function detectWorkflowTokens(profile: string, source: string): string[] {
  const tokens: string[] = [];
  const lower = source.toLowerCase();
  if (/marketplace|listing|order/i.test(lower) || profile.includes('MARKETPLACE')) {
    tokens.push('MARKETPLACE_BROWSE_DETAIL_ORDER');
  }
  if (/booking|appointment|calendar/i.test(lower) || profile.includes('APPOINTMENT')) {
    tokens.push('BOOKING_AVAILABILITY_CONFIRM');
  }
  if (/course|lesson|learning|progress/i.test(lower) || profile.includes('LEARNING')) {
    tokens.push('LEARNING_COURSE_LESSON_PROGRESS');
  }
  if (/ticket|support|agent/i.test(lower) || profile.includes('CUSTOMER_SUPPORT')) {
    tokens.push('SUPPORT_TICKET_UPDATE_CLOSE');
  }
  if (/task|complete|filter/i.test(lower) || profile.includes('TASK_TRACKER')) {
    tokens.push('TASK_CREATE_COMPLETE_FILTER');
  }
  if (/customer|crm|contact/i.test(lower) || profile.includes('CRM')) {
    tokens.push('CRM_MANAGE_RECORDS');
  }
  if (tokens.length === 0 && /entity|feature|table|list/i.test(lower)) {
    tokens.push('CORE_WORKFLOW_VISIBLE');
  }
  return tokens;
}

export function buildPreviewEvidenceFromWorkspace(
  signals: WorkspaceMobileSignals,
  options?: { sourceWidth?: number; sourceHeight?: number },
): PreviewEvidenceBundle {
  const components: string[] = [];
  if (signals.hasNavigation) components.push('NAVIGATION');
  if (signals.hasButtons || signals.hasInteractiveElements) components.push('BUTTON');
  if (signals.hasForms) components.push('FORM');
  if (signals.hasScrollContainer) components.push('SCROLL_CONTAINER');

  const flows = [...signals.workflowTokens];
  const layoutRegions = signals.hasNavigation ? ['NAVIGATION', 'MAIN'] : ['MAIN'];

  return {
    readOnly: true,
    sourceWidth: options?.sourceWidth ?? 1280,
    sourceHeight: options?.sourceHeight ?? 720,
    sourcePlatform: 'WEB',
    layoutRegions,
    components,
    flows,
    screens: flows.length > 0 ? flows : ['MAIN_SCREEN'],
    platformTargets: ['WEB', 'MOBILE'],
    screenCount: Math.max(1, flows.length),
    workflowCount: flows.length,
    sources: ['MOBILE_RUNTIME_VALIDATION_V1', signals.workspacePath],
  };
}
