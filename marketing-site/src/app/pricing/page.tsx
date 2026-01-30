import type { Metadata } from "next";
import PricingClient from "../../components/pricing/PricingClient";
import { SEO_KEYWORDS } from "../../config/seo";

export const metadata: Metadata = {
    title: "Pricing - Zygotrix",
    description: "Simple, transparent pricing for genetics research tools. Choose the plan that fits your needs.",
    openGraph: {
        title: "Pricing - Zygotrix",
        description: "Simple, transparent pricing for genetics research tools. Choose the plan that fits your needs.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
    keywords: SEO_KEYWORDS.PRICING,
};

export default function PricingPage() {
    return <PricingClient />;
}
