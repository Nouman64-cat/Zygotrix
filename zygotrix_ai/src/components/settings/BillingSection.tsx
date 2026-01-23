import React from 'react';
import { MdStar, MdBolt, MdMic, MdAnalytics } from 'react-icons/md';
import { FaMicroscope, FaGraduationCap } from 'react-icons/fa';

export const BillingSection: React.FC = () => {
    return (
        <div className="space-y-8">
            {/* Current Plan */}
            <section>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                Free Tier
                            </span>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Basic access with standard rate limits
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Premium Plan */}
            <section>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Upgrade to PRO</h2>

                {/* Premium Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[1px]">
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8">
                        {/* Badge */}
                        <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                                <MdStar className="w-3 h-3" />
                                RECOMMENDED
                            </span>
                        </div>

                        {/* Plan Name */}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Zygotrix PRO</h3>

                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">Rs. 3,000</span>
                            <span className="text-gray-500 dark:text-gray-400">/month</span>
                        </div>

                        {/* Features */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <FaMicroscope className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Deep Research</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">200 queries/month - AI-powered research from your knowledge base</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                    <FaGraduationCap className="w-4 h-4 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Scholar Mode</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">50 queries/month - Comprehensive research with web search & synthesis</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <MdBolt className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Generous Usage Limits</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">10x more tokens per day for extended conversations</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                    <MdMic className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Advanced Voice Features</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Voice commands, dictation, and AI voice responses</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                    <MdAnalytics className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Advanced Analysis Tools</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">GWAS analysis, protein structure prediction, and more</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                    <MdStar className="w-4 h-4 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Priority Support</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Get help faster with dedicated support channels</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button
                            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 cursor-pointer"
                            onClick={() => alert('Payment integration coming soon!')}
                        >
                            Upgrade Now
                        </button>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            Cancel anytime. No questions asked.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked</h2>
                <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">What payment methods are accepted?</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">We accept all major credit/debit cards, JazzCash, Easypaisa, and bank transfers.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Can I cancel my subscription?</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Yes, you can cancel at any time. Your premium benefits will continue until the end of the billing period.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};
