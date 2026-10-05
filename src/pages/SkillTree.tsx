import { Waypoints } from "lucide-react";

function SkillTree() {
  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">PROGRESSION</p>

          <h1>Skill Tree</h1>

          <p className="page-description">
            Turn everything you learn into visible skill progression.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="empty-state">
          <div className="empty-state-icon large">
            <Waypoints size={30} />
          </div>

          <h2>Your skill tree will grow here.</h2>

          <p>
            Skills you create and complete will eventually form your personal
            learning path.
          </p>
        </div>
      </section>
    </div>
  );
}

export default SkillTree;