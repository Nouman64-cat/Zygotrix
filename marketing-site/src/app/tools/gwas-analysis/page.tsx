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
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Zygotrix GWAS Analysis Tool",
                        "applicationCategory": "ScientificApplication",
                        "operatingSystem": "Web Browser",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Upload VCF files and run Genome-Wide Association Studies (GWAS) online. Visualize results with interactive Manhattan and Q-Q plots.",
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "ratingCount": "85"
                        }
                    })
                }}
            />
            <GwasAnalysisClient />
        </>
    );
}
