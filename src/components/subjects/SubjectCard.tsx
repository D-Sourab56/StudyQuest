import {
  BookOpen,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  Link,
} from "react-router";

import {
  getSubjectRoute,
} from "../../data/appConfig";

import type {
  StudySubject,
} from "../../types/subject";

import {
  getSubjectInitial,
} from "../../utils/subject";

interface SubjectCardProps {
  subject:
    StudySubject;

  onEdit: (
    subject:
      StudySubject
  ) => void;

  onDelete: (
    subject:
      StudySubject
  ) => void;
}

function SubjectCard({
  subject,
  onEdit,
  onDelete,
}: SubjectCardProps) {
  return (
    <article className="subject-card">
      {/* SUBJECT INFO */}

      <div className="subject-card-top">
        <div className="subject-icon subject-letter-icon">
          {getSubjectInitial(
            subject.name
          )}
        </div>

        <div className="subject-title-area">
          <h3>
            {subject.name}
          </h3>

          {subject.category && (
            <span className="subject-category">
              {
                subject.category
              }
            </span>
          )}
        </div>
      </div>

      {/* PROGRESS */}

      <div className="subject-progress-area">
        <div className="subject-progress-header">
          <span>
            Progress
          </span>

          <strong>
            {
              subject.progress
            }
            %
          </strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width:
                `${subject.progress}%`,
            }}
          />
        </div>
      </div>

      {/* FOOTER */}

      <div className="subject-card-footer">
        <div className="subject-ready">
          <BookOpen
            size={16}
          />

          <span>
            Ready to study
          </span>
        </div>

        <div className="subject-actions">
          <button
            type="button"
            className="subject-action-button"
            onClick={() =>
              onEdit(
                subject
              )
            }
            aria-label={`Edit ${subject.name}`}
            title="Edit subject"
          >
            <Pencil
              size={16}
            />
          </button>

          <button
            type="button"
            className="subject-action-button danger"
            onClick={() =>
              onDelete(
                subject
              )
            }
            aria-label={`Delete ${subject.name}`}
            title="Delete subject"
          >
            <Trash2
              size={16}
            />
          </button>
        </div>
      </div>

      {/* DETAILS PAGE */}

      <Link
        to={
          getSubjectRoute(
            subject.id
          )
        }
        className="subject-open-button"
      >
        View subject

        <span>
          →
        </span>
      </Link>
    </article>
  );
}

export default SubjectCard;