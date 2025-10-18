import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";
import AccentButton from "../components/common/AccentButton";

const NewsletterPage = () => {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Newsletter"
        title="Get weekly drops from the Zygotrix faculty."
        description={
          <p>
            Every Thursday we deliver curated insights, Simulation Studio mission highlights, and fresh templates to your
            inbox. No spam, just tactical ways to level up.
          </p>
        }
      />

      <Container className="space-y-6 rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
        <form className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            type="email"
            required
            placeholder="you@company.com"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
          <AccentButton type="submit">Subscribe</AccentButton>
        </form>
        <p className="text-xs text-slate-300">
          By subscribing you agree to receive emails from Zygotrix. You can unsubscribe anytime with one click.
        </p>
      </Container>
    </div>
  );
};

export default NewsletterPage;
