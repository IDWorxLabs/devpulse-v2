import { useState } from 'react';
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
import FeatureAppRouter from '../features/FeatureAppRouter';

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
  { id: 'core', label: 'Features' },
  { id: 'activity', label: 'Activity' },
  { id: 'notifications', label: 'Alerts' },
  { id: 'profile', label: 'Profile' },
];

export default function AppShell({ appName }: AppShellProps) {
  const [route, setRoute] = useState<ShellRoute>('home');

  function renderRoute() {
    switch (route) {
      case 'home': return <HomePage appName={appName} onNavigate={setRoute} />;
      case 'core': return <FeatureAppRouter />;
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
              className={`blueprint-nav-item ${route === tab.id ? 'is-active' : ''}`}
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
            className={`blueprint-bottomnav-item ${route === tab.id ? 'is-active' : ''}`}
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
