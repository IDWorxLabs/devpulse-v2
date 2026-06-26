/**
 * AiDevEngine Universal App Blueprint v1.0 — generated workspace files.
 */

import { buildPromptAppMetadataTs } from '../universal-prompt-to-app-materialization/prompt-app-metadata.js';
import { UNIVERSAL_APP_BLUEPRINT_VERSION } from './universal-app-blueprint-types.js';
import type {
  UniversalBlueprintBuildInput,
  UniversalBlueprintWorkspaceFile,
} from './universal-app-blueprint-types.js';

export function buildUniversalBlueprintPackageJsonMarkers(): Record<string, string> {
  return {
    devpulseUniversalBlueprint: 'v1',
    aidevengineUniversalBlueprint: UNIVERSAL_APP_BLUEPRINT_VERSION,
  };
}

export function mergePackageJsonWithBlueprint(packageJsonSource: string): string {
  const parsed = JSON.parse(packageJsonSource) as Record<string, unknown>;
  return JSON.stringify({ ...parsed, ...buildUniversalBlueprintPackageJsonMarkers() }, null, 2) + '\n';
}

function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function buildUniversalBlueprintAppTsx(): string {
  return `import { useEffect, useState } from 'react';
import './App.css';
import { APP_NAME, APP_TAGLINE } from './blueprint/app-metadata';
import LaunchScreen from './blueprint/LaunchScreen';
import WelcomeScreen from './blueprint/WelcomeScreen';
import AuthScreen from './blueprint/AuthScreen';
import OnboardingScreen from './blueprint/OnboardingScreen';
import AppShell from './blueprint/AppShell';

export type AppPhase = 'launch' | 'welcome' | 'auth' | 'onboarding' | 'main';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('launch');

  useEffect(() => {
    if (phase !== 'launch') return;
    const timer = window.setTimeout(() => setPhase('welcome'), 2200);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'launch') {
    return <LaunchScreen appName={APP_NAME} tagline={APP_TAGLINE} />;
  }
  if (phase === 'welcome') {
    return <WelcomeScreen appName={APP_NAME} onContinue={() => setPhase('auth')} />;
  }
  if (phase === 'auth') {
    return (
      <AuthScreen
        onGuest={() => setPhase('onboarding')}
        onAuthenticated={() => setPhase('onboarding')}
      />
    );
  }
  if (phase === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() => setPhase('main')}
        onSkip={() => setPhase('main')}
      />
    );
  }

  return <AppShell appName={APP_NAME} />;
}
`;
}

function buildLaunchScreen(): string {
  return `interface LaunchScreenProps {
  appName: string;
  tagline: string;
}

export default function LaunchScreen({ appName, tagline }: LaunchScreenProps) {
  return (
    <div className="blueprint-screen blueprint-launch" data-blueprint="launch-screen">
      <div className="blueprint-logo" aria-hidden="true">{appName.slice(0, 1)}</div>
      <h1>{appName}</h1>
      <p className="blueprint-tagline">{tagline}</p>
      <div className="blueprint-loading" role="status" aria-label="Loading">
        <span className="blueprint-loading-bar" />
      </div>
    </div>
  );
}
`;
}

function buildWelcomeScreen(): string {
  return `interface WelcomeScreenProps {
  appName: string;
  onContinue: () => void;
}

export default function WelcomeScreen({ appName, onContinue }: WelcomeScreenProps) {
  return (
    <div className="blueprint-screen blueprint-welcome" data-blueprint="welcome-screen">
      <h1>Welcome to {appName}</h1>
      <p>A modular application shell with navigation, settings, and feature routing.</p>
      <button type="button" className="blueprint-btn blueprint-btn-primary" onClick={onContinue}>
        Get started
      </button>
    </div>
  );
}
`;
}

function buildAuthScreen(): string {
  return `interface AuthScreenProps {
  onGuest: () => void;
  onAuthenticated: () => void;
}

export default function AuthScreen({ onGuest, onAuthenticated }: AuthScreenProps) {
  return (
    <div className="blueprint-screen blueprint-auth" data-blueprint="auth-layer">
      <h1>Sign in</h1>
      <p>Choose how you want to continue.</p>
      <button type="button" className="blueprint-btn" data-blueprint="auth-guest" onClick={onGuest}>
        Continue as guest
      </button>
      <form
        className="blueprint-auth-form"
        data-blueprint="auth-email"
        onSubmit={(event) => {
          event.preventDefault();
          onAuthenticated();
        }}
      >
        <input type="email" placeholder="Email" aria-label="Email" required />
        <input type="password" placeholder="Password" aria-label="Password" required />
        <button type="submit" className="blueprint-btn blueprint-btn-primary">Sign up / Sign in</button>
      </form>
      <div className="blueprint-social" data-blueprint="auth-social">
        <button type="button" className="blueprint-btn" disabled>Continue with Google</button>
        <button type="button" className="blueprint-btn" disabled>Continue with Apple</button>
        <button type="button" className="blueprint-btn" disabled>Continue with Microsoft</button>
      </div>
    </div>
  );
}
`;
}

function buildOnboardingScreen(): string {
  return `import { useState } from 'react';

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

const SCREENS = [
  { title: 'Explore your workspace', body: 'Navigate modules, review activity, and access settings from one shell.' },
  { title: 'Built for clarity', body: 'Responsive layout, accessible navigation, and a consistent interface.' },
  { title: 'Ready to begin', body: 'Open the feature area and explore generated modules.' },
];

export default function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const screen = SCREENS[step];

  function handleNext() {
    if (step >= SCREENS.length - 1) onComplete();
    else setStep((current) => current + 1);
  }

  return (
    <div className="blueprint-screen blueprint-onboarding" data-blueprint="onboarding">
      <p className="blueprint-step-label">Step {step + 1} of {SCREENS.length}</p>
      <h1>{screen.title}</h1>
      <p>{screen.body}</p>
      <div className="blueprint-actions">
        <button type="button" className="blueprint-btn" onClick={onSkip}>Skip</button>
        <button type="button" className="blueprint-btn blueprint-btn-primary" onClick={handleNext}>
          {step >= SCREENS.length - 1 ? 'Get started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
`;
}

function buildAppShell(
  coreFeatureLabel: string,
  coreFeatureImportPath = '../features/FeatureAppRouter',
  coreFeatureComponentName = 'FeatureAppRouter',
): string {
  return `import { useState } from 'react';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import FeedbackPage from './pages/FeedbackPage';
import LegalPage from './pages/LegalPage';
import AboutPage from './pages/AboutPage';
import UniversalAiAssistant from './components/UniversalAiAssistant';
import ${coreFeatureComponentName} from '${coreFeatureImportPath}';

export type ShellRoute =
  | 'home'
  | 'core'
  | 'activity'
  | 'search'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'help'
  | 'feedback'
  | 'legal'
  | 'about';

interface AppShellProps {
  appName: string;
}

const MOBILE_TABS: { id: ShellRoute; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'core', label: '${coreFeatureLabel}' },
  { id: 'activity', label: 'Activity' },
  { id: 'notifications', label: 'Alerts' },
  { id: 'profile', label: 'Profile' },
];

export default function AppShell({ appName }: AppShellProps) {
  const [route, setRoute] = useState<ShellRoute>('home');

  function renderRoute() {
    switch (route) {
      case 'home': return <HomePage appName={appName} onNavigate={setRoute} />;
      case 'core': return <${coreFeatureComponentName} />;
      case 'activity': return <HomePage appName={appName} onNavigate={setRoute} insightsOnly />;
      case 'search': return <SearchPage />;
      case 'notifications': return <NotificationsPage />;
      case 'profile': return <ProfilePage />;
      case 'settings': return <SettingsPage />;
      case 'help': return <HelpCenterPage />;
      case 'feedback': return <FeedbackPage />;
      case 'legal': return <LegalPage />;
      case 'about': return <AboutPage appName={appName} />;
      default: return <HomePage appName={appName} onNavigate={setRoute} />;
    }
  }

  return (
    <div className="blueprint-shell" data-blueprint="app-shell" data-blueprint-router="universal-v1">
      <header className="blueprint-topbar" data-blueprint="navigation">
        <div className="blueprint-brand">
          <span className="blueprint-logo-sm" aria-hidden="true">{appName.slice(0, 1)}</span>
          <span>{appName}</span>
        </div>
        <div className="blueprint-topbar-actions">
          <button type="button" className="blueprint-btn" onClick={() => setRoute('search')}>Search</button>
          <button type="button" className="blueprint-btn" onClick={() => setRoute('notifications')}>Notifications</button>
          <button type="button" className="blueprint-btn" onClick={() => setRoute('profile')}>Profile</button>
        </div>
      </header>
      <div className="blueprint-body">
        <nav className="blueprint-sidenav" aria-label="Main navigation">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={\`blueprint-nav-item \${route === tab.id ? 'is-active' : ''}\`}
              onClick={() => setRoute(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <button type="button" className="blueprint-nav-item" onClick={() => setRoute('settings')}>Settings</button>
          <button type="button" className="blueprint-nav-item" onClick={() => setRoute('help')}>Help</button>
          <button type="button" className="blueprint-nav-item" onClick={() => setRoute('feedback')}>Feedback</button>
          <button type="button" className="blueprint-nav-item" onClick={() => setRoute('legal')}>Legal</button>
        </nav>
        <main className="blueprint-main">{renderRoute()}</main>
      </div>
      <nav className="blueprint-bottomnav" aria-label="Mobile navigation">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={\`blueprint-bottomnav-item \${route === tab.id ? 'is-active' : ''}\`}
            onClick={() => setRoute(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <UniversalAiAssistant appName={appName} />
    </div>
  );
}
`;
}

function buildHomePage(): string {
  return `import type { ShellRoute } from '../AppShell';

interface HomePageProps {
  appName: string;
  onNavigate: (route: ShellRoute) => void;
  insightsOnly?: boolean;
}

export default function HomePage({ appName, onNavigate, insightsOnly = false }: HomePageProps) {
  if (insightsOnly) {
    return (
      <section className="blueprint-page" data-blueprint="home-formula">
        <h1>Activity &amp; insights</h1>
        <div className="blueprint-card">
          <h2>Recommendations</h2>
          <p>Review recent activity and open the next recommended module.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="blueprint-page" data-blueprint="home-formula">
      <h1>Welcome back</h1>
      <p className="blueprint-subtitle">Your {appName} dashboard is ready.</p>
      <div className="blueprint-grid">
        <div className="blueprint-card">
          <h2>Quick actions</h2>
          <button type="button" className="blueprint-btn blueprint-btn-primary" onClick={() => onNavigate('core')}>
            Open features
          </button>
          <button type="button" className="blueprint-btn" onClick={() => onNavigate('search')}>Search</button>
        </div>
        <div className="blueprint-card">
          <h2>Recent activity</h2>
          <ul className="blueprint-list">
            <li>Reviewed module navigation</li>
            <li>Updated profile preferences</li>
          </ul>
        </div>
        <div className="blueprint-card">
          <h2>Insights</h2>
          <p>Start with the feature area to explore generated modules.</p>
        </div>
      </div>
    </section>
  );
}
`;
}

function buildSearchPage(): string {
  return `import EmptyState from '../components/EmptyState';

const FILTERS = ['Content', 'Modules', 'People', 'Messages', 'App data'];

export default function SearchPage() {
  return (
    <section className="blueprint-page" data-blueprint="search">
      <h1>Search</h1>
      <input className="blueprint-input" type="search" placeholder="Search everything…" aria-label="Global search" />
      <div className="blueprint-chip-row">
        {FILTERS.map((filter) => (
          <span key={filter} className="blueprint-chip">{filter}</span>
        ))}
      </div>
      <EmptyState title="No results yet" message="Try a query to find content, modules, people, or messages." actionLabel="Clear filters" />
    </section>
  );
}
`;
}

function buildNotificationsPage(): string {
  return `import { useState } from 'react';
import EmptyState from '../components/EmptyState';

interface Notice {
  id: string;
  kind: 'alert' | 'update' | 'message' | 'system';
  text: string;
  read: boolean;
  archived: boolean;
}

const SEED: Notice[] = [
  { id: 'n1', kind: 'alert', text: 'Scheduled maintenance reminder', read: false, archived: false },
  { id: 'n2', kind: 'update', text: 'New feature tips available', read: false, archived: false },
  { id: 'n3', kind: 'message', text: 'Team mention in workspace', read: true, archived: false },
  { id: 'n4', kind: 'system', text: 'Backup completed', read: true, archived: false },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<Notice[]>(SEED);

  const visible = items.filter((item) => !item.archived);

  return (
    <section className="blueprint-page" data-blueprint="notifications">
      <h1>Notifications</h1>
      {visible.length === 0 ? (
        <EmptyState title="Inbox clear" message="Alerts, updates, messages, and system events appear here." actionLabel="Refresh" />
      ) : (
        <ul className="blueprint-list">
          {visible.map((item) => (
            <li key={item.id} className="blueprint-list-row">
              <span className="blueprint-badge">{item.kind}</span>
              <span>{item.text}</span>
              <div className="blueprint-inline-actions">
                <button type="button" className="blueprint-btn" onClick={() => setItems((current) => current.map((n) => n.id === item.id ? { ...n, read: true } : n))}>Mark read</button>
                <button type="button" className="blueprint-btn" onClick={() => setItems((current) => current.map((n) => n.id === item.id ? { ...n, archived: true } : n))}>Archive</button>
                <button type="button" className="blueprint-btn" onClick={() => setItems((current) => current.filter((n) => n.id !== item.id))}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
`;
}

function buildProfilePage(): string {
  return `export default function ProfilePage() {
  return (
    <section className="blueprint-page" data-blueprint="profile">
      <h1>Profile</h1>
      <div className="blueprint-profile-header">
        <div className="blueprint-avatar" aria-hidden="true">U</div>
        <div>
          <p><strong>Name:</strong> Guest User</p>
          <p><strong>Email:</strong> guest@example.com</p>
        </div>
      </div>
      <div className="blueprint-card">
        <h2>Account</h2>
        <p>Password &amp; security settings</p>
        <p>Login methods: Guest, Email placeholder</p>
        <p>Subscription plan: Free (placeholder)</p>
      </div>
      <div className="blueprint-card">
        <h2>Preferences</h2>
        <label><input type="checkbox" defaultChecked /> Email digests</label>
      </div>
    </section>
  );
}
`;
}

function buildSettingsPage(): string {
  return `import LoadingState from '../components/LoadingState';

export default function SettingsPage() {
  return (
    <section className="blueprint-page" data-blueprint="settings">
      <h1>Settings</h1>
      <div className="blueprint-card">
        <h2>General</h2>
        <label>Language <select defaultValue="en"><option value="en">English</option></select></label>
        <label>Region <select defaultValue="us"><option value="us">United States</option></select></label>
        <label>Timezone <select defaultValue="utc"><option value="utc">UTC</option></select></label>
      </div>
      <div className="blueprint-card">
        <h2>Appearance</h2>
        <label><input type="radio" name="theme" defaultChecked /> Light</label>
        <label><input type="radio" name="theme" /> Dark</label>
        <label><input type="radio" name="theme" /> System</label>
      </div>
      <div className="blueprint-card">
        <h2>Notifications</h2>
        <label><input type="checkbox" defaultChecked /> Email</label>
        <label><input type="checkbox" defaultChecked /> Push</label>
        <label><input type="checkbox" /> SMS</label>
      </div>
      <div className="blueprint-card">
        <h2>Privacy</h2>
        <p>Permissions and data controls placeholder.</p>
      </div>
      <div className="blueprint-card">
        <h2>Security</h2>
        <p>Password, 2FA, devices, and active sessions placeholders.</p>
      </div>
      <div className="blueprint-card">
        <h2>Status preview</h2>
        <LoadingState message="Saving preferences…" />
      </div>
    </section>
  );
}
`;
}

function buildHelpCenterPage(): string {
  return `import { useState } from 'react';
import ErrorState from '../components/ErrorState';

export default function HelpCenterPage() {
  const [showErrorDemo, setShowErrorDemo] = useState(false);

  return (
    <section className="blueprint-page" data-blueprint="help-center">
      <h1>Help Center</h1>
      <div className="blueprint-card"><h2>FAQs</h2><p>How do I open modules? Use the Features tab in the application shell.</p></div>
      <div className="blueprint-card"><h2>Tutorials</h2><p>Getting started guide placeholder.</p></div>
      <button type="button" className="blueprint-btn">Contact support</button>
      <button type="button" className="blueprint-btn" onClick={() => setShowErrorDemo(true)}>Report a bug</button>
      <button type="button" className="blueprint-btn">Request a feature</button>
      {showErrorDemo && (
        <ErrorState
          message="Unable to submit bug report right now."
          onRetry={() => setShowErrorDemo(false)}
          fallbackLabel="Dismiss"
          onFallback={() => setShowErrorDemo(false)}
        />
      )}
    </section>
  );
}
`;
}

function buildFeedbackPage(): string {
  return `export default function FeedbackPage() {
  return (
    <section className="blueprint-page" data-blueprint="feedback">
      <h1>Feedback</h1>
      <textarea className="blueprint-input" rows={4} placeholder="Share your feedback…" />
      <div className="blueprint-actions">
        <button type="button" className="blueprint-btn blueprint-btn-primary">Send feedback</button>
        <button type="button" className="blueprint-btn">Suggest feature</button>
        <button type="button" className="blueprint-btn">Report problem</button>
      </div>
    </section>
  );
}
`;
}

function buildLegalPage(): string {
  return `export default function LegalPage() {
  return (
    <section className="blueprint-page" data-blueprint="legal">
      <h1>Legal</h1>
      <article className="blueprint-card"><h2>Privacy Policy</h2><p>Placeholder privacy policy content.</p></article>
      <article className="blueprint-card"><h2>Terms of Service</h2><p>Placeholder terms content.</p></article>
      <article className="blueprint-card"><h2>Cookie Policy</h2><p>Placeholder cookie policy content.</p></article>
      <article className="blueprint-card"><h2>Licenses</h2><p>Open-source licenses placeholder.</p></article>
    </section>
  );
}
`;
}

function buildAboutPage(): string {
  return `interface AboutPageProps {
  appName: string;
}

export default function AboutPage({ appName }: AboutPageProps) {
  return (
    <section className="blueprint-page" data-blueprint="about">
      <h1>About {appName}</h1>
      <p>Generated with AiDevEngine Universal App Blueprint v1.0.</p>
    </section>
  );
}
`;
}

function buildEmptyState(): string {
  return `interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel: string;
  onAction?: () => void;
}

export default function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="blueprint-empty" data-blueprint="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
      <button type="button" className="blueprint-btn blueprint-btn-primary" onClick={onAction}>{actionLabel}</button>
    </div>
  );
}
`;
}

function buildErrorState(): string {
  return `interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  fallbackLabel?: string;
  onFallback?: () => void;
}

export default function ErrorState({ message, onRetry, fallbackLabel = 'Go home', onFallback }: ErrorStateProps) {
  return (
    <div className="blueprint-error" data-blueprint="error-state" role="alert">
      <h2>Something went wrong</h2>
      <p>{message}</p>
      <div className="blueprint-actions">
        <button type="button" className="blueprint-btn blueprint-btn-primary" onClick={onRetry}>Retry</button>
        <button type="button" className="blueprint-btn" onClick={onFallback}>{fallbackLabel}</button>
      </div>
    </div>
  );
}
`;
}

function buildLoadingState(): string {
  return `interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="blueprint-loading-state" data-blueprint="loading-state" role="status">
      <div className="blueprint-skeleton blueprint-skeleton-lg" />
      <div className="blueprint-skeleton" />
      <div className="blueprint-skeleton" />
      <progress max={100} value={60} />
      <p>{message}</p>
    </div>
  );
}
`;
}

function buildUniversalAiAssistant(): string {
  return `import { useState } from 'react';

interface UniversalAiAssistantProps {
  appName: string;
}

export default function UniversalAiAssistant({ appName }: UniversalAiAssistantProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="blueprint-ai-fab"
        data-blueprint="universal-ai"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        AI
      </button>
      {open && (
        <aside className="blueprint-ai-panel" aria-label="Universal AI assistant">
          <h2>{appName} Assistant</h2>
          <p>Ask questions, get guided help, and explore application features.</p>
          <input className="blueprint-input" placeholder="How can I help?" aria-label="Ask the assistant" />
        </aside>
      )}
    </>
  );
}
`;
}

function buildAuthConfig(): string {
  return `export const AUTH_MODES = ['guest', 'email', 'google', 'apple', 'microsoft'] as const;
export type AuthMode = (typeof AUTH_MODES)[number];
export const DEFAULT_AUTH_MODE: AuthMode = 'guest';
`;
}

function buildAnalyticsPlaceholders(): string {
  return `/** Analytics placeholders — disabled by default. Marker: data-blueprint="analytics" */
export const BLUEPRINT_ANALYTICS_MARKER = 'data-blueprint="analytics"';
export const ANALYTICS_EVENTS = {
  signup: 'analytics.signup',
  session: 'analytics.session',
  retention: 'analytics.retention',
  usage: 'analytics.usage',
  featureUsage: 'analytics.feature_usage',
} as const;

export function trackAnalyticsEvent(_event: string, _payload?: Record<string, unknown>): void {
  /* placeholder — data-blueprint="analytics" */
}
`;
}

function buildSecurityPlaceholders(): string {
  return `/** Security layer placeholders. Marker: data-blueprint="security" */
export const BLUEPRINT_SECURITY_MARKER = 'data-blueprint="security"';
export const SECURITY_FEATURES = {
  sessionManagement: true,
  passwordReset: true,
  emailVerification: true,
  rateLimiting: true,
  auditLogging: true,
} as const;

export function logSecurityAudit(_action: string): void {
  /* placeholder */
}
`;
}

function buildMonetizationPlaceholders(): string {
  return `/** Monetization readiness — disabled by default. Marker: data-blueprint="monetization" */
export const BLUEPRINT_MONETIZATION_MARKER = 'data-blueprint="monetization"';
export const PLANS = ['free', 'pro', 'enterprise'] as const;
export type PlanId = (typeof PLANS)[number];

export const MONETIZATION_ENABLED = false;

export interface SubscriptionPlaceholder {
  plan: PlanId;
  billingHistory: unknown[];
}

export const DEFAULT_SUBSCRIPTION: SubscriptionPlaceholder = {
  plan: 'free',
  billingHistory: [],
};
`;
}

function buildDataManagementPlaceholders(): string {
  return `/** Data management placeholders. */
export const EXPORT_FORMATS = ['csv', 'pdf', 'json'] as const;

export function exportUserData(_format: (typeof EXPORT_FORMATS)[number]): void {
  /* placeholder */
}

export function deleteAccountPlaceholder(): void {
  /* placeholder */
}

export function backupRecoveryPlaceholder(): void {
  /* placeholder */
}
`;
}

function buildBlueprintManifest(input: UniversalBlueprintBuildInput): string {
  return (
    JSON.stringify(
      {
        universalBlueprintVersion: UNIVERSAL_APP_BLUEPRINT_VERSION,
        universalBlueprintEnabled: true,
        contractId: input.contractId,
        ideaId: input.ideaId,
        appName: input.appName,
        generatedAt: new Date().toISOString(),
        defaultSections: [
          'launch',
          'welcome',
          'auth',
          'onboarding',
          'shell',
          'home',
          'search',
          'notifications',
          'profile',
          'settings',
          'help',
          'feedback',
          'legal',
          'analytics',
          'security',
          'monetization',
          'universal-ai',
        ],
      },
      null,
      2,
    ) + '\n'
  );
}

function buildAppCss(): string {
  return `:root {
  color-scheme: light dark;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  --bp-bg: #f8fafc;
  --bp-surface: #ffffff;
  --bp-text: #0f172a;
  --bp-muted: #64748b;
  --bp-accent: #4f46e5;
  --bp-border: #e2e8f0;
}

* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; background: var(--bp-bg); color: var(--bp-text); }
#root { min-height: 100vh; }

.blueprint-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.blueprint-logo, .blueprint-logo-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1, #06b6d4);
  color: white;
  font-weight: 700;
}
.blueprint-logo { width: 72px; height: 72px; font-size: 2rem; }
.blueprint-logo-sm { width: 32px; height: 32px; }

.blueprint-loading { width: min(240px, 80vw); height: 6px; background: var(--bp-border); border-radius: 999px; overflow: hidden; }
.blueprint-loading-bar { display: block; width: 40%; height: 100%; background: var(--bp-accent); animation: blueprint-load 1.2s ease-in-out infinite; }
@keyframes blueprint-load { 0% { transform: translateX(-100%);} 100% { transform: translateX(260%);} }

.blueprint-btn {
  border: 1px solid var(--bp-border);
  background: var(--bp-surface);
  color: var(--bp-text);
  border-radius: 999px;
  padding: 0.55rem 1rem;
  cursor: pointer;
}
.blueprint-btn-primary { background: var(--bp-accent); color: white; border-color: transparent; }
.blueprint-input, .blueprint-auth-form input, select, textarea {
  width: 100%;
  max-width: 420px;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--bp-border);
}

.blueprint-shell { min-height: 100vh; display: flex; flex-direction: column; }
.blueprint-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--bp-border);
  background: var(--bp-surface);
}
.blueprint-brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
.blueprint-topbar-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.blueprint-body { display: flex; flex: 1; min-height: 0; }
.blueprint-sidenav {
  width: 220px;
  padding: 1rem;
  border-right: 1px solid var(--bp-border);
  background: var(--bp-surface);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.blueprint-nav-item, .blueprint-bottomnav-item {
  text-align: left;
  border: none;
  background: transparent;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
}
.blueprint-nav-item.is-active, .blueprint-bottomnav-item.is-active { background: #eef2ff; color: #312e81; }
.blueprint-main { flex: 1; padding: 1.25rem; overflow: auto; }
.blueprint-bottomnav {
  display: none;
  border-top: 1px solid var(--bp-border);
  background: var(--bp-surface);
  justify-content: space-around;
  padding: 0.35rem;
}
@media (max-width: 860px) {
  .blueprint-sidenav { display: none; }
  .blueprint-bottomnav { display: flex; }
}

.blueprint-page h1 { margin-top: 0; }
.blueprint-subtitle { color: var(--bp-muted); }
.blueprint-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.blueprint-card {
  background: var(--bp-surface);
  border: 1px solid var(--bp-border);
  border-radius: 16px;
  padding: 1rem;
}
.blueprint-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.65rem; }
.blueprint-list-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; justify-content: space-between; }
.blueprint-badge { font-size: 0.75rem; text-transform: uppercase; background: #eef2ff; padding: 0.15rem 0.5rem; border-radius: 999px; }
.blueprint-chip-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0; }
.blueprint-chip { background: #e2e8f0; padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.85rem; }
.blueprint-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
.blueprint-inline-actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }

.blueprint-empty, .blueprint-error, .blueprint-loading-state {
  border: 1px dashed var(--bp-border);
  border-radius: 16px;
  padding: 1.25rem;
  background: var(--bp-surface);
}
.blueprint-skeleton { height: 12px; border-radius: 8px; background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0); margin-bottom: 0.5rem; }
.blueprint-skeleton-lg { height: 28px; width: 60%; }

.blueprint-ai-fab {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--bp-accent);
  color: white;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.35);
  z-index: 20;
}
.blueprint-ai-panel {
  position: fixed;
  right: 1rem;
  bottom: 4.5rem;
  width: min(320px, calc(100vw - 2rem));
  background: var(--bp-surface);
  border: 1px solid var(--bp-border);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.15);
  z-index: 20;
}

.blueprint-profile-header { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
.blueprint-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #c7d2fe;
  font-weight: 700;
}
`;
}

export function buildUniversalBlueprintWorkspaceFiles(
  input: UniversalBlueprintBuildInput,
): UniversalBlueprintWorkspaceFile[] {
  const appName = input.appName;
  const tagline = input.tagline;
  const coreFeatureLabel = input.coreFeatureLabel ?? 'Features';
  const coreFeatureImportPath = input.coreFeatureImportPath ?? '../features/FeatureAppRouter';
  const coreFeatureComponentName = input.coreFeatureComponentName ?? 'FeatureAppRouter';

  return [
    {
      relativePath: 'src/blueprint/app-metadata.ts',
      content: buildPromptAppMetadataTs(appName, tagline),
    },
    { relativePath: 'src/App.tsx', content: buildUniversalBlueprintAppTsx() },
    { relativePath: 'src/App.css', content: buildAppCss() },
    { relativePath: 'src/blueprint/LaunchScreen.tsx', content: buildLaunchScreen() },
    { relativePath: 'src/blueprint/WelcomeScreen.tsx', content: buildWelcomeScreen() },
    { relativePath: 'src/blueprint/AuthScreen.tsx', content: buildAuthScreen() },
    { relativePath: 'src/blueprint/OnboardingScreen.tsx', content: buildOnboardingScreen() },
    {
      relativePath: 'src/blueprint/AppShell.tsx',
      content: buildAppShell(coreFeatureLabel, coreFeatureImportPath, coreFeatureComponentName),
    },
    { relativePath: 'src/blueprint/pages/HomePage.tsx', content: buildHomePage() },
    { relativePath: 'src/blueprint/pages/SearchPage.tsx', content: buildSearchPage() },
    { relativePath: 'src/blueprint/pages/NotificationsPage.tsx', content: buildNotificationsPage() },
    { relativePath: 'src/blueprint/pages/ProfilePage.tsx', content: buildProfilePage() },
    { relativePath: 'src/blueprint/pages/SettingsPage.tsx', content: buildSettingsPage() },
    { relativePath: 'src/blueprint/pages/HelpCenterPage.tsx', content: buildHelpCenterPage() },
    { relativePath: 'src/blueprint/pages/FeedbackPage.tsx', content: buildFeedbackPage() },
    { relativePath: 'src/blueprint/pages/LegalPage.tsx', content: buildLegalPage() },
    { relativePath: 'src/blueprint/pages/AboutPage.tsx', content: buildAboutPage() },
    { relativePath: 'src/blueprint/components/EmptyState.tsx', content: buildEmptyState() },
    { relativePath: 'src/blueprint/components/ErrorState.tsx', content: buildErrorState() },
    { relativePath: 'src/blueprint/components/LoadingState.tsx', content: buildLoadingState() },
    { relativePath: 'src/blueprint/components/UniversalAiAssistant.tsx', content: buildUniversalAiAssistant() },
    { relativePath: 'src/auth/auth-config.ts', content: buildAuthConfig() },
    {
      relativePath: 'src/analytics/analytics-placeholders.ts',
      content: buildAnalyticsPlaceholders(),
    },
    { relativePath: 'src/security/security-placeholders.ts', content: buildSecurityPlaceholders() },
    {
      relativePath: 'src/monetization/monetization-placeholders.ts',
      content: buildMonetizationPlaceholders(),
    },
    {
      relativePath: 'src/data/data-management-placeholders.ts',
      content: buildDataManagementPlaceholders(),
    },
    { relativePath: 'blueprint-manifest.json', content: buildBlueprintManifest(input) },
  ];
}
