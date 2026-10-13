
import {
  ArrowLeft,
  BookOpen,
  Waypoints,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router";

import {
  getSubjectRoute,
  ROUTES,
} from "../data/appConfig";

import {
  storageService,
} from "../services/storageService";

function SubjectSkillsPage() {
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
  // SUBJECT SKILLS PAGE
  // =========================================

  return (
    <div className="page-container">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

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
            SKILL DEVELOPMENT
          </p>

          <h1>
            {subject.name} Skills
          </h1>

          <p className="page-description">
            Skills and learning milestones
            related to {subject.name}.
          </p>
        </div>
      </header>

      {/* ================================= */}
      {/* FUTURE SKILL TREE */}
      {/* ================================= */}

      <section className="panel subject-skills-placeholder">
        <Waypoints size={32} />

        <h2>
          Skill Tree coming soon
        </h2>

        <p>
          Your {subject.name} skills,
          milestones, and learning paths
          will appear here when we build
          the Skill Tree.
        </p>
      </section>

    </div>
  );
}

export default SubjectSkillsPage;
