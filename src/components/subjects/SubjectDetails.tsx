import {
  CalendarDays,
  Pencil,
  X,
} from "lucide-react";

import type {
  StudySubject,
} from "../../types/subject";

interface SubjectDetailsProps {
  subject: StudySubject;

  onClose: () => void;

  onEdit: (
    subject: StudySubject
  ) => void;
}

function SubjectDetails({
  subject,
  onClose,
  onEdit,
}: SubjectDetailsProps) {
  const createdDate =
    new Date(
      subject.createdAt
    ).toLocaleDateString();

  return (
    <section className="panel subject-details-panel">
      {/* ============================== */}
      {/* HEADER */}
      {/* ============================== */}

      <div className="subject-details-header">
        <div className="subject-details-main">
          <div className="subject-details-icon">
            {subject.icon}
          </div>

          <div>
            <p className="panel-label">
              SUBJECT DETAILS
            </p>

            <h2>
              {subject.name}
            </h2>

            {subject.category && (
              <p className="subject-details-category">
                {subject.category}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close subject details"
        >
          <X size={20} />
        </button>
      </div>

      {/* ============================== */}
      {/* DETAILS */}
      {/* ============================== */}

      <div className="subject-details-grid">
        <div className="subject-detail-item">
          <span className="subject-detail-label">
            Progress
          </span>

          <strong>
            {subject.progress}%
          </strong>
        </div>

        <div className="subject-detail-item">
          <span className="subject-detail-label">
            Study time
          </span>

          <strong>
            0 min
          </strong>
        </div>

        <div className="subject-detail-item">
          <span className="subject-detail-label">
            XP earned
          </span>

          <strong>
            0 XP
          </strong>
        </div>
      </div>

      <div className="subject-details-progress">
        <div className="subject-progress-header">
          <span>
            Learning progress
          </span>

          <strong>
            {subject.progress}%
          </strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${subject.progress}%`,
            }}
          />
        </div>
      </div>

      <div className="subject-created-date">
        <CalendarDays size={16} />

        <span>
          Created {createdDate}
        </span>
      </div>

      {/* ============================== */}
      {/* ACTIONS */}
      {/* ============================== */}

      <div className="subject-details-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            onEdit(subject)
          }
        >
          <Pencil size={16} />

          Edit subject
        </button>
      </div>
    </section>
  );
}

export default SubjectDetails;