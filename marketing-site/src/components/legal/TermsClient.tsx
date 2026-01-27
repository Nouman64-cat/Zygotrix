"use client";

import React from "react";
import Link from "next/link";

const sections = [
    {
        title: "Acceptance of Terms",
        content: `By accessing or using Zygotrix ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.

These Terms of Service apply to all users of the Platform, including without limitation users who are browsers, researchers, customers, and contributors of content.`,
    },
    {
        title: "Use License",
        content: `Subject to your compliance with these Terms, Zygotrix grants you a limited, non-exclusive, non-transferable, revocable license to:

• Access and use the Platform for personal, educational, or research purposes
• Run genetic simulations and analyses using our tools
• Export and download your own simulation results
• Share your public projects with other users

This license does not include:

• Modification or copying of Platform materials for commercial redistribution
• Use of data mining, robots, or similar data gathering tools
• Reverse engineering or attempting to extract source code
• Removing any copyright or proprietary notations`,
    },
    {
        title: "User Accounts",
        content: `To access certain features of the Platform, you must register for an account. When you create an account, you agree to:

• Provide accurate, current, and complete information
• Maintain and promptly update your account information
• Maintain the security of your password and accept all risks of unauthorized access
• Immediately notify us of any unauthorized use of your account
• Take responsibility for all activities that occur under your account

We reserve the right to disable any user account at any time if we believe you have violated these Terms.`,
    },
    {
        title: "Data Collection, Recording, and Privacy",
        content: `By using Zygotrix, you explicitly acknowledge and agree that:

What We Record:
• Your complete account information including name, email, and registration details
• All contact form submissions, messages, and support communications
• Newsletter subscriptions and communication preferences
• Detailed activity logs including timestamps and geographic location
• All content you create (projects, simulations, research data, configurations)
• User interactions, session data, and platform usage statistics

Administrative Access and Monitoring:
• Platform administrators have full access to view and manage all user data
• Super administrators can view, modify, and delete user accounts and content
• Admin access is used for legitimate purposes including support, security, and platform maintenance
• All administrative actions are logged for security and audit purposes

Data Security Commitment:
• All user data is stored in encrypted, secure databases
• We implement industry-standard security measures (SSL/TLS encryption, secure authentication)
• Access to user data is restricted to authorized personnel only
• We conduct regular security audits and vulnerability assessments
• We maintain strict confidentiality protocols for all team members

Your Privacy Rights:
• You have the right to access, correct, or delete your personal data
• You may request a copy of all data we have collected about you
• You can unsubscribe from newsletters at any time
• You may deactivate your account and request data deletion

By continuing to use the Platform, you consent to our data collection practices as described in our Privacy Policy. If you do not agree to these data collection practices, you must immediately cease using the Platform.`,
    },
    {
        title: "Intellectual Property",
        content: `The Platform and its original content, features, and functionality are owned by Zygotrix and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.

Your Content: You retain ownership of any content you create using the Platform, including simulation configurations, trait definitions, and research projects. By posting content on Zygotrix, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content in connection with operating and promoting the Platform.

Our Content: All Zygotrix branding, logos, algorithms, documentation, and user interface designs remain our exclusive property.`,
    },
    {
        title: "Acceptable Use",
        content: `You agree not to use the Platform to:

• Violate any applicable laws or regulations
• Infringe upon the rights of others
• Submit false or misleading information
• Upload malicious code or attempt to compromise security
• Interfere with or disrupt the Platform or servers
• Attempt to gain unauthorized access to any part of the Platform
• Use the Platform for any unethical genetic research purposes
• Harass, abuse, or harm another person
• Impersonate another user or person
• Use the Platform in any way that could damage our reputation`,
    },
    {
        title: "Scientific Accuracy Disclaimer",
        content: `Zygotrix provides genetic simulation tools for educational and research purposes. While we strive for scientific accuracy:

• Simulations are models and may not perfectly reflect real-world genetics
• Results should be validated against empirical data before making decisions
• The Platform is not intended for clinical or diagnostic use
• Users should consult qualified geneticists for professional advice
• We do not guarantee the accuracy of any simulation results

You acknowledge that genetic inheritance is complex and that our tools provide approximations based on current scientific understanding.`,
    },
    {
        title: "Limitation of Liability",
        content: `To the fullest extent permitted by law, Zygotrix shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation:

• Loss of profits, data, or other intangible losses
• Damage to your computer system or loss of data
• Any failure or delay in Platform availability
• Any errors or inaccuracies in simulations or results
• Any unauthorized access to or use of your account

Our total liability for any claims arising from your use of the Platform shall not exceed the amount you paid to us in the preceding 12 months.`,
    },
    {
        title: "Termination",
        content: `We may terminate or suspend your access to the Platform immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms.

Upon termination:

• Your right to use the Platform will immediately cease
• We may delete your account and associated data
• All provisions of these Terms which should survive termination shall survive

You may terminate your account at any time by contacting us at support@zygotrix.io.`,
    },
    {
        title: "Changes to Terms",
        content: `We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.

By continuing to access or use the Platform after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Platform.`,
    },
    {
        title: "Governing Law",
        content: `These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.

Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with applicable arbitration rules, unless you are entitled to bring claims in a small claims court.`,
    },
    {
        title: "Contact Information",
        content: `For any questions about these Terms of Service, please contact us:

Email: legal@zygotrix.io
Support: support@zygotrix.io

We aim to respond to all inquiries within 5 business days.`,
    },
];

const TermsClient: React.FC = () => {
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
                <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-60 left-20 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
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
                        Terms of Service
                    </h1>

                    <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Please read these terms carefully before using Zygotrix. By using
                        our platform, you agree to be bound by these terms.
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

                {/* Agreement Notice */}
                <div className="mt-12 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                By using Zygotrix, you acknowledge:
                            </h3>
                            <ul className="text-slate-600 dark:text-slate-300 space-y-2">
                                <li className="flex items-start gap-2">
                                    <svg
                                        className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
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
                                    <span>
                                        You have read and understood these Terms of Service
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg
                                        className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
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
                                    <span>You agree to be bound by these terms and conditions</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg
                                        className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
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
                                    <span>
                                        You will use the Platform responsibly and ethically
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="mt-16 text-center">
                    <div className="inline-flex flex-wrap justify-center gap-4">
                        <Link
                            href="/privacy"
                            className="inline-flex items-center justify-center rounded-full border-2 border-emerald-200 dark:border-emerald-400/50 bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300 transition-all hover:border-emerald-400 hover:bg-white dark:hover:bg-slate-700 hover:scale-105"
                        >
                            View Privacy Policy
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

export default TermsClient;
