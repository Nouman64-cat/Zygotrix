
import React from 'react';
import Hero from '../../components/ai/Hero';
import VideoSection from '../../components/ai/VideoSection';
import Features from '../../components/ai/Features';

import Link from 'next/link';
import type { Metadata } from 'next';
import { SEO_KEYWORDS } from '../../config/seo';

export const metadata: Metadata = {
    title: 'Zygotrix AI - Your Expert AI Geneticist',
    description: 'Transform your genetic research with your personal AI Geneticist. Perform deep literature reviews, automated GWAS analysis, and data visualization in seconds.',
    keywords: SEO_KEYWORDS.AI,
};

export default function AiPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 selection:bg-emerald-500 selection:text-white">
            <Hero />
            <VideoSection />
            <Features />

            {/* Call to Action Section (Bonus) */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-90 dark:opacity-80" />
                <div className="absolute inset-0 bg-[url('https://zygotrix.fra1.cdn.digitaloceanspaces.com/cdn/patterns/circuit-board.svg')] opacity-10" />
                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Ready to Evolve Your Infrastructure?
                    </h2>
                    <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
                        Join 500+ forward-thinking companies building the future with Zygotrix's biological AI engine.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="https://ai.zygotrix.com/register">
                            <button className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors shadow-lg hover:shadow-xl hover:scale-105 transform duration-200">
                                Get Started Now
                            </button>
                        </Link>
                        <Link href="https://calendly.com/working-nouman-ejaz/zygotrix-demo" target="_blank" rel="noopener noreferrer">
                            <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
                                Schedule Demo
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
