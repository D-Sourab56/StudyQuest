import {
  BookOpen,
  Plus,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import SubjectCard from "../components/subjects/SubjectCard";

import SubjectDetails from "../components/subjects/SubjectDetails";

import {
  storageService,
} from "../services/storageService";

import type {
  StudySubject,
} from "../types/subject";

function Study() {
  // =========================================
  // SUBJECT DATA
  // =========================================

  const [
    subjects,
    setSubjects,
  ] = useState<StudySubject[]>(() =>
    storageService.getSubjects()
  );

  // =========================================
  // FORM STATE
  // =========================================

  const [
    showSubjectForm,
    setShowSubjectForm,
  ] = useState(false);

  const [
    editingSubjectId,
    setEditingSubjectId,
  ] = useState<string | null>(
    null
  );

  const [
    subjectName,
    setSubjectName,
  ] = useState("");

  const [
    subjectCategory,
    setSubjectCategory,
  ] = useState("");

  const [
    subjectIcon,
    setSubjectIcon,
  ] = useState("📘");

  const [
    formError,
    setFormError,
  ] = useState("");

  // =========================================
  // SUBJECT DETAILS
  // =========================================

  const [
    selectedSubject,
    setSelectedSubject,
  ] =
    useState<StudySubject | null>(
      null
    );

  // =========================================
  // FORM HELPERS
  // =========================================

  function resetForm() {
    setSubjectName("");

    setSubjectCategory("");

    setSubjectIcon("📘");

    setEditingSubjectId(null);

    setFormError("");
  }

  function openCreateForm() {
    resetForm();

    setSelectedSubject(null);

    setShowSubjectForm(true);
  }

  function closeForm() {
    resetForm();

    setShowSubjectForm(false);
  }

  // =========================================
  // CREATE / UPDATE SUBJECT
  // =========================================

  function handleSaveSubject(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanName =
      subjectName.trim();

    const cleanCategory =
      subjectCategory.trim();

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
          subject.id !==
            editingSubjectId
      );

    if (subjectAlreadyExists) {
      setFormError(
        "A subject with this name already exists."
      );

      return;
    }

    // =========================================
    // EDIT EXISTING SUBJECT
    // =========================================

    if (editingSubjectId) {
      const updatedSubjects =
        subjects.map(
          (subject) => {
            if (
              subject.id !==
              editingSubjectId
            ) {
              return subject;
            }

            return {
              ...subject,

              name: cleanName,

              category:
                cleanCategory ||
                undefined,

              icon:
                subjectIcon.trim() ||
                "📘",
            };
          }
        );

      setSubjects(
        updatedSubjects
      );

      storageService.saveSubjects(
        updatedSubjects
      );

      const updatedSubject =
        updatedSubjects.find(
          (subject) =>
            subject.id ===
            editingSubjectId
        );

      if (updatedSubject) {
        setSelectedSubject(
          updatedSubject
        );
      }

      closeForm();

      return;
    }

    // =========================================
    // CREATE NEW SUBJECT
    // =========================================

    const newSubject: StudySubject = {
      id: crypto.randomUUID(),

      name: cleanName,

      icon:
        subjectIcon.trim() || "📘",

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

    setSubjects(
      updatedSubjects
    );

    storageService.saveSubjects(
      updatedSubjects
    );

    closeForm();
  }

  // =========================================
  // EDIT SUBJECT
  // =========================================

  function handleEditSubject(
    subject: StudySubject
  ) {
    setEditingSubjectId(
      subject.id
    );

    setSubjectName(
      subject.name
    );

    setSubjectCategory(
      subject.category ?? ""
    );

    setSubjectIcon(
      subject.icon
    );

    setSelectedSubject(null);

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
    const confirmed =
      window.confirm(
        `Delete "${subject.name}"?\n\nThis subject will be permanently removed.`
      );

    if (!confirmed) {
      return;
    }

    const updatedSubjects =
      subjects.filter(
        (currentSubject) =>
          currentSubject.id !==
          subject.id
      );

    setSubjects(
      updatedSubjects
    );

    storageService.saveSubjects(
      updatedSubjects
    );

    if (
      selectedSubject?.id ===
      subject.id
    ) {
      setSelectedSubject(null);
    }

    if (
      editingSubjectId ===
      subject.id
    ) {
      closeForm();
    }
  }

  // =========================================
  // OPEN DETAILS
  // =========================================

  function handleOpenSubject(
    subject: StudySubject
  ) {
    setSelectedSubject(
      subject
    );

    setShowSubjectForm(false);

    resetForm();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="page-container">
      {/* ============================== */}
      {/* HEADER */}
      {/* ============================== */}

      <header className="page-header study-page-header">
        <div>
          <p className="page-eyebrow">
            FOCUS
          </p>

          <h1>
            Study
          </h1>

          <p className="page-description">
            Choose what you want to learn and begin
            building visible progress.
          </p>
        </div>

        {subjects.length > 0 && (
          <button
            type="button"
            className="primary-button subject-add-button"
            onClick={
              openCreateForm
            }
          >
            <Plus size={18} />

            Add subject
          </button>
        )}
      </header>

      {/* ============================== */}
      {/* SUBJECT DETAILS */}
      {/* ============================== */}

      {selectedSubject &&
        !showSubjectForm && (
          <SubjectDetails
            subject={
              selectedSubject
            }
            onClose={() =>
              setSelectedSubject(
                null
              )
            }
            onEdit={
              handleEditSubject
            }
          />
        )}

      {/* ============================== */}
      {/* SUBJECT FORM */}
      {/* ============================== */}

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
              onClick={
                closeForm
              }
              aria-label="Close subject form"
            >
              <X size={20} />
            </button>
          </div>

          <form
            className="subject-form"
            onSubmit={
              handleSaveSubject
            }
          >
            {/* Icon */}
            <div className="form-group subject-icon-field">
              <label htmlFor="subject-icon">
                Icon
              </label>

              <input
                id="subject-icon"
                type="text"
                value={
                  subjectIcon
                }
                maxLength={4}
                onChange={(
                  event
                ) =>
                  setSubjectIcon(
                    event.target
                      .value
                  )
                }
              />
            </div>

            {/* Name */}
            <div className="form-group">
              <label htmlFor="subject-name">
                Subject name

                <span>
                  *
                </span>
              </label>

              <input
                id="subject-name"
                type="text"
                value={
                  subjectName
                }
                maxLength={50}
                placeholder="Example: Java"
                autoFocus
                onChange={(
                  event
                ) => {
                  setSubjectName(
                    event.target
                      .value
                  );

                  setFormError(
                    ""
                  );
                }}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="subject-category">
                Category
              </label>

              <input
                id="subject-category"
                type="text"
                value={
                  subjectCategory
                }
                maxLength={30}
                placeholder="Example: Programming"
                onChange={(
                  event
                ) =>
                  setSubjectCategory(
                    event.target
                      .value
                  )
                }
              />
            </div>

            {/* Error */}
            {formError && (
              <p className="form-error">
                {formError}
              </p>
            )}

            {/* Buttons */}
            <div className="subject-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={
                  closeForm
                }
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

      {/* ============================== */}
      {/* EMPTY STATE */}
      {/* ============================== */}

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
                Subjects help StudyQuest understand
                what you are learning. Start with
                something like Java, SQL, English,
                or Networking.
              </p>

              <button
                type="button"
                className="primary-button empty-state-button"
                onClick={
                  openCreateForm
                }
              >
                <Plus size={18} />

                Create subject
              </button>
            </div>
          </section>
        )}

      {/* ============================== */}
      {/* SUBJECT LIST */}
      {/* ============================== */}

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

              {subjects.length ===
              1
                ? " subject"
                : " subjects"}
            </span>
          </div>

          <div className="subjects-grid">
            {subjects.map(
              (subject) => (
                <SubjectCard
                  key={
                    subject.id
                  }
                  subject={
                    subject
                  }
                  onOpen={
                    handleOpenSubject
                  }
                  onEdit={
                    handleEditSubject
                  }
                  onDelete={
                    handleDeleteSubject
                  }
                />
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default Study;