import { Award } from "lucide-react";

function Achievements() {
  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">MILESTONES</p>

          <h1>Achievements</h1>

          <p className="page-description">
            Build consistency and unlock milestones as you progress.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="empty-state">
          <div className="empty-state-icon large">
            <Award size={30} />
          </div>

          <h2>Your achievements are waiting.</h2>

          <p>
            Completing study milestones will unlock achievements here.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Achievements;