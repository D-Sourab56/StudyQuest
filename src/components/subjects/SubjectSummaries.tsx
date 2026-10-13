
import {
  BookOpen,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { useState } from "react";

import {
  storageService,
} from "../../services/storageService";

import type {
  StudySummary,
} from "../../types/summary";

interface SubjectSummariesProps {
  subjectId: string;
}

function SubjectSummaries({
  subjectId,
}: SubjectSummariesProps) {
  // =========================================
  // SUMMARIES
  // =========================================

  const [summaries, setSummaries] =
    useState<StudySummary[]>(
      () => storageService.getSummaries()
    );

  // =========================================
  // EDIT STATE
  // =========================================

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editTopic, setEditTopic] =
    useState("");

  const [editContent, setEditContent] =
    useState("");

  const [editError, setEditError] =
    useState("");

  // =========================================
  // FILTER + SORT
  // =========================================

  const subjectSummaries = summaries
    .filter(
      (summary) =>
        summary.subjectId === subjectId
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  // =========================================
  // START EDITING
  // =========================================

  function handleEdit(summary: StudySummary) {
    setEditingId(summary.id);

    setEditTopic(summary.topic);
    setEditContent(summary.content);

    setEditError("");
  }

  // =========================================
  // CANCEL EDITING
  // =========================================

  function handleCancelEdit() {
    setEditingId(null);

    setEditTopic("");
    setEditContent("");

    setEditError("");
  }

  // =========================================
  // SAVE CHANGES
  // =========================================

  function handleSaveEdit(summaryId: string) {
    const topic = editTopic.trim();
    const content = editContent.trim();

    if (!topic) {
      setEditError("Please enter a topic.");
      return;
    }

    if (!content) {
      setEditError(
        "Please enter your study summary."
      );
      return;
    }

    const updated =
      storageService.updateSummary(
        summaryId,
        {
          topic,
          content,
        }
      );

    if (!updated) {
      setEditError(
        "Could not save changes. Please try again."
      );
      return;
    }

    // Reload the saved summaries.
    setSummaries(
      storageService.getSummaries()
    );

    handleCancelEdit();
  }

  // =========================================
  // DELETE SUMMARY
  // =========================================

  function handleDelete(summaryId: string) {
    const confirmed = window.confirm(
      "Delete this study summary?"
    );

    if (!confirmed) {
      return;
    }

    storageService.deleteSummary(summaryId);

    setSummaries(
      storageService.getSummaries()
    );

    if (editingId === summaryId) {
      handleCancelEdit();
    }
  }

  // =========================================
  // FORMAT DATE
  // =========================================

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat(
      "en",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(new Date(dateString));
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <section className="panel subject-summaries-panel">

      {/* SECTION HEADER */}

      <div className="subject-section-heading">
        <div>
          <p className="panel-label">
            WHAT YOU'VE LEARNED
          </p>

          <h2>Study summaries</h2>
        </div>

        {subjectSummaries.length > 0 && (
          <span className="subject-summary-count">
            {subjectSummaries.length}{" "}
            {subjectSummaries.length === 1
              ? "summary"
              : "summaries"}
          </span>
        )}
      </div>

      {/* EMPTY STATE */}

      {subjectSummaries.length === 0 ? (
        <div className="subject-summary-empty">
          <div className="subject-summary-empty-icon">
            <BookOpen size={22} />
          </div>

          <div>
            <strong>No summaries yet</strong>

            <p>
              Finish a study session and
              write down what you learned.
            </p>
          </div>
        </div>
      ) : (
        <div className="subject-summary-list">

          {subjectSummaries.map((summary) => {
            const isEditing =
              editingId === summary.id;

            return (
              <article
                key={summary.id}
                className="subject-summary-card"
              >
                {/* CARD HEADER */}

                <div className="subject-summary-card-top">
                  <div>
                    <h3>{summary.topic}</h3>

                    <span>
                      {formatDate(
                        summary.createdAt
                      )}
                    </span>
                  </div>

                  {/* ACTION BUTTONS */}

                  {!isEditing && (
                    <div className="subject-summary-actions">
                      <button
                        type="button"
                        className="icon-button subject-summary-edit"
                        onClick={() =>
                          handleEdit(summary)
                        }
                        aria-label={`Edit ${summary.topic}`}
                        title="Edit summary"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="icon-button subject-summary-delete"
                        onClick={() =>
                          handleDelete(summary.id)
                        }
                        aria-label={`Delete ${summary.topic}`}
                        title="Delete summary"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )}
                </div>

                {/* EDIT MODE */}

                {isEditing ? (
                  <form
                    className="subject-summary-edit-form"
                    onSubmit={(event) => {
                      event.preventDefault();

                      handleSaveEdit(summary.id);
                    }}
                  >

                    {/* TOPIC */}

                    <div className="form-group">
                      <label
                        htmlFor={`edit-topic-${summary.id}`}
                      >
                        Topic
                      </label>

                      <input
                        id={`edit-topic-${summary.id}`}
                        type="text"
                        value={editTopic}
                        maxLength={80}
                        required
                        onChange={(event) => {
                          setEditTopic(event.target.value);
                          setEditError("");
                        }}
                      />
                    </div>

                    {/* SUMMARY */}

                    <div className="form-group">
                      <label
                        htmlFor={`edit-content-${summary.id}`}
                      >
                        Summary
                      </label>

                      <textarea
                        id={`edit-content-${summary.id}`}
                        value={editContent}
                        maxLength={1500}
                        rows={6}
                        required
                        onChange={(event) => {
                          setEditContent(event.target.value);
                          setEditError("");
                        }}
                      />
                    </div>

                    {/* CHARACTER COUNT */}

                    <div className="subject-summary-edit-footer">
                      <span className="study-summary-character-count">
                        {editContent.length}/1500
                      </span>

                      <div className="subject-summary-edit-buttons">
                        <button
                          type="button"
                          className="subject-summary-cancel"
                          onClick={handleCancelEdit}
                        >
                          <X size={16} />
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="primary-button"
                        >
                          <Save size={16} />
                          Save changes
                        </button>
                      </div>
                    </div>

                    {editError && (
                      <p
                        className="form-error"
                        role="alert"
                      >
                        {editError}
                      </p>
                    )}
                  </form>
                ) : (
                  /* VIEW MODE */

                  <p className="subject-summary-content">
                    {summary.content}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default SubjectSummaries;
