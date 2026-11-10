import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { apiRequest } from "../lib/api";

export default function Login({ onAuthenticated, onGuestDemo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      description="Sign in with the email and password linked to your explorer account."
      eyebrow="Explorer access"
      title="Welcome back"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-300">
            Email address
          </span>
          <span className="flex items-center rounded-xl border border-stone-700 bg-black/30 px-3 transition focus-within:border-amber-500">
            <Mail
              className="shrink-0 text-stone-500"
              size={18}
              aria-hidden="true"
            />
            <input
              autoComplete="email"
              autoCapitalize="none"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none placeholder:text-stone-600"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              spellCheck="false"
              type="email"
              value={email}
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-300">
            Password
          </span>
          <span className="flex items-center rounded-xl border border-stone-700 bg-black/30 px-3 transition focus-within:border-amber-500">
            <LockKeyhole
              className="shrink-0 text-stone-500"
              size={18}
              aria-hidden="true"
            />
            <input
              autoComplete="current-password"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none placeholder:text-stone-600"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="rounded-md p-1 text-stone-400 hover:text-amber-200"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </span>
        </label>

        {error && (
          <p
            aria-live="polite"
            className="rounded-lg border border-red-900/70 bg-red-950/50 px-3 py-2.5 text-sm text-red-300"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          className="flex w-full items-center justify-center rounded-xl bg-linear-to-b from-amber-300 to-amber-600 px-5 py-3.5 font-bold text-stone-950 shadow-[0_8px_24px_#f59e0b22] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Please wait..." : "Login"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-stone-600">
        <span className="h-px flex-1 bg-stone-800" />
        or
        <span className="h-px flex-1 bg-stone-800" />
      </div>
      <button
        className="w-full rounded-xl border border-stone-700 px-5 py-3 font-semibold text-stone-200 transition hover:border-amber-700 hover:text-amber-100"
        onClick={onGuestDemo}
        type="button"
      >
        Continue as guest (demo)
      </button>
      <p className="mt-2 text-center text-xs text-stone-500">
        Guest play is local only. Sign in to save progress or invite players.
      </p>

      <p className="mt-6 text-center text-sm text-stone-400">
        New to the expedition?{" "}
        <a
          className="font-semibold text-amber-400 underline-offset-4 hover:underline"
          href="/register"
        >
          Create an account
        </a>
      </p>
    </AuthLayout>
  );
}
