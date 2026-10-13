import {
  CheckCircle2,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  storageService,
} from "../../services/storageService";

import type {
  StudySession,
} from "../../types/session";

import type {
  StudySummary,
} from "../../types/summary";

interface StudySummaryFormProps {
  session: StudySession;

  subjectName: string;

  onSaved?: (
    summary: StudySummary
  ) => void;
}

function StudySummaryForm({
  session,
  subjectName,
  onSaved,
}: StudySummaryFormProps) {
  const [
    topic,
    setTopic,
  ] = useState("");

  const [
    content,
    setContent,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    saved,
    setSaved,
  ] = useState(false);

  function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanTopic =
      topic.trim();

    const cleanContent =
      content.trim();

    if (!cleanTopic) {
      setError(
        "Please enter what you studied."
      );

      return;
    }

    if (!cleanContent) {
      setError(
        "Please write a short summary of what you learned."
      );

      return;
    }

    const summary:
      StudySummary = {
        id:
          crypto.randomUUID(),

        subjectId:
          session.subjectId,

        sessionId:
          session.id,

        topic:
          cleanTopic,

        content:
          cleanContent,

        createdAt:
          new Date().toISOString(),
      };

    storageService.addSummary(
      summary
    );

    setSaved(true);

    setError("");

    onSaved?.(
      summary
    );
  }

  if (saved) {
    return (
      <section className="study-summary-saved">
        <div className="study-summary-saved-icon">
          <CheckCircle2
            size={22}
          />
        </div>

        <div>
          <strong>
            Summary saved
          </strong>

          <p>
            Your notes for{" "}
            {subjectName} were
            added to your learning
            history.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="study-summary-form-wrapper">
      <div className="study-summary-heading">
        <div>
          <p className="panel-label">
            WHAT DID YOU LEARN?
          </p>

          <h3>
            Save your study notes
          </h3>

          <p>
            Write the important
            things you want to
            remember from this
            session.
          </p>
        </div>
      </div>

      <form
        className="study-summary-form"
        onSubmit={
          handleSubmit
        }
      >
        <div className="form-group">
          <label htmlFor="summary-topic">
            Topic
            <span>*</span>
          </label>

          <input
            id="summary-topic"
            type="text"
            value={
              topic
            }
            maxLength={80}
            placeholder="Example: Java inheritance"
            onChange={(
              event
            ) => {
              setTopic(
                event.target.value
              );

              setError("");
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="summary-content">
            Summary
            <span>*</span>
          </label>

          <textarea
            id="summary-content"
            value={
              content
            }
            maxLength={1500}
            rows={6}
            placeholder="Write what you learned during this study session..."
            onChange={(
              event
            ) => {
              setContent(
                event.target.value
              );

              setError("");
            }}
          />
        </div>

        <div className="study-summary-footer">
          <span className="study-summary-character-count">
            {
              content.length
            }
            /1500
          </span>

          <button
            type="submit"
            className="primary-button"
          >
            Save summary
          </button>
        </div>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

export default StudySummaryForm;