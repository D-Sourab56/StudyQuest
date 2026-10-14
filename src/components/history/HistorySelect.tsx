
import {
  CalendarDays,
  Check,
  ChevronDown,
  Layers3,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getSubjectInitial,
} from "../../utils/subject";

// =========================================
// TYPES
// =========================================

export interface HistorySelectOption {
  value: string;
  label: string;
  description?: string;
}

interface HistorySelectProps {
  id: string;

  label: string;

  options: HistorySelectOption[];

  value: string;

  onChange: (value: string) => void;

  type: "subject" | "period";

  disabled?: boolean;
}

// =========================================
// HISTORY SELECT
// =========================================

function HistorySelect({
  id,
  label,
  options,
  value,
  onChange,
  type,
  disabled = false,
}: HistorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  const triggerRef =
    useRef<HTMLButtonElement>(null);

  const optionRefs =
    useRef<(HTMLButtonElement | null)[]>([]);

  // =========================================
  // SELECTED OPTION
  // =========================================

  const selectedIndex = options.findIndex(
    (option) => option.value === value
  );

  const selectedOption = options[selectedIndex];

  // =========================================
  // CLICK OUTSIDE + ESCAPE
  // =========================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(
      event: PointerEvent
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

    function handleFocusOutside(
      event: FocusEvent
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

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener(
      "pointerdown",
      handleClickOutside
    );

    document.addEventListener(
      "focusin",
      handleFocusOutside
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleClickOutside
      );

      document.removeEventListener(
        "focusin",
        handleFocusOutside
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen]);

  // =========================================
  // FOCUS SELECTED OPTION
  // =========================================

  useEffect(() => {
    if (!isOpen || options.length === 0) {
      return;
    }

    const index =
      selectedIndex >= 0
        ? selectedIndex
        : 0;

    optionRefs.current[index]?.focus();
  }, [isOpen, selectedIndex, options.length]);

  // =========================================
  // SELECT OPTION
  // =========================================

  function handleSelect(
    selectedValue: string
  ) {
    onChange(selectedValue);

    setIsOpen(false);

    triggerRef.current?.focus();
  }

  // =========================================
  // KEYBOARD NAVIGATION
  // =========================================

  function handleOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    let nextIndex = index;

    if (event.key === "ArrowDown") {
      nextIndex =
        (index + 1) % options.length;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        (index - 1 + options.length) %
        options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    optionRefs.current[nextIndex]?.focus();
  }

  // =========================================
  // OPTION ICON
  // =========================================

  function renderOptionIcon(
    option: HistorySelectOption
  ) {
    if (type === "period") {
      return <CalendarDays size={17} />;
    }

    if (option.value === "all") {
      return <Layers3 size={17} />;
    }

    return getSubjectInitial(
      option.label
    );
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="history-filter-field">
      <label htmlFor={id}>
        {label}
      </label>

      <div
        ref={dropdownRef}
        className="subject-select history-glass-select"
      >
        {/* TRIGGER */}

        <button
          ref={triggerRef}
          id={id}
          type="button"
          className={`subject-select-trigger ${
            isOpen ? "open" : ""
          }`}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          onClick={() =>
            setIsOpen(
              (current) => !current
            )
          }
          onKeyDown={(event) => {
            if (
              event.key === "ArrowDown" ||
              event.key === "ArrowUp"
            ) {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
        >
          <div className="subject-select-value">
            <span className="subject-select-letter">
              {selectedOption
                ? renderOptionIcon(selectedOption)
                : renderOptionIcon({
                    value: "all",
                    label: "All",
                  })}
            </span>

            <span className="subject-select-name">
              {selectedOption?.label ??
                "Select option"}
            </span>
          </div>

          <ChevronDown
            size={18}
            className="subject-select-chevron"
          />
        </button>

        {/* DROPDOWN MENU */}

        {isOpen && (
          <div
            id={`${id}-options`}
            className="subject-select-menu"
            role="listbox"
            aria-label={label}
          >
            {options.map((option, index) => {
              const isSelected =
                option.value === value;

              return (
                <button
                  key={option.value}
                  ref={(element) => {
                    optionRefs.current[index] =
                      element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`subject-select-option ${
                    isSelected
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelect(
                      option.value
                    )
                  }
                  onKeyDown={(event) =>
                    handleOptionKeyDown(
                      event,
                      index
                    )
                  }
                >
                  <div className="subject-select-option-main">
                    <span className="subject-select-letter">
                      {renderOptionIcon(
                        option
                      )}
                    </span>

                    <div className="subject-select-option-text">
                      <strong>
                        {option.label}
                      </strong>

                      {option.description && (
                        <span>
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={17} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistorySelect;
