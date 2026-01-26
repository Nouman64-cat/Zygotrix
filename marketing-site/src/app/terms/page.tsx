import type { Metadata } from "next";
import TermsClient from "../../components/legal/TermsClient";

export const metadata: Metadata = {
    title: "Terms of Service - Zygotrix",
    description: "Zygotrix terms of service and usage agreement.",
    openGraph: {
        title: "Terms of Service - Zygotrix",
        description: "Zygotrix terms of service and usage agreement.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
};

export default function TermsPage() {
    return <TermsClient />;
}
