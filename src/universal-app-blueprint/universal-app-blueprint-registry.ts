/**
 * AiDevEngine Universal App Blueprint v1.0 — registry and pass token.
 */

export const UNIVERSAL_APP_BLUEPRINT_PASS_TOKEN = 'UNIVERSAL_APP_BLUEPRINT_V1_PASS' as const;
export const UNIVERSAL_APP_BLUEPRINT_OWNER_MODULE = 'universal-app-blueprint' as const;
export const UNIVERSAL_APP_BLUEPRINT_PHASE = 'default-build-foundation' as const;

/** Required artifact paths every generated app must include. */
export const UNIVERSAL_APP_BLUEPRINT_REQUIRED_ARTIFACTS = [
  'src/blueprint/LaunchScreen.tsx',
  'src/blueprint/WelcomeScreen.tsx',
  'src/blueprint/AuthScreen.tsx',
  'src/blueprint/OnboardingScreen.tsx',
  'src/blueprint/AppShell.tsx',
  'src/blueprint/pages/HomePage.tsx',
  'src/blueprint/pages/SearchPage.tsx',
  'src/blueprint/pages/NotificationsPage.tsx',
  'src/blueprint/pages/ProfilePage.tsx',
  'src/blueprint/pages/SettingsPage.tsx',
  'src/blueprint/pages/HelpCenterPage.tsx',
  'src/blueprint/pages/FeedbackPage.tsx',
  'src/blueprint/pages/LegalPage.tsx',
  'src/blueprint/pages/AboutPage.tsx',
  'src/blueprint/components/EmptyState.tsx',
  'src/blueprint/components/ErrorState.tsx',
  'src/blueprint/components/LoadingState.tsx',
  'src/blueprint/components/UniversalAiAssistant.tsx',
  'src/auth/auth-config.ts',
  'src/analytics/analytics-placeholders.ts',
  'src/security/security-placeholders.ts',
  'src/monetization/monetization-placeholders.ts',
  'src/data/data-management-placeholders.ts',
  'blueprint-manifest.json',
] as const;

/** Content markers the inspector uses to prove structural compliance. */
export const UNIVERSAL_APP_BLUEPRINT_CONTENT_MARKERS = [
  { id: 'launch-screen', pattern: /data-blueprint="launch-screen"/i, label: 'Launch screen' },
  { id: 'welcome-screen', pattern: /data-blueprint="welcome-screen"/i, label: 'Welcome screen' },
  { id: 'auth-guest', pattern: /data-blueprint="auth-guest"/i, label: 'Auth guest mode' },
  { id: 'auth-email', pattern: /data-blueprint="auth-email"/i, label: 'Auth email/password' },
  { id: 'auth-social', pattern: /data-blueprint="auth-social"/i, label: 'Auth social placeholders' },
  { id: 'onboarding', pattern: /data-blueprint="onboarding"/i, label: 'Onboarding flow' },
  { id: 'app-shell', pattern: /data-blueprint="app-shell"/i, label: 'Main app shell' },
  { id: 'navigation', pattern: /data-blueprint="navigation"/i, label: 'Navigation' },
  { id: 'home-formula', pattern: /data-blueprint="home-formula"/i, label: 'Home screen formula' },
  { id: 'search', pattern: /data-blueprint="search"/i, label: 'Global search' },
  { id: 'notifications', pattern: /data-blueprint="notifications"/i, label: 'Notifications system' },
  { id: 'profile', pattern: /data-blueprint="profile"/i, label: 'User profile' },
  { id: 'settings', pattern: /data-blueprint="settings"/i, label: 'Settings area' },
  { id: 'help', pattern: /data-blueprint="help-center"/i, label: 'Help center' },
  { id: 'feedback', pattern: /data-blueprint="feedback"/i, label: 'Feedback system' },
  { id: 'empty-state', pattern: /data-blueprint="empty-state"/i, label: 'Empty states' },
  { id: 'error-state', pattern: /data-blueprint="error-state"/i, label: 'Error states' },
  { id: 'loading-state', pattern: /data-blueprint="loading-state"/i, label: 'Loading states' },
  { id: 'legal', pattern: /data-blueprint="legal"/i, label: 'Legal layer' },
  { id: 'analytics', pattern: /data-blueprint="analytics"/i, label: 'Analytics placeholders' },
  { id: 'security', pattern: /data-blueprint="security"/i, label: 'Security placeholders' },
  { id: 'monetization', pattern: /data-blueprint="monetization"/i, label: 'Monetization placeholders' },
  { id: 'universal-ai', pattern: /data-blueprint="universal-ai"/i, label: 'Universal AI assistant' },
] as const;
