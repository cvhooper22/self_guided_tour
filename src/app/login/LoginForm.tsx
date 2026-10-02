"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO = [["traveler@example.com", "Traveler"], ["operator@example.com", "Operator"], ["admin@example.com", "Admin"]];

export default function LoginForm({ next, demo }: { next: string; demo: boolean }) {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, passcode: passcode || undefined }) });
    if (!res.ok) return setErr((await res.json()).error ?? "Sign-in failed");
    r.push(next);
    r.refresh();
  }
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold">Sign in</h1>
      <p className="mb-5 text-sm text-neutral-500">Prototype sign-in: enter an email from the seeded accounts. Real authentication comes later.</p>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className="w-full rounded border border-black/20 px-3 py-2 dark:bg-neutral-800" />
        <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Passcode (operator/admin on production)" aria-label="Passcode" className="w-full rounded border border-black/20 px-3 py-2 dark:bg-neutral-800" />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button className="w-full rounded bg-black px-4 py-2 font-semibold text-white dark:bg-white dark:text-black">Sign in</button>
      </form>
      {demo && (
        <div className="mt-6 text-sm">
          <p className="mb-2 text-neutral-500">Demo accounts:</p>
          <div className="flex flex-wrap gap-2">{DEMO.map(([e, l]) => <button key={e} type="button" className="rounded border px-3 py-1" onClick={() => setEmail(e)}>{l}</button>)}</div>
        </div>
      )}
    </main>
  );
}
