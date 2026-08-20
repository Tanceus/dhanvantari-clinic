import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useClinicConfig } from "../config/ClinicConfigProvider";
import { useAuth } from "../lib/auth/AuthProvider";
import { isSupabaseConfigured } from "../lib/supabase";
import { isValidEmail } from "../lib/utils";

export function LoginPage() {
  const { config } = useClinicConfig();
  const { session, loading, signIn } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/dashboard";
  const redirectTo = fromPath === "/login" ? "/dashboard" : fromPath;

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg-base">
        <p className="text-sm text-text-muted">Checking sign-in…</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-base px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg-surface px-6 py-8 shadow-card sm:px-8">
        <p className="font-display text-2xl font-semibold tracking-tight text-brand-primary">
          {config.branding.logoText}
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold text-text-primary">
          Staff sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Sign in to open the {config.name} console.
        </p>

        {!isSupabaseConfigured() && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-terracotta/25 bg-terracotta/8 px-4 py-3 text-sm text-terracotta"
          >
            Sign-in is not configured. Set VITE_SUPABASE_URL and
            VITE_SUPABASE_ANON_KEY in the frontend environment.
          </p>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-terracotta/25 bg-terracotta/8 px-4 py-3 text-sm text-terracotta"
            >
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text-primary">
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-base px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-colors focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text-primary">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg-base px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-colors focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              required
            />
          </label>

          <button
            type="submit"
            disabled={submitting || loading || !isSupabaseConfigured()}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-primary px-5 text-sm font-medium text-white shadow-soft transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
