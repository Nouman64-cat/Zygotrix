import React, { useState } from "react";

const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (field: "name" | "email" | "message") => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { name, email, message } = form;
    if (!name.trim() || !email.trim()) {
      setStatus("Please provide both your name and email address.");
      return;
    }
    const subject = encodeURIComponent("Zygotrix enquiry");
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:hello@zygotrix.io?subject=${subject}&body=${body}`;
    setStatus("Launching your email client…");
  };

  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-24">
        <div className="grid gap-12 lg:grid-cols-[2fr,3fr]">
          <div>
            <span className="inline-block rounded-full bg-[#1E3A8A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A]">
              Contact
            </span>
            <h1 className="mt-6 text-4xl font-bold text-[#1E3A8A] sm:text-5xl">
              We would love to hear how you are using genetics in your workflow.
            </h1>
            <p className="mt-6 text-base text-slate-600">
              Reach out for demos, integration guidance, or collaboration opportunities. We typically reply within two business days.
            </p>

            <div className="mt-10 space-y-6 rounded-3xl border border-white bg-white p-8 shadow-xl">
              <div>
                <p className="text-sm font-semibold text-[#1E3A8A]">Email</p>
                <a href="mailto:hello@zygotrix.io" className="mt-2 block text-sm text-slate-600 hover:text-[#1E3A8A]">
                  hello@zygotrix.io
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E3A8A]">Working hours</p>
                <p className="mt-2 text-sm text-slate-600">Monday – Friday, 9am to 6pm (GMT)</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E3A8A]">Community</p>
                <p className="mt-2 text-sm text-slate-600">
                  Join the beta Slack to swap recipes, request features, and stay in the loop.
                </p>
                <a
                  href="https://example.com/community"
                  className="mt-3 inline-flex items-center rounded-full border border-[#1E3A8A]/20 px-4 py-2 text-sm font-semibold text-[#1E3A8A] transition hover:border-[#1E3A8A]/40"
                >
                  Request an invite
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white bg-white p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-[#1E3A8A]">Send a message</h2>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1E3A8A]" htmlFor="contact-name">
                  Name
                </label>
                <input
                  id="contact-name"
                  value={form.name}
                  onChange={handleChange("name")}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1E3A8A]" htmlFor="contact-email">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1E3A8A]" htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange("message")}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1E3A8A] focus:outline-none"
                  placeholder="Tell us about your project"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/30 transition hover:bg-[#162b63]"
              >
                Compose email
              </button>
              {status && <p className="text-sm text-slate-500">{status}</p>}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
