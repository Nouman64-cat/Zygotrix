import React, { useState } from "react";
import { MdEmail, MdPhone, MdPerson, MdMessage, MdCheckCircle, MdError } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import * as contactApi from "../services/contact.api";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.message.trim()) {
      setStatus({
        type: "error",
        message: "Please fill in email and message fields.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatus(null);

      const response = await contactApi.submitContactForm({
        name: formData.name.trim() || undefined,
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        message: formData.message.trim(),
      });

      setStatus({
        type: "success",
        message: response.message,
      });

      // Clear form on success
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });

      // Clear success message after 5 seconds
      setTimeout(() => setStatus(null), 5000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit contact form";
      setStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-24">
        <div className="grid gap-12 lg:grid-cols-[2fr,3fr]">
          {/* Left Column - Info */}
          <div>
            <span className="inline-block rounded-full bg-[#1E3A8A]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A]">
              Contact
            </span>
            <h1 className="mt-6 text-4xl font-bold text-[#1E3A8A] sm:text-5xl">
              We'd love to hear from you
            </h1>
            <p className="mt-6 text-base text-slate-600">
              Reach out for demos, integration guidance, or collaboration
              opportunities. We typically reply within two business days.
            </p>

            <div className="mt-10 space-y-6 rounded-3xl border border-white bg-white p-8 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#1E3A8A]/10 rounded-xl">
                  <MdEmail className="w-6 h-6 text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E3A8A]">Email</p>
                  <a
                    href="mailto:hello@zygotrix.io"
                    className="mt-1 block text-sm text-slate-600 hover:text-[#1E3A8A] transition-colors"
                  >
                    hello@zygotrix.io
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#1E3A8A]/10 rounded-xl">
                  <MdMessage className="w-6 h-6 text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E3A8A]">
                    Working hours
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Monday - Friday, 9am to 6pm (GMT)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="rounded-3xl border border-white bg-white p-8 lg:p-10 shadow-xl">
            <h2 className="text-2xl font-bold text-[#1E3A8A] mb-6">
              Send us a message
            </h2>

            {status && (
              <div
                className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                  status.type === "success"
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {status.type === "success" ? (
                  <MdCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <MdError className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <p
                  className={`text-sm ${
                    status.type === "success"
                      ? "text-emerald-800"
                      : "text-red-800"
                  }`}
                >
                  {status.message}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Name <span className="text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email (Required) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number <span className="text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Message (Required) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Tell us about your project or inquiry..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1E3A8A] text-white font-semibold rounded-xl hover:bg-[#1E3A8A]/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <BiLoaderAlt className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MdEmail className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                By submitting this form, you'll be automatically subscribed to our newsletter.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
