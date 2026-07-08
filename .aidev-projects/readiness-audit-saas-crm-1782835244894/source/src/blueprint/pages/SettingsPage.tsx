import LoadingState from '../components/LoadingState';

export default function SettingsPage() {
  return (
    <section className="blueprint-page" data-blueprint="settings">
      <h1>Settings</h1>
      <div className="blueprint-card">
        <h2>General</h2>
        <label>Language <select defaultValue="en"><option value="en">English</option></select></label>
        <label>Region <select defaultValue="us"><option value="us">United States</option></select></label>
        <label>Timezone <select defaultValue="utc"><option value="utc">UTC</option></select></label>
      </div>
      <div className="blueprint-card">
        <h2>Appearance</h2>
        <label><input type="radio" name="theme" defaultChecked /> Light</label>
        <label><input type="radio" name="theme" /> Dark</label>
        <label><input type="radio" name="theme" /> System</label>
      </div>
      <div className="blueprint-card">
        <h2>Notifications</h2>
        <label><input type="checkbox" defaultChecked /> Email</label>
        <label><input type="checkbox" defaultChecked /> Push</label>
        <label><input type="checkbox" /> SMS</label>
      </div>
      <div className="blueprint-card">
        <h2>Privacy</h2>
        <p>Permissions and data controls placeholder.</p>
      </div>
      <div className="blueprint-card">
        <h2>Security</h2>
        <p>Password, 2FA, devices, and active sessions placeholders.</p>
      </div>
      <div className="blueprint-card">
        <h2>Status preview</h2>
        <LoadingState message="Saving preferences…" />
      </div>
    </section>
  );
}
