import { useState } from "react";
import {
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { apiRequest } from "../lib/api";

export default function Registration({ onAuthenticated }) {
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, dateOfBirth, email, password }),
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
      description="Create an explorer account to save your discoveries and journey progress."
      eyebrow="Join the expedition"
      title="Create your account"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-300">
            Full name
          </span>
          <span className="flex items-center rounded-xl border border-stone-700 bg-black/30 px-3 transition focus-within:border-amber-500">
            <UserRound
              className="shrink-0 text-stone-500"
              size={18}
              aria-hidden="true"
            />
            <input
              autoComplete="name"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none placeholder:text-stone-600"
              maxLength={80}
              minLength={2}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              required
              value={name}
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-300">
            Date of birth
          </span>
          <span className="flex items-center rounded-xl border border-stone-700 bg-black/30 px-3 transition focus-within:border-amber-500">
            <CalendarDays
              className="shrink-0 text-stone-500"
              size={18}
              aria-hidden="true"
            />
            <input
              autoComplete="bday"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none scheme-dark"
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDateOfBirth(event.target.value)}
              required
              type="date"
              value={dateOfBirth}
            />
          </span>
        </label>

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
              autoComplete="new-password"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none placeholder:text-stone-600"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
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

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-300">
            Confirm password
          </span>
          <span className="flex items-center rounded-xl border border-stone-700 bg-black/30 px-3 transition focus-within:border-amber-500">
            <ShieldCheck
              className="shrink-0 text-stone-500"
              size={18}
              aria-hidden="true"
            />
            <input
              autoComplete="new-password"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none placeholder:text-stone-600"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter your password again"
              required
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
            />
            <button
              aria-label={
                showConfirmPassword
                  ? "Hide confirmed password"
                  : "Show confirmed password"
              }
              aria-pressed={showConfirmPassword}
              className="rounded-md p-1 text-stone-400 hover:text-amber-200"
              onClick={() =>
                setShowConfirmPassword((visible) => !visible)
              }
              type="button"
            >
              {showConfirmPassword ? (
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
          {isSubmitting ? "Please wait..." : "Create explorer account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-400">
        Already registered?{" "}
        <a
          className="font-semibold text-amber-400 underline-offset-4 hover:underline"
          href="/login"
        >
          Sign in
        </a>
      </p>
    </AuthLayout>
  );
}
