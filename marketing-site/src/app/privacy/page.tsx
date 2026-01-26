import type { Metadata } from "next";
import PrivacyClient from "../../components/legal/PrivacyClient";

export const metadata: Metadata = {
    title: "Privacy Policy - Zygotrix",
    description: "Zygotrix privacy policy and data protection practices.",
    openGraph: {
        title: "Privacy Policy - Zygotrix",
        description: "Zygotrix privacy policy and data protection practices.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
};

export default function PrivacyPage() {
    return <PrivacyClient />;
}
