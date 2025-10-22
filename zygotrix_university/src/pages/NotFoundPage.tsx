import { Link } from "react-router-dom";
import AccentButton from "../components/common/AccentButton";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          404
        </p>
        <h1 className="text-4xl font-semibold text-foreground">
          This page drifted into space.
        </h1>
        <p className="text-sm text-muted">
          The resource you're looking for has moved or been deprecated. Try
          navigating from the homepage.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <AccentButton to="/">Return home</AccentButton>
        <Link
          to="/contact"
          className="text-sm font-semibold text-accent hover:text-foreground"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
