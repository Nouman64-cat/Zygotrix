import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import ConfirmationModal from "../components/universal/ConfirmationModal";
import * as newsletterApi from "../services/newsletter.api";
import type {
  SendNewsletterRequest,
  NewsletterSubscriber,
  SystemUser,
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
import useDocumentTitle from "../hooks/useDocumentTitle";

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
  {
    value: "marketing" as const,
    label: "Marketing",
    icon: HiSparkles,
    color: "bg-gradient-to-r from-pink-500 to-rose-500",
    hoverColor: "hover:from-pink-600 hover:to-rose-600",
    borderColor: "border-pink-500",
    textColor: "text-pink-500",
    description: "Promotional & registration invite",
  },
];

const EXAMPLE_CONTENT: Record<string, string> = {
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
  marketing: `<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #10b981; margin-bottom: 10px;">🧬 Unlock the Power of Genetics</h1>
  <p style="font-size: 18px; color: #6b7280;">Join Zygotrix and Transform Your Understanding of DNA</p>
</div>

<p>Dear Future Geneticist,</p>

<p>Are you ready to dive into the fascinating world of genetics? <strong>Zygotrix</strong> is the ultimate interactive platform designed to make learning genetics intuitive, engaging, and fun!</p>

<h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">🚀 Why Choose Zygotrix?</h2>

<div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); padding: 20px; border-radius: 12px; margin: 20px 0;">
  <h3 style="color: #059669; margin-top: 0;">✨ Interactive Simulations</h3>
  <p>Run genetic crosses with our powerful simulation engine. Visualize inheritance patterns, Punnett squares, and phenotype distributions in real-time.</p>
  
  <h3 style="color: #059669;">📊 Advanced Analytics</h3>
  <p>Get detailed insights with our polygenic score calculations, trait analysis tools, and comprehensive genetic breakdowns.</p>
  
  <h3 style="color: #059669;">🤖 AI-Powered Learning</h3>
  <p>Meet <strong>Zigi</strong>, your personal genetics tutor! Ask questions, get explanations, and deepen your understanding with our intelligent chatbot.</p>
  
  <h3 style="color: #059669;">🔬 Extensive Trait Library</h3>
  <p>Explore our comprehensive database of genetic traits, from eye color to complex polygenic conditions.</p>
</div>

<h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">📈 What Our Users Are Saying</h2>

<blockquote style="background: #f3f4f6; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; font-style: italic;">
  "Zygotrix completely changed how I understand genetics. The simulations are incredible and Zigi is always there to help!"
  <br><strong>— Sarah M., Biology Student</strong>
</blockquote>

<blockquote style="background: #f3f4f6; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; font-style: italic;">
  "As a teacher, Zygotrix has become an essential tool in my classroom. My students are more engaged than ever!"
  <br><strong>— Dr. James K., Genetics Professor</strong>
</blockquote>

<h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">🎁 Join Today and Get:</h2>

<ul style="font-size: 16px; line-height: 2;">
  <li>✅ <strong>Free Access</strong> to all basic features</li>
  <li>✅ <strong>Unlimited Simulations</strong> to run genetic crosses</li>
  <li>✅ <strong>AI Chatbot</strong> for 24/7 learning assistance</li>
  <li>✅ <strong>Personal Dashboard</strong> to track your progress</li>
  <li>✅ <strong>Community Access</strong> to connect with fellow learners</li>
</ul>

<div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; margin: 30px 0;">
  <h2 style="color: white; margin-bottom: 15px;">Ready to Start Your Genetics Journey?</h2>
  <p style="color: #d1fae5; margin-bottom: 20px;">Creating your account takes less than 2 minutes!</p>
  <a href="https://zygotrix.com/signup" style="display: inline-block; background: white; color: #059669; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">🧬 Create Your Free Account</a>
</div>

<p>Have questions? Our team is here to help! Simply reply to this email or visit our FAQ page.</p>

<p>We can't wait to welcome you to the Zygotrix family!</p>

<p style="margin-top: 30px;">
  Warm regards,<br>
  <strong>The Zygotrix Team</strong><br>
  <em style="color: #6b7280;">Empowering the next generation of geneticists</em>
</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

<p style="text-align: center; color: #9ca3af; font-size: 12px;">
  © 2024 Zygotrix. All rights reserved.<br>
  <a href="https://zygotrix.com" style="color: #10b981;">zygotrix.com</a>
</p>`,
};

const AdminNewsletterPage: React.FC = () => {
  useDocumentTitle("Newsletter Manager");

  const { user: currentUser } = useAuth();
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "newsletter" | "system">("all");

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    email: string;
  }>({ isOpen: false, email: "" });

  // Selection state
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  
  // Custom email input state
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [customEmails, setCustomEmails] = useState<string[]>([]);

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
          } catch (error) {
            console.log("Error restoring selection:", error);
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
      fetchRecipients();
    }
  }, [isAdmin]);

  useEffect(() => {
    setContent(EXAMPLE_CONTENT[templateType]);
  }, [templateType]);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterApi.getAllRecipients();
      setNewsletterSubscribers(response.newsletter_subscribers);
      setSystemUsers(response.system_users);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch recipients";
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
    const filtered = filteredRecipients;
    if (selectedEmails.size === filtered.length && filtered.length > 0) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filtered.map((recipient) => recipient.email)));
    }
  };

  // Custom email helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const addCustomEmail = () => {
    const email = customEmailInput.trim().toLowerCase();
    
    if (!email) {
      setError("Please enter an email address");
      return;
    }
    
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (customEmails.includes(email) || selectedEmails.has(email)) {
      setError("This email is already added");
      return;
    }
    
    setCustomEmails((prev) => [...prev, email]);
    setSelectedEmails((prev) => new Set([...prev, email]));
    setCustomEmailInput("");
    setError(null);
  };

  const addMultipleEmails = (emailsText: string) => {
    // Split by comma, semicolon, newline, or space
    const emails = emailsText
      .split(/[,;\n\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && isValidEmail(e));
    
    if (emails.length === 0) {
      setError("No valid emails found");
      return;
    }
    
    const newCustomEmails: string[] = [];
    const newSelectedEmails = new Set(selectedEmails);
    
    emails.forEach((email) => {
      if (!customEmails.includes(email) && !newSelectedEmails.has(email)) {
        newCustomEmails.push(email);
        newSelectedEmails.add(email);
      }
    });
    
    if (newCustomEmails.length === 0) {
      setError("All emails are already added");
      return;
    }
    
    setCustomEmails((prev) => [...prev, ...newCustomEmails]);
    setSelectedEmails(newSelectedEmails);
    setCustomEmailInput("");
    setError(null);
    setSuccessMessage(`Added ${newCustomEmails.length} email(s)`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const removeCustomEmail = (email: string) => {
    setCustomEmails((prev) => prev.filter((e) => e !== email));
    setSelectedEmails((prev) => {
      const newSet = new Set(prev);
      newSet.delete(email);
      return newSet;
    });
  };

  const handleSendNewsletter = async () => {
    if (selectedEmails.size === 0) {
      setError("Please select at least one recipient or add a custom email");
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
      setNewsletterSubscribers((prev) => prev.filter((sub) => sub.email !== email));

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

 type Recipient = (NewsletterSubscriber | SystemUser) & {
    displayName?: string;
  };

  const allRecipients: Recipient[] = [
    ...newsletterSubscribers.map(sub => ({ ...sub, displayName: sub.email })),
    ...systemUsers.map(user => ({
      ...user,
      displayName: user.full_name ? `${user.full_name} (${user.email})` : user.email
    }))
  ];

  const getFilteredRecipients = (): Recipient[] => {
    let recipients: Recipient[] = [];

    if (activeTab === "all") {
      recipients = allRecipients;
    } else if (activeTab === "newsletter") {
      recipients = newsletterSubscribers.map(sub => ({ ...sub, displayName: sub.email }));
    } else {
      recipients = systemUsers.map(user => ({
        ...user,
        displayName: user.full_name ? `${user.full_name} (${user.email})` : user.email
      }));
    }

    return recipients.filter((recipient) =>
      recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipient.displayName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredRecipients = getFilteredRecipients();

  const selectAllChecked =
    filteredRecipients.length > 0 &&
    selectedEmails.size === filteredRecipients.length;

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Newsletter Manager
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Compose and send emails to subscribers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <MdPeople className="w-5 h-5 text-gray-400 dark:text-slate-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {newsletterSubscribers.length + systemUsers.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-slate-400">total recipients</span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MdCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MdError className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-4">
          {/* Left Sidebar - Recipients */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Recipients
                  </h2>
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium">
                    {selectedEmails.size} selected
                  </span>
                </div>

                {/* Search */}

                                {/* Tabs */}
                <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      activeTab === "all"
                        ? "bg-emerald-500 text-white"
                        : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    All ({newsletterSubscribers.length + systemUsers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("newsletter")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      activeTab === "newsletter"
                        ? "bg-emerald-500 text-white"
                        : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Newsletter ({newsletterSubscribers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("system")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      activeTab === "system"
                        ? "bg-emerald-500 text-white"
                        : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Users ({systemUsers.length})
                  </button>
                </div>

                <div className="relative">
                  <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Select All */}
                <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-gray-500 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300">
                    Select all ({filteredRecipients.length})
                  </span>
                </label>
              </div>

              {/* Recipient List */}
              <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <BiLoaderAlt className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MdPeople className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">
                      {searchTerm ? "No matches found" : "No recipients yet"}
                    </p>
                  </div>
                ) : (
                  filteredRecipients.map((recipient) => (
                    <div
                      key={recipient._id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700/50 last:border-0 group"
                    >
                      <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmails.has(recipient.email)}
                          onChange={() => toggleEmailSelection(recipient.email)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600 dark:text-slate-300 truncate group-hover:text-gray-900 dark:group-hover:text-white">
                              {recipient.displayName || recipient.email}
                            </p>
                            {recipient.type === "newsletter_subscriber" ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-xs font-medium flex-shrink-0">
                                Newsletter
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-xs font-medium flex-shrink-0">
                                User
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                       {recipient.type === "newsletter_subscriber" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(recipient.email);
                          }}
                          disabled={deletingEmail === recipient.email}
                          className="flex-shrink-0 p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Unsubscribe this email"
                        >
                          {deletingEmail === recipient.email ? (
                            <BiLoaderAlt className="w-4 h-4 animate-spin" />
                          ) : (
                            <MdDelete className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Custom Email Section */}
            <div className="mt-4 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MdEmail className="w-4 h-4 text-pink-500" />
                  Add Custom Emails
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Send to any email address
                </p>
              </div>
              
              <div className="p-4 space-y-3">
                {/* Email Input */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    value={customEmailInput}
                    onChange={(e) => setCustomEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customEmailInput.includes(",") || customEmailInput.includes(";") || customEmailInput.includes(" ")) {
                          addMultipleEmails(customEmailInput);
                        } else {
                          addCustomEmail();
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customEmailInput.includes(",") || customEmailInput.includes(";") || customEmailInput.includes(" ")) {
                        addMultipleEmails(customEmailInput);
                      } else {
                        addCustomEmail();
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Add
                  </button>
                </div>
                
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  💡 Tip: Paste multiple emails separated by commas, semicolons, or spaces
                </p>
                
                {/* Custom Emails List */}
                {customEmails.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                        Custom emails ({customEmails.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          customEmails.forEach((email) => {
                            setSelectedEmails((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(email);
                              return newSet;
                            });
                          });
                          setCustomEmails([]);
                        }}
                        className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {customEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 rounded-full text-xs"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeCustomEmail(email)}
                            className="p-0.5 hover:bg-pink-200 dark:hover:bg-pink-500/30 rounded-full transition-colors"
                          >
                            <MdClose className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Email Composer */}
          <div className="lg:col-span-9 space-y-4">
            {/* Template Selection */}
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <HiSparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
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
                          ? `${template.borderColor} bg-gray-50 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 shadow-lg`
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-gray-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? template.color
                              : "bg-gray-100 dark:bg-slate-700"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              isSelected ? "text-white" : "text-gray-500 dark:text-slate-400"
                            }`}
                          />
                        </div>
                        <h3
                          className={`text-sm font-semibold ${
                            isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-slate-300"
                          }`}
                        >
                          {template.label}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
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
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Compose Email
              </h2>

              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter a compelling subject line..."
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400">
                      Email Content
                    </label>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setEditMode("visual")}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          editMode === "visual"
                            ? "bg-emerald-500 text-white"
                            : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
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
                            : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
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
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  ) : (
                    <div className="border-2 border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 flex-wrap">
                        {/* Headings */}
                        <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-600">
                          <button
                            type="button"
                            onClick={() => insertHeading(1)}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Heading 1"
                          >
                            <span className="text-xs font-bold">H1</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertHeading(2)}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Heading 2"
                          >
                            <span className="text-xs font-bold">H2</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertHeading(3)}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Heading 3"
                          >
                            <span className="text-xs font-bold">H3</span>
                          </button>
                        </div>

                        {/* Text Formatting */}
                        <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-600">
                          <button
                            type="button"
                            onClick={() => executeCommand("bold")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Bold"
                          >
                            <MdFormatBold className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("italic")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Italic"
                          >
                            <MdFormatItalic className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("underline")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Underline"
                          >
                            <MdFormatUnderlined className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Lists */}
                        <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-600">
                          <button
                            type="button"
                            onClick={() => executeCommand("insertUnorderedList")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Bullet List"
                          >
                            <MdFormatListBulleted className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("insertOrderedList")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
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
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Insert Link"
                          >
                            <MdLink className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand("formatBlock", "<p>")}
                            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors text-xs font-medium"
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
                        className="w-full min-h-[250px] max-h-[400px] px-4 py-3 bg-white text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none overflow-auto"
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
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
