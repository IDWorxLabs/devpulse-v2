interface WelcomeScreenProps {
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
