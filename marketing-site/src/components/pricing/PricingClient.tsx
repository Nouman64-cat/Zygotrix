"use client";

import React from "react";
import { FaCheck, FaStar, FaMicroscope, FaGraduationCap } from "react-icons/fa";
import { MdBolt, MdMic, MdAnalytics } from "react-icons/md";
import { STUDIO_URL } from "../../config";

const PricingClient: React.FC = () => {
    const [isPakistan, setIsPakistan] = React.useState(true);

    React.useEffect(() => {
        const checkLocation = async () => {
            try {
                // Fetch country code by IP to support VPN users
                const response = await fetch('https://ipapi.co/country/');
                const country = await response.text();

                if (country && country.trim() !== 'PK') {
                    setIsPakistan(false);
                }
            } catch (error) {
                console.error("Failed to detect location, falling back to heuristic:", error);
                // Fallback to system timezone if API fails
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (tz !== "Asia/Karachi") {
                    setIsPakistan(false);
                }
            }
        };

        checkLocation();
    }, []);

    return (
        <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Choose the plan that fits your research needs. Upgrade or downgrade anytime.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Free Tier */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-shadow duration-300">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Free
                            </h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                                    {isPakistan ? "Rs. 0" : "$0"}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">/month</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Perfect for getting started with genomics research
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3">
                                <FaCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    Basic AI chat with standard rate limits
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <FaCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    DNA sequence generator
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <FaCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    Community access
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <FaCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    Basic analysis tools
                                </span>
                            </li>
                        </ul>

                        <a
                            href={`${STUDIO_URL}/signup`}
                            className="block w-full text-center py-3 px-6 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold transition-colors duration-200"
                        >
                            Get Started Free
                        </a>
                    </div>

                    {/* PRO Tier */}
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-emerald-500 p-8 hover:shadow-2xl transition-all duration-300">
                        {/* Recommended Badge */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-yellow-400 text-gray-900 shadow-lg">
                                <FaStar className="w-3 h-3" />
                                RECOMMENDED
                            </span>
                        </div>

                        <div className="h-full">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Zygotrix PRO
                                </h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-5xl font-bold text-emerald-500">
                                        {isPakistan ? "Rs. 3,000" : "$20"}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">/month</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Advanced features for serious researchers
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <FaMicroscope className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-gray-900 dark:text-white font-semibold block">
                                            Deep Research
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            200 queries/month - AI-powered research from your knowledge base
                                        </span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <FaGraduationCap className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-gray-900 dark:text-white font-semibold block">
                                            Scholar Mode
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            50 queries/month - Comprehensive research with web search
                                        </span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <MdBolt className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        <strong className="text-gray-900 dark:text-white">10x more tokens</strong> per day for extended conversations
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <MdMic className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Advanced voice features & AI responses
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <MdAnalytics className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        GWAS analysis & protein structure prediction
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <FaStar className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Priority support
                                    </span>
                                </li>
                            </ul>

                            <a
                                href={`${STUDIO_URL}/signup`}
                                className="block w-full text-center py-3.5 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-all duration-200 shadow-lg shadow-gray-900/25"
                            >
                                Upgrade to PRO
                            </a>

                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                                Cancel anytime. No questions asked.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                        Frequently Asked Questions
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                What payment methods do you accept?
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                We accept all major credit/debit cards, JazzCash, Easypaisa, and bank transfers for your convenience.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Can I cancel my subscription anytime?
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                Yes! You can cancel your PRO subscription at any time. Your premium benefits will continue until the end of your billing period.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                What happens if I exceed my monthly limits?
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your limits reset on the 1st of each month. If you need more queries before then, please contact our support team to discuss options.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingClient;
