import type { ShellRoute } from '../AppShell';

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
