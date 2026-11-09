
import { BookOpen, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import StudyTimer from "../components/study/StudyTimer";
import SubjectCard from "../components/subjects/SubjectCard";

import { useStudyTimer } from "../context/StudyTimerContext";
import { useStorageMode } from "../context/StorageModeContext";

import { storageService } from "../services/storageService";
import { subjectSyncQueueService } from "../services/subjectSyncQueueService";

import type { StudySubject } from "../types/subject";

// =========================================
// TYPES
// =========================================

type SubjectChange =
  | {
      type: "save";
      subject: StudySubject;
    }
  | {
      type: "delete";
      subjectId: string;
    };

// =========================================
// STUDY PAGE
// =========================================

function Study() {
  // =========================================
  // GLOBAL STUDY TIMER
  // =========================================

  const { setStudyWorkspaceOpen } = useStudyTimer();

  // =========================================
  // STORAGE MODE
  // =========================================

  const { mode, accountUserId } = useStorageMode();

  // =========================================
  // SUBJECT DATA
  // =========================================

  const [subjects, setSubjects] = useState<StudySubject[]>(
    () => storageService.getSubjects()
  );

  // =========================================
  // FORM STATE
  // =========================================

  const [showSubjectForm, setShowSubjectForm] =
    useState(false);

  const [editingSubjectId, setEditingSubjectId] =
    useState<string | null>(null);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCategory, setSubjectCategory] =
    useState("");

  const [formError, setFormError] = useState("");
  const [storageError, setStorageError] = useState("");

  // =========================================
  // WORKSPACE
  // =========================================

  const isStudyWorkspaceOpen = showSubjectForm;

  useEffect(() => {
    setStudyWorkspaceOpen(isStudyWorkspaceOpen);

    return () => {
      setStudyWorkspaceOpen(false);
    };
  }, [
    isStudyWorkspaceOpen,
    setStudyWorkspaceOpen,
  ]);

  // =========================================
  // BACKGROUND CLOUD SYNCHRONIZATION
  // =========================================

  // The synchronization controls now live
  // in Settings -> Private Account.
  //
  // This function continues processing
  // subject changes in the background.
  //
  // The queue remains persistent when
  // uploads fail.

  const processCloudQueue = useCallback(
    async (userId: string): Promise<void> => {
      try {
        await subjectSyncQueueService.processPendingOperations(
          userId
        );
      } catch (error) {
        console.error(
          "StudyQuest background subject synchronization failed:",
          error
        );

        // Do not delete pending operations.
        //
        // The queue service retains them
        // for a future retry.
        //
        // Settings displays the current
        // synchronization status.
      }
    },
    []
  );

  // =========================================
  // RETRY PENDING CLOUD OPERATIONS
  // =========================================

  useEffect(() => {
    if (
      mode !== "private" ||
      accountUserId === null
    ) {
      return;
    }

    const userId = accountUserId;

    // Retry when the Study page opens.
    void processCloudQueue(userId);

    // Retry when the browser reconnects.
    function handleOnline() {
      void processCloudQueue(userId);
    }

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, [
    mode,
    accountUserId,
    processCloudQueue,
  ]);

  // =========================================
  // SAFE LOCAL SAVE
  // =========================================

  // =========================================
  // SAFE SUBJECT CHANGE
  // =========================================

  function persistSubjectChange(
    updatedSubjects: StudySubject[],
    change: SubjectChange
  ): boolean {
    // =====================================
    // PRIVATE ACCOUNT VALIDATION
    // =====================================

    if (accountUserId === null) {
      setStorageError(
        "Private Account identification is unavailable. " +
          "Your subject change was cancelled to protect synchronization."
      );

      return false;
    }

    const userId = accountUserId;

    // =====================================
    // PRESERVE PREVIOUS SUBJECTS
    // =====================================

    const previousSubjects = subjects;

    // =====================================
    // STEP 1: SAVE LOCALLY
    // =====================================

    try {
      storageService.saveSubjects(
        updatedSubjects
      );
    } catch (error) {
      console.error(
        "Failed to save subjects locally:",
        error
      );

      setStorageError(
        "Your subject change could not be saved locally. " +
          "No new cloud operation was queued."
      );

      return false;
    }

    // =====================================
    // STEP 2: RECORD CLOUD OPERATION
    // =====================================

    try {
      if (change.type === "save") {
        subjectSyncQueueService.enqueueSubjectSave(
          userId,
          change.subject
        );
      } else {
        subjectSyncQueueService.enqueueSubjectDelete(
          userId,
          change.subjectId
        );
      }
    } catch (error) {
      console.error(
        "Failed to record subject sync operation:",
        error
      );

      // ===================================
      // STEP 3: RESTORE PREVIOUS LOCAL DATA
      // ===================================

      try {
        storageService.saveSubjects(
          previousSubjects
        );

        setSubjects(previousSubjects);

        setStorageError(
          "The cloud sync operation could not be stored, " +
            "so StudyQuest restored your previous subjects. " +
            "Your requested change was cancelled. Please try again."
        );
      } catch (rollbackError) {
        console.error(
          "CRITICAL: Failed to restore previous subjects:",
          rollbackError
        );

        // The original local save succeeded.
        // Keep the UI consistent with
        // that locally saved data.

        setSubjects(updatedSubjects);

        setStorageError(
          "IMPORTANT: Your subject change was saved locally, " +
            "but cloud synchronization could not be queued " +
            "and the previous data could not be restored. " +
            "Do not clear browser data or switch devices. " +
            "Keep this device's data and resolve the storage problem."
        );
      }

      return false;
    }

    // =====================================
    // STEP 4: COMMIT LOCAL CHANGE
    // =====================================

    setSubjects(updatedSubjects);
    setStorageError("");

    // =====================================
    // STEP 5: BACKGROUND CLOUD SYNC
    // =====================================

    // The operation is already stored
    // in the persistent sync queue.
    //
    // A network failure will not remove
    // the pending operation.

    void processCloudQueue(userId);

    return true;
  }

  // =========================================
  // FORM HELPERS
  // =========================================

  function resetForm() {
    setSubjectName("");
    setSubjectCategory("");
    setEditingSubjectId(null);
    setFormError("");
  }

  function openCreateForm() {
    resetForm();
    setShowSubjectForm(true);
  }

  function closeForm() {
    resetForm();
    setShowSubjectForm(false);
  }

  // =========================================
  // SAVE SUBJECT
  // =========================================

  function handleSaveSubject(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanName = subjectName.trim();
    const cleanCategory =
      subjectCategory.trim();

    // =====================================
    // VALIDATION
    // =====================================

    if (!cleanName) {
      setFormError(
        "Please enter a subject name."
      );
      return;
    }

    const subjectAlreadyExists =
      subjects.some(
        (subject) =>
          subject.name.toLowerCase() ===
            cleanName.toLowerCase() &&
          subject.id !== editingSubjectId
      );

    if (subjectAlreadyExists) {
      setFormError(
        "A subject with this name already exists."
      );
      return;
    }

    // =====================================
    // EDIT SUBJECT
    // =====================================

    if (editingSubjectId) {
      const existingSubject =
        subjects.find(
          (subject) =>
            subject.id === editingSubjectId
        );

      if (!existingSubject) {
        setFormError(
          "The selected subject could not be found."
        );
        return;
      }

      const editedSubject: StudySubject = {
        ...existingSubject,
        name: cleanName,
        category:
          cleanCategory || undefined,
      };

      const updatedSubjects =
        subjects.map(
          (subject) =>
            subject.id === editingSubjectId
              ? editedSubject
              : subject
        );

      const saved = persistSubjectChange(
        updatedSubjects,
        {
          type: "save",
          subject: editedSubject,
        }
      );

      if (!saved) {
        return;
      }

      closeForm();
      return;
    }

    // =====================================
    // CREATE SUBJECT
    // =====================================

    const newSubject: StudySubject = {
      id: crypto.randomUUID(),
      name: cleanName,
      category:
        cleanCategory || undefined,
      progress: 0,
      createdAt:
        new Date().toISOString(),
    };

    const updatedSubjects = [
      ...subjects,
      newSubject,
    ];

    const saved = persistSubjectChange(
      updatedSubjects,
      {
        type: "save",
        subject: newSubject,
      }
    );

    if (!saved) {
      return;
    }

    closeForm();
  }

  // =========================================
  // EDIT SUBJECT
  // =========================================

  function handleEditSubject(
    subject: StudySubject
  ) {
    setEditingSubjectId(subject.id);
    setSubjectName(subject.name);
    setSubjectCategory(
      subject.category ?? ""
    );

    setFormError("");
    setShowSubjectForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================================
  // DELETE SUBJECT
  // =========================================

  function handleDeleteSubject(
    subject: StudySubject
  ) {
    let activeTimer;

    // =====================================
    // VERIFY ACTIVE TIMER
    // =====================================

    try {
      activeTimer =
        storageService.getActiveTimer();
    } catch (error) {
      console.error(
        "Could not check active timer:",
        error
      );

      setStorageError(
        "Could not verify the active study timer. " +
          "Deletion was cancelled to protect your data."
      );

      return;
    }

    if (
      activeTimer?.subjectId ===
      subject.id
    ) {
      window.alert(
        `You are currently studying "${subject.name}". Finish the active study session before deleting this subject.`
      );

      return;
    }

    // =====================================
    // CONFIRM DELETION
    // =====================================

    const confirmed = window.confirm(
      `Delete "${subject.name}"?\n\nThis subject will be permanently removed.`
    );

    if (!confirmed) {
      return;
    }

    // =====================================
    // REMOVE SUBJECT
    // =====================================

    const updatedSubjects =
      subjects.filter(
        (currentSubject) =>
          currentSubject.id !==
          subject.id
      );

    const deleted = persistSubjectChange(
      updatedSubjects,
      {
        type: "delete",
        subjectId: subject.id,
      }
    );

    if (!deleted) {
      return;
    }

    if (
      editingSubjectId ===
      subject.id
    ) {
      closeForm();
    }
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="page-container">
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <header className="page-header study-page-header">
        <div>
          <p className="page-eyebrow">
            FOCUS
          </p>

          <h1>Study</h1>

          <p className="page-description">
            Choose what you want
            to learn and begin
            building visible
            progress.
          </p>
        </div>

        {subjects.length > 0 && (
          <button
            type="button"
            className="primary-button subject-add-button"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Add subject
          </button>
        )}
      </header>

      {/* ================================= */}
      {/* LOCAL STORAGE ERROR NOTICE */}
      {/* ================================= */}

      {storageError && (
        <section
          className="panel"
          role="alert"
          aria-live="polite"
        >
          <p className="form-error">
            {storageError}
          </p>
        </section>
      )}

      {/* ================================= */}
      {/* TIMER */}
      {/* ================================= */}

      {subjects.length > 0 &&
        !isStudyWorkspaceOpen && (
          <StudyTimer
            subjects={subjects}
          />
        )}

      {/* ================================= */}
      {/* SUBJECT FORM */}
      {/* ================================= */}

      {showSubjectForm && (
        <section className="panel subject-form-panel">
          <div className="subject-form-heading">
            <div>
              <p className="panel-label">
                {editingSubjectId
                  ? "EDIT SUBJECT"
                  : "NEW SUBJECT"}
              </p>

              <h2>
                {editingSubjectId
                  ? "Update subject"
                  : "Create a subject"}
              </h2>

              <p>
                {editingSubjectId
                  ? "Update the subject information below."
                  : "Add something you want to study and track in StudyQuest."}
              </p>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={closeForm}
              aria-label="Close subject form"
            >
              <X size={20} />
            </button>
          </div>

          <form
            className="subject-form"
            onSubmit={handleSaveSubject}
          >
            <div className="form-group">
              <label htmlFor="subject-name">
                Subject name
                <span>*</span>
              </label>

              <input
                id="subject-name"
                type="text"
                value={subjectName}
                maxLength={50}
                placeholder="Example: Java"
                autoFocus
                onChange={(event) => {
                  setSubjectName(
                    event.target.value
                  );
                  setFormError("");
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject-category">
                Category
              </label>

              <input
                id="subject-category"
                type="text"
                value={subjectCategory}
                maxLength={30}
                placeholder="Example: Programming"
                onChange={(event) =>
                  setSubjectCategory(
                    event.target.value
                  )
                }
              />
            </div>

            {formError && (
              <p className="form-error">
                {formError}
              </p>
            )}

            <div className="subject-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                {editingSubjectId
                  ? "Save changes"
                  : "Create subject"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ================================= */}
      {/* EMPTY STATE */}
      {/* ================================= */}

      {subjects.length === 0 &&
        !showSubjectForm && (
          <section className="panel">
            <div className="empty-state">
              <div className="empty-state-icon large">
                <BookOpen size={30} />
              </div>

              <h2>
                Create your first subject.
              </h2>

              <p>
                Subjects help StudyQuest
                understand what you are learning.
              </p>

              <button
                type="button"
                className="primary-button empty-state-button"
                onClick={openCreateForm}
              >
                <Plus size={18} />
                Create subject
              </button>
            </div>
          </section>
        )}

      {/* ================================= */}
      {/* SUBJECT LIST */}
      {/* ================================= */}

      {subjects.length > 0 && (
        <section className="subjects-section">
          <div className="section-heading-row">
            <div>
              <p className="panel-label">
                YOUR SUBJECTS
              </p>

              <h2>
                What are you learning?
              </h2>
            </div>

            <span className="subject-count">
              {subjects.length}
              {subjects.length === 1
                ? " subject"
                : " subjects"}
            </span>
          </div>

          <div className="subjects-grid">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={handleEditSubject}
                onDelete={handleDeleteSubject}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Study;
