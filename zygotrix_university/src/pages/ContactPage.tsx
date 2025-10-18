import type { FormEvent } from "react";
import { FiSend, FiPhone, FiMapPin } from "react-icons/fi";
import PageHeader from "../components/common/PageHeader";
import Container from "../components/common/Container";
import AccentButton from "../components/common/AccentButton";

const ContactPage = () => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Contact"
        title="Let’s design your learning journey."
        description={
          <p>
            Have questions about programs, enterprise rollouts, or accessibility? Drop us a note and a learner success
            advisor will respond within a business day.
          </p>
        }
      />

      <Container className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/10"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
              Full name
            </label>
            <input
              type="text"
              required
              placeholder="Taylor Morgan"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="you@company.com"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
              How can we help?
            </label>
            <textarea
              rows={5}
              placeholder="Tell us about your goals, team size, and timeline."
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <AccentButton type="submit" icon={<FiSend />}>
            Send message
          </AccentButton>
        </form>

        <div className="space-y-6 rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
              Additional touchpoints
            </span>
            <p className="text-sm text-slate-300">
              Prefer to connect instantly? Reach us via phone or drop by our studio. We host open office hours every
              Friday.
            </p>
          </div>
          <div className="space-y-4 text-sm text-white">
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <FiPhone className="mt-1 text-indigo-200" />
              <div>
                <p className="font-semibold">Call us</p>
                <p className="text-indigo-100">+1 (800) 555-0192</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <FiMapPin className="mt-1 text-indigo-200" />
              <div>
                <p className="font-semibold">Visit the studio</p>
                <p className="text-indigo-100">
                  87 Innovation Way<br />San Francisco, CA
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-xs text-indigo-100">
            Access needs? We provide captions, transcription, and alternative formats for all sessions. Mention your
            requirements when you reach out.
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ContactPage;
