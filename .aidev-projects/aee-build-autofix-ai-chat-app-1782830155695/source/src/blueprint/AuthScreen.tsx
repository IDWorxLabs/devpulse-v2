interface AuthScreenProps {
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
