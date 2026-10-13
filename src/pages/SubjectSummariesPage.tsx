
import {
  ArrowLeft,
  BookOpen,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router";

import SubjectSummaries from "../components/subjects/SubjectSummaries";

import {
  getSubjectRoute,
  ROUTES,
} from "../data/appConfig";

import {
  storageService,
} from "../services/storageService";

function SubjectSummariesPage() {
  // =========================================
  // SUBJECT NAME FROM URL
  // =========================================

  const { subjectName } = useParams<{
    subjectName: string;
  }>();

  // =========================================
  // FIND SUBJECT
  // =========================================

  const subject = storageService
    .getSubjects()
    .find(
      (item) =>
        item.name.toLowerCase() ===
        subjectName?.toLowerCase()
    );

  // =========================================
  // SUBJECT NOT FOUND
  // =========================================

  if (!subject) {
    return (
      <div className="page-container">
        <section className="panel subject-not-found">
          <div className="empty-state-icon large">
            <BookOpen size={30} />
          </div>

          <h1>
            Subject not found
          </h1>

          <p>
            This subject may have been
            renamed, deleted, or is no
            longer available.
          </p>

          <Link
            to={ROUTES.study}
            className="primary-button"
          >
            <ArrowLeft size={17} />
            Back to Study
          </Link>
        </section>
      </div>
    );
  }

  // =========================================
  // SUBJECT SUMMARIES PAGE
  // =========================================

  return (
    <div className="page-container">

      {/* HEADER */}

      <header className="page-header">
        <div>
          {/* BACK TO SUBJECT */}

          <Link
            to={getSubjectRoute(subject.name)}
            className="subject-page-back"
          >
            <ArrowLeft size={17} />

            Back to {subject.name}
          </Link>

          <p className="page-eyebrow">
            LEARNING NOTES
          </p>

          <h1>
            {subject.name} Summaries
          </h1>

          <p className="page-description">
            Review everything you've
            learned in {subject.name}.
          </p>
        </div>
      </header>

      {/* SAVED SUMMARIES */}

      <SubjectSummaries
        subjectId={subject.id}
      />

    </div>
  );
}

export default SubjectSummariesPage;
