
import React from 'react';
import type { Metadata } from 'next';
import { SEO_KEYWORDS } from '../../config/seo';
import StudioHero from '../../components/studio/StudioHero';
import StudioFeatures from '../../components/studio/StudioFeatures';
import type { IconKey } from '../../components/universal/Icon';
import { STUDIO_URL } from '../../config';

export const metadata: Metadata = {
    title: 'Zygotrix Studio - Precision Breeding & Simulation',
    description: 'Design breeding programs, predict phenotypes, and map inheritance with our advanced simulation engine.',
    keywords: SEO_KEYWORDS.STUDIO,
};

const studioFeatureCards: { title: string; description: string; icon: IconKey; accent: string }[] = [
    {
        title: "Mendelian Inheritance",
        description:
            "Simulate dominant, recessive, and codominant traits with high-precision Punnett square logic engine.",
        icon: "dna",
        accent: "from-emerald-400 to-green-600",
    },
    {
        title: "Polygenic Traits",
        description:
            "Model complex traits controlled by multiple genes with additive effects and environmental variance.",
        icon: "network",
        accent: "from-blue-400 to-indigo-600",
    },
    {
        title: "Population Genetics",
        description:
            "Analyze allele frequencies, Hardy-Weinberg equilibrium, and genetic drift in simulated populations.",
        icon: "chart",
        accent: "from-purple-400 to-fuchsia-600",
    },
    {
        title: "Crispr Simulation",
        description:
            "Model gene editing outcomes and potential off-target effects with our predictive editing engine.",
        icon: "spark",
        accent: "from-amber-400 to-orange-600",
    },
    {
        title: "Secure Data",
        description: "Enterprise-grade security ensuring your genetic data remains private and protected.",
        icon: "shield",
        accent: "from-red-400 to-rose-600",
    },
    {
        title: "Multi-Omics",
        description: "Integrate genomics, transcriptomics, and proteomics data for holistic analysis.",
        icon: "layers",
        accent: "from-teal-400 to-cyan-600",
    }
];

export default function StudioPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-950">
            <StudioHero />
            <StudioFeatures cards={studioFeatureCards} />

            {/* Call to Action Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-6">
                        Ready to start your research?
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
                        Join thousands of researchers and students using Zygotrix Studio to simulate and analyze genetic data.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={`${STUDIO_URL}/signup`}
                            className="px-8 py-3.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30"
                        >
                            Get Started for Free
                        </a>
                        <a
                            href="https://calendly.com/working-nouman-ejaz/zygotrix-demo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-3.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                        >
                            Book a Demo
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}
