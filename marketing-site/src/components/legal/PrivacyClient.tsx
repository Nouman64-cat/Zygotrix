"use client";

import React from "react";
import Link from "next/link";

const sections = [
    {
        title: "Information We Collect",
        content: `We collect information you provide directly to us, such as when you create an account, use our genetics simulation tools, or contact us for support. This may include:

• Account information (name, email address, password)
• Profile information (research interests, institutional affiliation)
• Usage data (simulations run, traits analyzed, projects created)
• Communication data (support requests, feedback)

We also automatically collect certain information when you use our platform, including device information, log data, and cookies.`,
    },
    {
        title: "Data Recording and Administrative Access",
        content: `IMPORTANT: We want to be transparent about our data collection and access practices:

Data We Record:
• All user account information (name, email, phone number, registration details)
• Contact form submissions (name, email, phone, messages, submission timestamps)
• Newsletter subscription data and preferences
• User activity logs, timestamps, and geographic location data
• All projects, simulations, and research data you create on our platform
• Communication history with our support team

Administrative Access:
Our super administrators have access to view, manage, and moderate all user data for the following legitimate purposes:
• Platform maintenance and technical support
• User account management and assistance
• Responding to contact form inquiries
• Security monitoring and fraud prevention
• Compliance with legal obligations
• Quality assurance and service improvement

Data Security Measures:
• All data is stored in secure, encrypted databases
• Administrative access is strictly limited to authorized personnel only
• All admin actions are logged and audited for security purposes
• We implement industry-standard security protocols (SSL/TLS encryption)
• Regular security audits and penetration testing
• Employee confidentiality agreements and data protection training

We take your privacy seriously and only access your data when necessary for the purposes stated above. We never sell, rent, or share your personal information with third parties for marketing purposes.`,
    },
    {
        title: "How We Use Your Information",
        content: `We use the information we collect to:

• Provide, maintain, and improve our genetics simulation platform
• Process and complete your simulations and analyses
• Send you technical notices, updates, and support messages
• Respond to your comments, questions, and requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions and abuse
• Personalize and improve your experience on Zygotrix`,
    },
    {
        title: "Information Sharing",
        content: `We do not sell, trade, or otherwise transfer your personal information to outside parties except in the following circumstances:

• With your consent or at your direction
• With service providers who assist in our operations
• To comply with legal obligations or protect our rights
• In connection with a merger, acquisition, or sale of assets
• In aggregated or de-identified form that cannot reasonably be used to identify you`,
    },
    {
        title: "Data Security",
        content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:

• Encryption of data in transit and at rest
• Regular security assessments and penetration testing
• Access controls and authentication requirements
• Employee training on data protection practices

However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
    },
    {
        title: "Your Rights and Choices",
        content: `Depending on your location, you may have certain rights regarding your personal information:

• Access and portability of your data
• Correction of inaccurate information
• Deletion of your account and associated data
• Objection to or restriction of certain processing
• Withdrawal of consent where applicable

To exercise these rights, please contact us at privacy@zygotrix.io.`,
    },
    {
        title: "Cookies and Tracking",
        content: `We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, though some features of our platform may not function properly if you disable them.

We use both session cookies (which expire when you close your browser) and persistent cookies (which remain on your device until deleted).`,
    },
    {
        title: "Children's Privacy",
        content: `Zygotrix is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you believe we have collected information from a child under 16, please contact us immediately.`,
    },
    {
        title: "Changes to This Policy",
        content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.`,
    },
    {
        title: "Contact Us",
        content: `If you have any questions about this Privacy Policy, please contact us at:

Email: privacy@zygotrix.io
Address: Zygotrix Research Labs

We will respond to your inquiry within 30 days.`,
    },
];

const PrivacyClient: React.FC = () => {
    return (
        <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 min-h-screen transition-colors duration-300">
            {/* Background Pattern */}
            <div className="pointer-events-none fixed inset-0 opacity-[0.02]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20px 20px, #10B981 1px, transparent 1px)`,
                        backgroundSize: "40px 40px",
                    }}
                />
            </div>

            {/* Gradient Orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-24">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 px-6 py-3 backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/30 mb-6">
                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse" />
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                            Legal
                        </span>
                    </div>

                    <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent sm:text-5xl mb-4">
                        Privacy Policy
                    </h1>

                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Your privacy is important to us. This policy explains how Zygotrix
                        collects, uses, and protects your personal information.
                    </p>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                        Last Updated: December 11, 2025
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-8">
                    {sections.map((section, index) => (
                        <div
                            key={section.title}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-8 shadow-lg shadow-slate-200/50 dark:shadow-slate-500/10 backdrop-blur-sm transition-all hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-500/30"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Hover gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-transparent to-teal-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                        {index + 1}
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                                        {section.title}
                                    </h2>
                                </div>

                                <div className="pl-12">
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div className="mt-16 text-center">
                    <div className="inline-flex flex-wrap justify-center gap-4">
                        <Link
                            href="/terms"
                            className="inline-flex items-center justify-center rounded-full border-2 border-emerald-200 dark:border-emerald-400/50 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300 transition-all hover:border-emerald-400 hover:bg-white dark:hover:bg-slate-700 hover:scale-105"
                        >
                            View Terms of Service
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyClient;
