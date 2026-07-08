export default function ProfilePage() {
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
