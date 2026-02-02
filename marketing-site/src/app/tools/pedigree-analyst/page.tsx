import type { Metadata } from "next";
import PedigreeAnalystClient from "../../../components/tools/PedigreeAnalystClient";
import { SEO_KEYWORDS } from "../../../config/seo";

export const metadata: Metadata = {
    title: "AI Pedigree Analyst - Visual Family Tree Generator | Zygotrix",
    description: "Map genetic traits and track inheritance patterns with AI. Automatically generate pedigree charts from text descriptions. Detect Mendelian conflicts and carrier probabilities instantly.",
    keywords: SEO_KEYWORDS.TOOLS, // This now includes the specific pedigree keywords
    openGraph: {
        title: "AI Pedigree Analyst - Zygotrix",
        description: "Visualize family genetics instantly. Map traits, track carriers, and solve inheritance puzzles with our advanced AI engine.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"], // Use generic image for now or update later
    },
};

export default function PedigreeAnalystPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Zygotrix Pedigree Analyst",
                        "applicationCategory": "EducationalApplication",
                        "operatingSystem": "Web Browser",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Map genetic traits and track inheritance patterns with AI. Automatically generate pedigree charts from text descriptions.",
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "ratingCount": "85"
                        },
                        "featureList": [
                            "Auto-generate pedigrees from text",
                            "Visual family tree builder",
                            "Mendelian inheritance tracking",
                            "Carrier probability calculation",
                            "Conflict detection (Epistasis)",
                            "Export to image/PDF"
                        ]
                    })
                }}
            />
            <PedigreeAnalystClient />
        </>
    );
}
