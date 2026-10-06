import {
  Check,
  ChevronDown,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  StudySubject,
} from "../../types/subject";

import {
  getSubjectInitial,
} from "../../utils/subject";

interface SubjectSelectProps {
  subjects: StudySubject[];

  value: string;

  onChange: (
    subjectId: string
  ) => void;

  disabled?: boolean;
}

function SubjectSelect({
  subjects,
  value,
  onChange,
  disabled = false,
}: SubjectSelectProps) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const dropdownRef =
    useRef<HTMLDivElement>(
      null
    );

  const selectedSubject =
    subjects.find(
      (subject) =>
        subject.id === value
    );

  // =========================================
  // CLICK OUTSIDE
  // =========================================

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================================
  // ESCAPE
  // =========================================

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // =========================================
  // SELECT SUBJECT
  // =========================================

  function handleSelect(
    subjectId: string
  ) {
    onChange(subjectId);

    setIsOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className="subject-select"
    >
      <button
        type="button"
        className={`subject-select-trigger ${
          isOpen ? "open" : ""
        }`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() =>
          setIsOpen(
            (current) =>
              !current
          )
        }
      >
        {selectedSubject ? (
          <div className="subject-select-value">
            <span className="subject-select-letter">
              {getSubjectInitial(
                selectedSubject.name
              )}
            </span>

            <span className="subject-select-name">
              {
                selectedSubject.name
              }
            </span>
          </div>
        ) : (
          <span className="subject-select-placeholder">
            Choose subject
          </span>
        )}

        <ChevronDown
          size={18}
          className="subject-select-chevron"
        />
      </button>

      {isOpen && (
        <div
          className="subject-select-menu"
          role="listbox"
        >
          {subjects.map(
            (subject) => {
              const isSelected =
                subject.id ===
                value;

              return (
                <button
                  key={
                    subject.id
                  }
                  type="button"
                  role="option"
                  aria-selected={
                    isSelected
                  }
                  className={`subject-select-option ${
                    isSelected
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelect(
                      subject.id
                    )
                  }
                >
                  <div className="subject-select-option-main">
                    <span className="subject-select-letter">
                      {getSubjectInitial(
                        subject.name
                      )}
                    </span>

                    <div className="subject-select-option-text">
                      <strong>
                        {
                          subject.name
                        }
                      </strong>

                      {subject.category && (
                        <span>
                          {
                            subject.category
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check
                      size={17}
                    />
                  )}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

export default SubjectSelect;