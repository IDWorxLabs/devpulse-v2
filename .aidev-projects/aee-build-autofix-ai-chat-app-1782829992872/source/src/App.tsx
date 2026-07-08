import { AEE_BUILD_AUTOFIX_INJECTED_FAULT } from './__aee_build_autofix_injected_fault__';
import { useEffect, useState } from 'react';
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
