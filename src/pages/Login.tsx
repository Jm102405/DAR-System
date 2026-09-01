import { useState } from "react";
import { EyeIcon, EyeOffIcon, ScaleIcon } from "lucide-react";
import { useAuth } from "../lib/auth";

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setError(err?.message ?? "Sign in failed. Check your credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e9dfe5] px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-ink text-gold-soft">
            <ScaleIcon className="h-6 w-6" strokeWidth={2} />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">
            DAR clearance tracker
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ink/50">
            Land clearance case desk
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-ink/70"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full rounded-xl border border-ink/15 px-3.5 py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-ink/70"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-xl border border-ink/15 py-3 pl-3.5 pr-11 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink/45 transition-colors hover:bg-black/5 hover:text-ink/70"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-3.5 py-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy}
              className="w-full rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-light active:bg-ink-dark disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-ink/50">
          Internal system. Accounts are created by an administrator.
        </p>
      </div>
    </div>
  );
}
