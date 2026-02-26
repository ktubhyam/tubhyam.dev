/**
 * Newsletter subscribe form for Buttondown.
 * Uses standard form submission (not fetch) because Buttondown's
 * embed endpoint requires a Cloudflare Turnstile challenge.
 * The browser handles the redirect chain:
 *   submit → Turnstile → confirmation email sent → redirect to /newsletter/thank-you
 */
const BUTTONDOWN_USERNAME = "latentchemistry";

export default function NewsletterSubscribe({ className = "" }: { className?: string }) {
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
      <form
        action={`https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USERNAME}`}
        method="post"
        className="flex gap-2"
      >
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="flex-1 rounded-lg border border-border bg-[#0a0a0a] px-3 py-2 text-sm text-text-primary placeholder:text-[#333] focus:outline-none focus:border-accent transition-colors font-mono"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent/10 border border-accent/30 px-4 py-2 text-sm font-mono text-accent hover:bg-accent/20 transition-colors"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
