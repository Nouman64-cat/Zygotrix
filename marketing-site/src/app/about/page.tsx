import type { Metadata } from "next";
import AboutClient from "../../components/about/AboutClient";
import { SEO_KEYWORDS } from "../../config/seo";

export const metadata: Metadata = {
    title: "About Zygotrix - Founder Nouman Ejaz",
    description: "Meet the founder of Zygotrix, Nouman Ejaz. Building reliable genetic analysis tools.",
    openGraph: {
        title: "About Zygotrix",
        description: "Nouman Ejaz, Founder & Creator.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
    keywords: SEO_KEYWORDS.ABOUT,
};

export default function AboutPage() {
    return <AboutClient />;
}
