import type { Metadata } from "next";
import DnaToProteinClient from "../../../components/tools/DnaToProteinClient";
import { SEO_KEYWORDS } from "../../../config/seo";

export const metadata: Metadata = {
    title: "Free DNA to Protein Translator - Codon to Amino Acid Converter | Zygotrix",
    description: "Free online DNA and RNA to protein sequence translator. Convert DNA to mRNA codons and amino acid sequences. See the Central Dogma in action - transcription and translation visualized.",
    keywords: SEO_KEYWORDS.TOOLS,
    openGraph: {
        title: "Free DNA to Protein Translator - Zygotrix",
        description: "Convert DNA and RNA to protein sequences and visualize the Central Dogma.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
};

export default function DnaToProteinPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Zygotrix DNA to Protein Translator",
                        "applicationCategory": "EducationalApplication",
                        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                        "description": "Convert DNA and RNA sequences to protein. Visualize codons and amino acids.",
                    })
                }}
            />
            <DnaToProteinClient />
        </>
    );
}
