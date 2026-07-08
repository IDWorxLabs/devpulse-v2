import { useState } from 'react';

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
