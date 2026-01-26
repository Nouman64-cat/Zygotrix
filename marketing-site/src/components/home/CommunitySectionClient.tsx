"use client";

import React from "react";
import Link from "next/link";
import { FaDiscord, FaGithub, FaUsers, FaComments, FaLightbulb, FaHandsHelping } from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";

const CommunitySectionClient: React.FC = () => {
    const communityFeatures = [
        {
            icon: FaComments,
            title: "Discussions",
            description: "Engage in meaningful conversations about genetics, share insights, and learn from experts in the field.",
            gradient: "from-[#1E3A8A] to-[#3B82F6]",
        },
        {
            icon: FaLightbulb,
            title: "Share Ideas",
            description: "Propose new features, share research findings, and collaborate on innovative genetics projects.",
            gradient: "from-[#3B82F6] to-[#10B981]",
        },
        {
            icon: FaHandsHelping,
            title: "Get Support",
            description: "Connect with fellow users and our team to get help with Zygotrix tools and genetics questions.",
            gradient: "from-[#10B981] to-[#059669]",
        },
    ];

    const socialLinks = [
        {
            name: "Discord",
            description: "Join our Discord server for real-time discussions and community events.",
            href: "https://discord.gg/5qtEfusv",
            icon: FaDiscord,
            color: "from-indigo-500 to-purple-500",
            buttonText: "Join Discord",
        },
        {
            name: "GitHub",
            description: "Contribute to Zygotrix, report issues, and explore our open-source projects.",
            href: "https://github.com/Nouman64-cat/Zygotrix",
            icon: FaGithub,
            color: "from-slate-700 to-slate-900",
            buttonText: "View GitHub",
        },
    ];

    return (
        <section className="relative bg-white dark:bg-gray-950 py-24 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-72 h-72 bg-[#3B82F6]/10 dark:bg-[#3B82F6]/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#10B981]/10 dark:bg-[#10B981]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
            </div>

            <div className="relative mx-auto max-w-7xl px-6">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 mb-6">
                        <FaUsers className="w-5 h-5 text-white" />
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white">
                            Community
                        </span>
                    </div>

                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Join Our <span className="text-emerald-500 dark:text-emerald-400">Growing Community</span>
                    </h2>

                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                        Connect with genetics enthusiasts, researchers, and developers from around the world.
                        Share knowledge, get help, and be part of the Zygotrix journey.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid gap-6 md:grid-cols-3 mb-16">
                    {communityFeatures.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/40 dark:shadow-slate-950/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Icon */}
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 dark:bg-gray-700 text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                                <feature.icon className="w-6 h-6" />
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Hover glow effect */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
                        </div>
                    ))}
                </div>

                {/* Social Links Cards */}
                <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mb-12">
                    {socialLinks.map((social) => (
                        <div
                            key={social.name}
                            className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gray-900 dark:bg-gray-700 text-white shadow-lg">
                                    <social.icon className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                        {social.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        {social.description}
                                    </p>
                                    <a
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                                    >
                                        <span>{social.buttonText}</span>
                                        <HiOutlineSparkles className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Card */}
                <div className="relative max-w-3xl mx-auto">
                    <div className="relative bg-gray-900 rounded-3xl p-8 md:p-10 shadow-2xl shadow-gray-900/20 dark:shadow-black/40 overflow-hidden">
                        {/* Background decorations */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-4 right-8 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                            <div className="absolute bottom-4 left-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                        </div>

                        <div className="relative text-center">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                Ready to <span className="text-emerald-400">Connect?</span>
                            </h3>
                            <p className="text-gray-300 text-base md:text-lg mb-6 max-w-xl mx-auto">
                                Explore the full community page to learn more about events, contributions, and how to get involved.
                            </p>

                            <a
                                href="https://discord.gg/5qtEfusv"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                            >
                                <span>Explore Community</span>
                                <FaUsers className="w-5 h-5 text-emerald-600" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CommunitySectionClient;
