import type { Metadata } from "next";
import DnaGeneratorClient from "../../../components/tools/DnaGeneratorClient";
import { SEO_KEYWORDS } from "../../../config/seo";

export const metadata: Metadata = {
    title: "Free DNA Sequence Generator - Create Random DNA & RNA Online | Zygotrix",
    description: "Generate random DNA sequences up to 10 million base pairs with customizable GC content. Free online DNA generator tool powered by high-performance C++ engine. Download DNA and RNA sequences instantly.",
    keywords: SEO_KEYWORDS.TOOLS,
    openGraph: {
        title: "Free DNA Sequence Generator - Zygotrix",
        description: "Generate random DNA sequences up to 10 million base pairs with customizable GC content. Powered by Zygotrix C++ Engine.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
};

export default function DnaGeneratorPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Zygotrix DNA Generator",
                        "applicationCategory": "EducationalApplication",
                        "operatingSystem": "Web Browser",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Generate random DNA sequences up to 10 million base pairs with customizable GC content. Free online DNA generator tool powered by high-performance C++ engine.",
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.8",
                            "ratingCount": "150"
                        },
                        "featureList": [
                            "Generate DNA sequences up to 10 million base pairs",
                            "Customize GC content from 0% to 100%",
                            "Automatic RNA transcription",
                            "Download sequences as text files",
                            "High-performance C++ engine",
                            "No registration required"
                        ]
                    })
                }}
            />
            <DnaGeneratorClient />
        </>
    );
}
