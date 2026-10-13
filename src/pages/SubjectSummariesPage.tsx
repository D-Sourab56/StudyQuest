import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";

import SubjectSummaries from "../components/subjects/SubjectSummaries";
import { getSubjectRoute, ROUTES } from "../data/appConfig";
import { storageService } from "../services/storageService";

function SubjectSummariesPage() {
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

          <p className="page-eyebrow">LEARNING NOTES</p>
          <h1>{subject.name} Summaries</h1>
          <p className="page-description">
            Review everything you've learned in {subject.name}.
          </p>
        </div>
      </header>

      <SubjectSummaries subjectId={subject.id} />
    </div>
  );
}

export default SubjectSummariesPage;