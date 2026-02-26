import { useState, type FormEvent } from "react";

/**
 * Newsletter subscribe form for Buttondown.
 * Replace BUTTONDOWN_USERNAME with your actual Buttondown username.
 */
const BUTTONDOWN_USERNAME = "latentchemistry";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterSubscribe({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch(
        `https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USERNAME}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ email, tag: "website" }).toString(),
        },
      );
      if (res.ok || res.status === 303) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={`rounded-xl border border-border bg-surface p-6 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-green-400 font-mono">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
          Check your inbox to confirm your subscription.
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-surface p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono text-[#333] uppercase tracking-widest">newsletter</span>
      </div>
      <p className="text-sm text-text-secondary mb-1 font-heading">
        Latent Chemistry
      </p>
      <p className="text-xs text-text-muted mb-4">
        New posts on deep learning for spectroscopy, delivered to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          className="flex-1 rounded-lg border border-border bg-[#0a0a0a] px-3 py-2 text-sm text-text-primary placeholder:text-[#333] focus:outline-none focus:border-accent transition-colors font-mono"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-accent/10 border border-accent/30 px-4 py-2 text-sm font-mono text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-400 font-mono">Something went wrong. Try again.</p>
      )}
    </div>
  );
}
