import { History as HistoryIcon } from "lucide-react";

function History() {
  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">LEARNING LOG</p>

          <h1>History</h1>

          <p className="page-description">
            Look back at what you studied and what you learned.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="empty-state">
          <div className="empty-state-icon large">
            <HistoryIcon size={30} />
          </div>

          <h2>No study sessions yet.</h2>

          <p>
            Finished study sessions and learning summaries will appear here.
          </p>
        </div>
      </section>
    </div>
  );
}

export default History;