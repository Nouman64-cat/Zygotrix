import type { Metadata } from "next";
import GwasAnalysisClient from "../../../components/tools/gwas/GwasAnalysisClient";
import { SEO_KEYWORDS } from "../../../config/seo";

export const metadata: Metadata = {
    title: "Free GWAS Analysis Tool - Manhattan & Q-Q Plots Online | Zygotrix",
    description: "Upload VCF files and run Genome-Wide Association Studies (GWAS) online. Visualize results with interactive Manhattan and Q-Q plots. Free bioinformatics tool.",
    keywords: [...SEO_KEYWORDS.TOOLS, "GWAS", "Manhattan Plot", "Q-Q Plot", "Bioinformatics", "Genetics Analysis"],
    openGraph: {
        title: "Free GWAS Analysis Tool - Zygotrix",
        description: "Run GWAS analysis on VCF files instantly. Visualize Manhattan and Q-Q plots.",
        type: "website",
    },
};

export default function GwasAnalysisPage() {
    return (
        <GwasAnalysisClient />
    );
}
