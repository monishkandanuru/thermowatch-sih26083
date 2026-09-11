'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DemoSession = {
  authenticated: boolean;
  officer_id?: string;
  role?: string;
  expires_at?: string;
};

export function SecurityDemoLogin() {
  const [officerId, setOfficerId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState<DemoSession>({ authenticated: false });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/security-demo', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session check failed');
        setSession((await response.json()) as DemoSession);
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/security-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: officerId, passcode }),
      });
      const result = (await response.json()) as DemoSession & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to verify access.');
      setSession(result);
      setPasscode('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to verify access.');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    await fetch('/api/security-demo', { method: 'DELETE' }).catch(() => undefined);
    setSession({ authenticated: false });
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f5f2ec] text-[#12203a]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#0d1e38] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div
            className="absolute -right-28 top-20 h-96 w-96 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div
            className="absolute -right-12 top-36 h-64 w-64 rounded-full border border-[#f2c96c]/25"
            aria-hidden="true"
          />
          <Link href="/" className="relative flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f2c96c]/60">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10 text-[#f2c96c] shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <b className="block text-lg">ThermoWatch</b>
              <small className="font-mono text-[11px] tracking-[0.18em] text-blue-100/55">SIH26083 · INDIA</small>
            </span>
          </Link>

          <div className="relative max-w-lg">
            <p className="mb-4 font-mono text-xs font-semibold tracking-[0.2em] text-[#f2c96c]">OFFICER SECURITY DEMO</p>
            <h1 className="text-4xl font-bold leading-tight tracking-[-0.04em] xl:text-5xl">
              Trusted access for critical heat-response work.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-blue-100/70">
              A focused authentication prototype showing server verification, session integrity and traceable access.
            </p>
            <div className="mt-9 grid gap-4">
              {[
                'Credentials are checked on the server',
                'Session cookie is signed and inaccessible to JavaScript',
                'Repeated attempts are rate limited and successful access is audited',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-blue-50/85">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs leading-5 text-blue-100/45">
            Demonstration authentication layer. The public dashboard remains open for SIH evaluation.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center p-5 sm:p-8 lg:p-12">
          <div className="w-full max-w-[470px]">
            <Link href="/" className="mb-10 flex w-fit items-center gap-2 text-sm font-semibold text-[#234b8b] hover:underline lg:hidden">
              <ShieldCheck className="h-5 w-5" /> ThermoWatch
            </Link>

            <div className="mb-8">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#e6edf7] text-[#234b8b]">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#9a6d19]">SECURE OFFICER ACCESS</p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Verify your identity</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Use the demonstration officer credentials provided to Team INNOVATRIX.
              </p>
            </div>

            {checking ? (
              <div className="flex min-h-64 items-center justify-center rounded-3xl border border-[#d9d5cd] bg-white/85 shadow-[0_24px_70px_rgb(15_23_42/8%)]">
                <Loader2 className="h-6 w-6 animate-spin text-[#234b8b]" />
                <span className="ml-3 text-sm text-slate-600">Checking secure session…</span>
              </div>
            ) : session.authenticated ? (
              <div className="rounded-3xl border border-emerald-200 bg-white p-7 shadow-[0_24px_70px_rgb(15_23_42/8%)] sm:p-8">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-2xl font-bold">Officer identity verified</h3>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Signed in as <b className="text-[#12203a]">{session.officer_id}</b>. The demonstration session is valid for four hours.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#234b8b] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#193b73] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#234b8b]/30">
                    Command center <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Button variant="outline" className="min-h-11" onClick={signOut} disabled={loading}>
                    End demo session
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="rounded-3xl border border-[#d9d5cd] bg-white p-7 shadow-[0_24px_70px_rgb(15_23_42/8%)] sm:p-8">
                <label htmlFor="officer-id" className="block text-sm font-semibold text-[#293a54]">
                  Officer ID
                </label>
                <div className="relative mt-2">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="officer-id"
                    name="officer-id"
                    autoComplete="username"
                    value={officerId}
                    onChange={(event) => setOfficerId(event.target.value)}
                    className="h-12 pl-10 text-base"
                    placeholder="Enter officer ID"
                    required
                  />
                </div>

                <label htmlFor="passcode" className="mt-5 block text-sm font-semibold text-[#293a54]">
                  Passcode
                </label>
                <div className="relative mt-2">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="passcode"
                    name="passcode"
                    type={showPasscode ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={passcode}
                    onChange={(event) => setPasscode(event.target.value)}
                    className="h-12 px-10 text-base"
                    placeholder="Enter passcode"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode((current) => !current)}
                    className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#234b8b]/30"
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {error && (
                  <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="mt-6 min-h-11 w-full bg-[#234b8b] hover:bg-[#193b73]" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                  {loading ? 'Verifying…' : 'Verify officer access'}
                </Button>

                <div className="mt-6 border-t border-slate-200 pt-5 text-center">
                  <Link href="/" className="text-sm font-semibold text-[#234b8b] hover:underline">
                    Continue to public dashboard
                  </Link>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    This SIH demonstration does not restrict public access to heat information.
                  </p>
                </div>
              </form>
            )}

            <p className="mt-7 text-center text-xs leading-5 text-slate-500">
              Security demonstration · signed session · rate-limited attempts · auditable access
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
