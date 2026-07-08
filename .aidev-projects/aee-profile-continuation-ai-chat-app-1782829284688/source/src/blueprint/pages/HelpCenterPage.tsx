import { useState } from 'react';
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
