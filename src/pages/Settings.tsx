import { Settings as SettingsIcon } from "lucide-react";

function Settings() {
  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">PREFERENCES</p>

          <h1>Settings</h1>

          <p className="page-description">
            Personalize StudyQuest around your study routine.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="empty-state">
          <div className="empty-state-icon large">
            <SettingsIcon size={30} />
          </div>

          <h2>Make StudyQuest yours.</h2>

          <p>
            Your name, goals, focus duration, theme, and other preferences will
            be configured here.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Settings;