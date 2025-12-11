import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import ConfirmationModal from "../components/universal/ConfirmationModal";
import * as newsletterApi from "../services/newsletter.api";
import type {
  NewsletterSubscription,
  SendNewsletterRequest,
} from "../services/newsletter.api";
import {
  MdEmail,
  MdSend,
  MdCheckCircle,
  MdError,
  MdPeople,
  MdClose,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdLink,
  MdDelete,
} from "react-icons/md";
import {
  FaRocket,
  FaNewspaper,
  FaBell,
  FaClipboardList,
} from "react-icons/fa";
import { BiLoaderAlt } from "react-icons/bi";
import { HiSparkles } from "react-icons/hi";

const TEMPLATE_TYPES = [
  {
    value: "changelog" as const,
    label: "Changelog",
    icon: FaClipboardList,
    color: "bg-emerald-500",
    hoverColor: "hover:bg-emerald-600",
    borderColor: "border-emerald-500",
    textColor: "text-emerald-500",
    description: "Product updates & improvements",
  },
  {
    value: "release" as const,
    label: "Release",
    icon: FaRocket,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
    borderColor: "border-blue-500",
    textColor: "text-blue-500",
    description: "New versions & features",
  },
  {
    value: "news" as const,
    label: "News",
    icon: FaNewspaper,
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
    borderColor: "border-purple-500",
    textColor: "text-purple-500",
    description: "Company announcements",
  },
  {
    value: "update" as const,
    label: "Update",
    icon: FaBell,
    color: "bg-amber-500",
    hoverColor: "hover:bg-amber-600",
    borderColor: "border-amber-500",
    textColor: "text-amber-500",
    description: "General notifications",
  },
];

const EXAMPLE_CONTENT = {
  changelog: `<h2>What's New in This Update</h2>
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
  news: `<h2>Exciting News from Zygotrix!</h2>
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
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    email: string;
  }>({ isOpen: false, email: "" });

  // Selection state
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Email composition state
  const [templateType, setTemplateType] =
    useState<SendNewsletterRequest["template_type"]>("changelog");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [editMode, setEditMode] = useState<"code" | "visual">("visual");
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Initialize editor content on mount and template change
  React.useEffect(() => {
    if (editorRef.current && editMode === "visual") {
      // Only update if editor is empty or content is different
      if (editorRef.current.innerHTML !== content) {
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

        editorRef.current.innerHTML = content;

        // Restore cursor position if there was one
        if (range && editorRef.current.contains(range.startContainer)) {
          try {
            selection?.removeAllRanges();
            selection?.addRange(range);
          } catch (e) {
            // Ignore errors when restoring selection
          }
        }
      }
    }
  }, [templateType, editMode]); // Only when template or mode changes

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const insertHeading = (level: number) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const heading = document.createElement(`h${level}`);

      // If there's selected text, use it
      if (!selection.isCollapsed) {
        heading.textContent = selection.toString();
        range.deleteContents();
        range.insertNode(heading);
      } else {
        // Otherwise create an empty heading
        heading.textContent = `Heading ${level}`;
        range.insertNode(heading);

        // Move cursor to end of heading
        range.setStartAfter(heading);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
    }
  };

  const isAdmin =
    currentUser?.user_role === "admin" ||
    currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isAdmin) {
      fetchSubscriptions();
    }
  }, [isAdmin]);

  useEffect(() => {
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
  };

  const toggleSelectAll = () => {
    const filtered = filteredSubscriptions;
    if (selectedEmails.size === filtered.length && filtered.length > 0) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filtered.map((sub) => sub.email)));
    }
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

      setSelectedEmails(new Set());
      setSubject("");
      setContent(EXAMPLE_CONTENT[templateType]);

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send newsletter";
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteClick = (email: string) => {
    setConfirmModal({ isOpen: true, email });
  };

  const handleConfirmDelete = async () => {
    const email = confirmModal.email;

    try {
      setDeletingEmail(email);
      setError(null);

      await newsletterApi.unsubscribeFromNewsletter(email);

      // Remove from list
      setSubscriptions((prev) => prev.filter((sub) => sub.email !== email));

      // Remove from selection if selected
      if (selectedEmails.has(email)) {
        const newSelected = new Set(selectedEmails);
        newSelected.delete(email);
        setSelectedEmails(newSelected);
      }

      setSuccessMessage(`Successfully unsubscribed ${email}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to unsubscribe email";
      setError(errorMessage);
    } finally {
      setDeletingEmail(null);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectAllChecked =
    filteredSubscriptions.length > 0 &&
    selectedEmails.size === filteredSubscriptions.length;

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
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

  const selectedTemplate = TEMPLATE_TYPES.find((t) => t.value === templateType);

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${selectedTemplate?.color}`}>
              <MdEmail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Newsletter Manager
              </h1>
              <p className="text-sm text-slate-400">
                Compose and send emails to subscribers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
            <MdPeople className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-white">
              {subscriptions.length}
            </span>
            <span className="text-sm text-slate-400">subscribers</span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MdCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-emerald-400 text-sm">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-400"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MdError className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-400"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-4">
          {/* Left Sidebar - Recipients */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-700 bg-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-white">
                    Recipients
                  </h2>
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
                    {selectedEmails.size} selected
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Select All */}
                <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300">
                    Select all ({filteredSubscriptions.length})
                  </span>
                </label>
              </div>

              {/* Subscriber List */}
              <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <BiLoaderAlt className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ) : filteredSubscriptions.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MdPeople className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      {searchTerm ? "No matches found" : "No subscribers yet"}
                    </p>
                  </div>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 border-b border-slate-700/50 last:border-0 group"
                    >
                      <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmails.has(sub.email)}
                          onChange={() => toggleEmailSelection(sub.email)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300 truncate group-hover:text-white">
                            {sub.email}
                          </p>
                        </div>
                      </label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(sub.email);
                        }}
                        disabled={deletingEmail === sub.email}
                        className="flex-shrink-0 p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Unsubscribe this email"
                      >
                        {deletingEmail === sub.email ? (
                          <BiLoaderAlt className="w-4 h-4 animate-spin" />
                        ) : (
                          <MdDelete className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Email Composer */}
          <div className="lg:col-span-9 space-y-4">
            {/* Template Selection */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <HiSparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-semibold text-white">
                  Email Template
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {TEMPLATE_TYPES.map((template) => {
                  const Icon = template.icon;
                  const isSelected = templateType === template.value;
                  return (
                    <button
                      key={template.value}
                      onClick={() => setTemplateType(template.value)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? `${template.borderColor} bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg`
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? template.color
                              : "bg-slate-700"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              isSelected ? "text-white" : "text-slate-400"
                            }`}
                          />
                        </div>
                        <h3
                          className={`text-sm font-semibold ${
                            isSelected ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {template.label}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500">
                        {template.description}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div
                            className={`w-2 h-2 rounded-full ${template.color}`}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Content */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white mb-4">
                Compose Email
              </h2>

              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter a compelling subject line..."
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-slate-400">
                      Email Content
                    </label>
                    <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setEditMode("visual")}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          editMode === "visual"
                            ? "bg-emerald-500 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Visual
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode("code")}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          editMode === "code"
                            ? "bg-emerald-500 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        HTML
                      </button>
                    </div>
                  </div>

                  {editMode === "code" ? (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter HTML content..."
                      rows={10}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  ) : (
                    <div className="border-2 border-slate-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-1 p-2 bg-slate-700 border-b border-slate-600 flex-wrap">
                        {/* Headings */}
                        <div className="flex items-center gap-1 pr-2 border-r border-slate-600">
                          <button
                            type="button"
                            onClick={() => insertHeading(1)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Heading 1"
                          >
                            <span className="text-xs font-bold">H1</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertHeading(2)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Heading 2"
                          >
                            <span className="text-xs font-bold">H2</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertHeading(3)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Heading 3"
                          >
                            <span className="text-xs font-bold">H3</span>
                          </button>
                        </div>

                        {/* Text Formatting */}
                        <div className="flex items-center gap-1 pr-2 border-r border-slate-600">
                          <button
                            type="button"
                            onClick={() => executeCommand("bold")}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Bold"
                          >
                            <MdFormatBold className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("italic")}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Italic"
                          >
                            <MdFormatItalic className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("underline")}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Underline"
                          >
                            <MdFormatUnderlined className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Lists */}
                        <div className="flex items-center gap-1 pr-2 border-r border-slate-600">
                          <button
                            type="button"
                            onClick={() => executeCommand("insertUnorderedList")}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Bullet List"
                          >
                            <MdFormatListBulleted className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("insertOrderedList")}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Numbered List"
                          >
                            <MdFormatListNumbered className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Other */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const url = prompt("Enter URL:");
                              if (url) executeCommand("createLink", url);
                            }}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                            title="Insert Link"
                          >
                            <MdLink className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("formatBlock", "<p>")}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors text-xs font-medium"
                            title="Paragraph"
                          >
                            P
                          </button>
                        </div>
                      </div>

                      {/* Editor */}
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                          const target = e.target as HTMLDivElement;
                          setContent(target.innerHTML);
                        }}
                        className="w-full min-h-[250px] max-h-[400px] px-4 py-3 bg-white text-sm text-slate-800 focus:outline-none prose prose-sm max-w-none overflow-auto"
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {editMode === "visual"
                      ? "Use the toolbar to format your email. Click to edit, select text to format."
                      : "Write or paste HTML code. Switch to Visual mode to see the preview."}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSendNewsletter}
                    disabled={sending || selectedEmails.size === 0}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      selectedTemplate?.color
                    } ${
                      selectedTemplate?.hoverColor
                    } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {sending ? (
                      <>
                        <BiLoaderAlt className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MdSend className="w-5 h-5" />
                        Send to {selectedEmails.size} Recipient
                        {selectedEmails.size !== 1 && "s"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, email: "" })}
        onConfirm={handleConfirmDelete}
        title="Unsubscribe Email"
        message={`Are you sure you want to unsubscribe ${confirmModal.email} from the newsletter? This action cannot be undone.`}
        confirmText="Unsubscribe"
        cancelText="Cancel"
        type="danger"
        isLoading={deletingEmail === confirmModal.email}
      />
    </DashboardLayout>
  );
};

export default AdminNewsletterPage;
