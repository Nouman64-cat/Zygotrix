import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import * as newsletterApi from "../services/newsletter.api";
import type {
  NewsletterSubscription,
  SendNewsletterRequest,
} from "../services/newsletter.api";

const TEMPLATE_TYPES = [
  {
    value: "changelog" as const,
    label: "Changelog",
    icon: "📝",
    color: "from-green-500 to-emerald-600",
    description: "Share product updates and feature improvements",
  },
  {
    value: "release" as const,
    label: "Release",
    icon: "🚀",
    color: "from-blue-500 to-blue-600",
    description: "Announce new versions and major releases",
  },
  {
    value: "news" as const,
    label: "News",
    icon: "📰",
    color: "from-purple-500 to-purple-600",
    description: "Share company news and announcements",
  },
  {
    value: "update" as const,
    label: "Update",
    icon: "🔔",
    color: "from-amber-500 to-orange-600",
    description: "General updates and notifications",
  },
];

const EXAMPLE_CONTENT = {
  changelog: `<h2>What's New</h2>
<ul>
  <li><strong>New Feature:</strong> Advanced genetic analysis tools</li>
  <li><strong>Improvement:</strong> Faster simulation processing</li>
  <li><strong>Bug Fix:</strong> Resolved trait calculator issue</li>
</ul>
<p>Check out the full changelog for more details.</p>`,
  release: `<h2>Version 2.0 is Here!</h2>
<p>We're excited to announce the release of Zygotrix 2.0, packed with powerful new features:</p>
<ul>
  <li>Enhanced polygenic score calculations</li>
  <li>Improved visualization tools</li>
  <li>New trait registry management</li>
</ul>
<p>Try it out today and let us know what you think!</p>`,
  news: `<h2>Exciting News!</h2>
<p>We're thrilled to share some important updates from the Zygotrix team.</p>
<p>Stay tuned for more announcements coming soon!</p>`,
  update: `<h2>Important Update</h2>
<p>We wanted to keep you informed about the latest developments at Zygotrix.</p>
<p>Thank you for being part of our community!</p>`,
};

const AdminNewsletterPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selection state
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Email composition state
  const [templateType, setTemplateType] =
    useState<SendNewsletterRequest["template_type"]>("changelog");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const isAdmin =
    currentUser?.user_role === "admin" ||
    currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isAdmin) {
      fetchSubscriptions();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Set example content when template type changes
    setContent(EXAMPLE_CONTENT[templateType]);
  }, [templateType]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterApi.getAllSubscriptions();
      setSubscriptions(response.subscriptions);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch subscriptions";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailSelection = (email: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedEmails(newSelected);
    setSelectAll(newSelected.size === subscriptions.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(subscriptions.map((sub) => sub.email)));
    }
    setSelectAll(!selectAll);
  };

  const handleSendNewsletter = async () => {
    if (selectedEmails.size === 0) {
      setError("Please select at least one recipient");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject line");
      return;
    }

    if (!content.trim()) {
      setError("Please enter email content");
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccessMessage(null);

      const result = await newsletterApi.sendNewsletter({
        recipient_emails: Array.from(selectedEmails),
        template_type: templateType,
        subject: subject.trim(),
        content: content.trim(),
      });

      setSuccessMessage(
        `Successfully sent ${result.success} email(s)${
          result.failed > 0 ? `, ${result.failed} failed` : ""
        }`
      );

      // Clear form after successful send
      setSelectedEmails(new Set());
      setSelectAll(false);
      setSubject("");
      setContent(EXAMPLE_CONTENT[templateType]);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send newsletter";
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-slate-400">
              You need admin privileges to access this page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Newsletter Management
            </h1>
            <p className="text-slate-400 mt-1">
              Send emails to your newsletter subscribers
            </p>
          </div>
          <div className="text-sm text-slate-400">
            {subscriptions.length} subscriber{subscriptions.length !== 1 && "s"}
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Subscribers */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Select Recipients
                </h2>
                <span className="text-sm text-slate-400">
                  {selectedEmails.size} selected
                </span>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500"
                      />
                      <span className="text-sm text-slate-300">
                        Select All
                      </span>
                    </label>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {subscriptions.map((sub) => (
                      <label
                        key={sub._id}
                        className="flex items-center gap-2 p-2 hover:bg-slate-700/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmails.has(sub.email)}
                          onChange={() => toggleEmailSelection(sub.email)}
                          className="rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500"
                        />
                        <span className="text-sm text-slate-300 truncate">
                          {sub.email}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Email Composer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Choose Template
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATE_TYPES.map((template) => (
                  <button
                    key={template.value}
                    onClick={() => setTemplateType(template.value)}
                    className={`relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all ${
                      templateType === template.value
                        ? "border-white bg-gradient-to-br " + template.color
                        : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {template.label}
                        </h3>
                        <p
                          className={`text-xs mt-1 ${
                            templateType === template.value
                              ? "text-white/80"
                              : "text-slate-400"
                          }`}
                        >
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Content */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Email Content
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message Content (HTML supported)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter email content..."
                    rows={12}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition-colors"
                  >
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                  <button
                    onClick={handleSendNewsletter}
                    disabled={sending || selectedEmails.size === 0}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Send to {selectedEmails.size} Recipient
                        {selectedEmails.size !== 1 && "s"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="mt-6 border border-slate-600 rounded-lg p-4 bg-slate-900">
                  <h3 className="text-sm font-semibold text-slate-400 mb-3">
                    Preview
                  </h3>
                  <div className="bg-white rounded p-6 text-slate-800">
                    <h2 className="text-2xl font-bold mb-4">{subject}</h2>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminNewsletterPage;
