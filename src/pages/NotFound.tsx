import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <p className="font-display text-6xl font-semibold text-brand-primary/20">
        404
      </p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-text-primary">
        Page not found
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-primary px-6 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
