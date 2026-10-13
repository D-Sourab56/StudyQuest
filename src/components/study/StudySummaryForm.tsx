
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import {
  storageService,
} from "../../services/storageService";

import {
  summaryDraftService,
} from "../../services/summaryDraftService";

import type {
  StudySession,
} from "../../types/session";

import type {
  StudySummary,
} from "../../types/summary";

import type {
  StudySummaryDraft,
} from "../../services/summaryDraftService";

interface StudySummaryFormProps {
  session: StudySession;
  subjectName: string;
  onSaved?: (summary: StudySummary) => void;
}

function StudySummaryForm({
  session,
  subjectName,
  onSaved,
}: StudySummaryFormProps) {
  // =========================================
  // RESTORE SAVED DRAFT
  // =========================================

  const [draft, setDraft] =
    useState<StudySummaryDraft>(
      () =>
        summaryDraftService.getDraft(
          session.id
        )
    );

  const { topic, content } = draft;

  const [error, setError] = useState("");

  const [saved, setSaved] = useState(
    () =>
      storageService.getSummaries().some(
        (summary) =>
          summary.sessionId === session.id
      )
  );

  // =========================================
  // AUTOMATIC DRAFT SAVING
  // =========================================

  function updateDraft(
    updatedDraft: StudySummaryDraft
  ) {
    setDraft(updatedDraft);

    const savedSuccessfully =
      summaryDraftService.saveDraft(
        session.id,
        updatedDraft
      );

    setError(
      savedSuccessfully
        ? ""
        : "Could not save your draft locally. Check your browser storage settings."
    );
  }

  // =========================================
  // SAVE FINAL SUMMARY
  // =========================================

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saved) {
      return;
    }

    const cleanTopic = topic.trim();
    const cleanContent = content.trim();

    if (!cleanTopic) {
      setError("Please enter what you studied.");
      return;
    }

    if (!cleanContent) {
      setError(
        "Please write a short summary of what you learned."
      );
      return;
    }

    const summary: StudySummary = {
      id: crypto.randomUUID(),

      subjectId: session.subjectId,
      sessionId: session.id,

      topic: cleanTopic,
      content: cleanContent,

      createdAt: new Date().toISOString(),
    };

    // Prevent duplicate summaries for this session.
    const existingSummary =
      storageService.getSummaries().find(
        (item) =>
          item.sessionId === session.id
      );

    if (existingSummary) {
      summaryDraftService.clearDraft(session.id);
      setSaved(true);
      setError("");
      return;
    }

    // Save the permanent summary first.
    storageService.addSummary(summary);

    const savedSuccessfully =
      storageService.getSummaries().some(
        (item) => item.id === summary.id
      );

    if (!savedSuccessfully) {
      setError(
        "Could not save your summary. Your draft has been kept."
      );
      return;
    }

    // Only remove the draft after a successful save.
    summaryDraftService.clearDraft(session.id);

    setSaved(true);
    setError("");

    onSaved?.(summary);
  }

  // =========================================
  // SAVED CONFIRMATION
  // =========================================

  if (saved) {
    return (
      <section className="study-summary-saved">
        <div className="study-summary-saved-icon">
          <CheckCircle2 size={22} />
        </div>

        <div>
          <strong>Summary saved</strong>

          <p>
            Your notes for {subjectName} were
            added to your learning history.
          </p>
        </div>
      </section>
    );
  }

  // =========================================
  // SUMMARY FORM
  // =========================================

  return (
    <section className="study-summary-form-wrapper">
      <div className="study-summary-heading">
        <div>
          <p className="panel-label">
            WHAT DID YOU LEARN?
          </p>

          <h3>Save your study notes</h3>

          <p>
            Write the important things you
            want to remember from this session.
            Your unfinished draft is saved
            automatically.
          </p>
        </div>
      </div>

      <form
        className="study-summary-form"
        onSubmit={handleSubmit}
      >
        {/* TOPIC */}

        <div className="form-group">
          <label htmlFor="summary-topic">
            Topic
            <span>*</span>
          </label>

          <input
            id="summary-topic"
            type="text"
            value={topic}
            maxLength={80}
            placeholder="Example: Java inheritance"
            onChange={(event) =>
              updateDraft({
                ...draft,
                topic: event.target.value,
              })
            }
          />
        </div>

        {/* SUMMARY */}

        <div className="form-group">
          <label htmlFor="summary-content">
            Summary
            <span>*</span>
          </label>

          <textarea
            id="summary-content"
            value={content}
            maxLength={1500}
            rows={6}
            placeholder="Write what you learned during this study session..."
            onChange={(event) =>
              updateDraft({
                ...draft,
                content: event.target.value,
              })
            }
          />
        </div>

        {/* FORM FOOTER */}

        <div className="study-summary-footer">
          <span className="study-summary-character-count">
            {content.length}/1500
          </span>

          <button
            type="submit"
            className="primary-button"
          >
            Save summary
          </button>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

export default StudySummaryForm;
