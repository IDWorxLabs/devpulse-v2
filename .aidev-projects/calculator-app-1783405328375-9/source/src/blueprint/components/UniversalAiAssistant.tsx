import { useState } from 'react';

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
