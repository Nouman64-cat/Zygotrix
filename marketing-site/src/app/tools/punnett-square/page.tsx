import type { Metadata } from "next";
import PunnettSquareClient from "../../../components/tools/PunnettSquareClient";
import { SEO_KEYWORDS } from "../../../config/seo";

export const metadata: Metadata = {
    title: "Free Punnett Square Calculator - Genetics Cross Tool Online | Zygotrix",
    description: "Free online Punnett Square generator and calculator. Visualize genetic crosses, predict offspring genotypes and phenotypes, calculate inheritance ratios. Perfect for biology students and genetics education.",
    keywords: SEO_KEYWORDS.TOOLS,
    openGraph: {
        title: "Free Punnett Square Calculator - Zygotrix",
        description: "Visualize genetic crosses and calculate inheritance ratios with our free Punnett Square tool.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
};

export default function PunnettSquarePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Zygotrix Punnett Square Generator",
                        "applicationCategory": "EducationalApplication",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                    })
                }}
            />
            <PunnettSquareClient />
        </>
    );
}
