import {
  BookOpen,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  storageService,
} from "../../services/storageService";

interface SubjectSummariesProps {
  subjectId: string;
}

function SubjectSummaries({
  subjectId,
}: SubjectSummariesProps) {
  const [
    summaries,
    setSummaries,
  ] = useState(
    () =>
      storageService.getSummaries()
  );

  const subjectSummaries =
    summaries
      .filter(
        (summary) =>
          summary.subjectId ===
          subjectId
      )
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );

  // =========================================
  // DELETE SUMMARY
  // =========================================

  function handleDelete(
    summaryId: string
  ) {
    const confirmed =
      window.confirm(
        "Delete this study summary?"
      );

    if (!confirmed) {
      return;
    }

    storageService.deleteSummary(
      summaryId
    );

    setSummaries(
      (current) =>
        current.filter(
          (summary) =>
            summary.id !==
            summaryId
        )
    );
  }

  // =========================================
  // FORMAT DATE
  // =========================================

  function formatDate(
    dateString: string
  ) {
    return new Intl.DateTimeFormat(
      "en",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(
      new Date(dateString)
    );
  }

  return (
    <section className="panel subject-summaries-panel">
      <div className="subject-section-heading">
        <div>
          <p className="panel-label">
            WHAT YOU'VE LEARNED
          </p>

          <h2>
            Study summaries
          </h2>
        </div>

        {subjectSummaries.length >
          0 && (
          <span className="subject-summary-count">
            {
              subjectSummaries.length
            }{" "}
            {subjectSummaries.length ===
            1
              ? "summary"
              : "summaries"}
          </span>
        )}
      </div>

      {subjectSummaries.length ===
      0 ? (
        <div className="subject-summary-empty">
          <div className="subject-summary-empty-icon">
            <BookOpen
              size={22}
            />
          </div>

          <div>
            <strong>
              No summaries yet
            </strong>

            <p>
              Finish a study
              session and write
              down what you
              learned.
            </p>
          </div>
        </div>
      ) : (
        <div className="subject-summary-list">
          {subjectSummaries.map(
            (summary) => (
              <article
                key={
                  summary.id
                }
                className="subject-summary-card"
              >
                <div className="subject-summary-card-top">
                  <div>
                    <h3>
                      {
                        summary.topic
                      }
                    </h3>

                    <span>
                      {formatDate(
                        summary.createdAt
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="icon-button subject-summary-delete"
                    onClick={() =>
                      handleDelete(
                        summary.id
                      )
                    }
                    aria-label={`Delete ${summary.topic}`}
                  >
                    <Trash2
                      size={17}
                    />
                  </button>
                </div>

                <p className="subject-summary-content">
                  {
                    summary.content
                  }
                </p>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}

export default SubjectSummaries;