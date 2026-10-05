import { BookOpen, Timer } from "lucide-react";

function Study() {
  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">FOCUS</p>

          <h1>Study</h1>

          <p className="page-description">
            Choose what you want to learn and begin a focused study session.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="empty-state">
          <div className="empty-state-icon large">
            <Timer size={30} />
          </div>

          <h2>Ready for your first quest?</h2>

          <p>
            You'll choose a subject here before starting your study timer.
          </p>

          <div className="coming-soon-note">
            <BookOpen size={17} />

            Subject selection and the study timer will be added next.
          </div>
        </div>
      </section>
    </div>
  );
}

export default Study;