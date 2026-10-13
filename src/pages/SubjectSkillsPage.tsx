import { ArrowLeft, Waypoints } from "lucide-react";
import { Link, useParams } from "react-router";

import { getSubjectRoute, ROUTES } from "../data/appConfig";
import { storageService } from "../services/storageService";

function SubjectSkillsPage() {
  const { subjectId } = useParams<{ subjectId: string }>();

  const subject = storageService
    .getSubjects()
    .find((item) => item.id === subjectId);

  if (!subject) {
    return (
      <div className="page-container">
        <section className="panel">
          <h2>Subject not found</h2>
          <Link to={ROUTES.study}>Back to Study</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <Link
            to={getSubjectRoute(subject.id)}
            className="subject-page-back"
          >
            <ArrowLeft size={17} />
            Back to {subject.name}
          </Link>

          <p className="page-eyebrow">SKILL DEVELOPMENT</p>
          <h1>{subject.name} Skills</h1>
          <p className="page-description">
            Skills and learning milestones related to {subject.name}.
          </p>
        </div>
      </header>

      <section className="panel subject-skills-placeholder">
        <Waypoints size={32} />

        <h2>Skill Tree coming soon</h2>

        <p>
          Your {subject.name} skills, milestones, and learning
          paths will appear here when we build the Skill Tree.
        </p>
      </section>
    </div>
  );
}

export default SubjectSkillsPage;