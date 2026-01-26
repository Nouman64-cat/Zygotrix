import type { Metadata } from "next";
import ContactClient from "../../components/contact/ContactClient";

export const metadata: Metadata = {
    title: "Contact Us - Zygotrix",
    description: "Reach out to Zygotrix for demos, integration guidance, or collaboration opportunities.",
    openGraph: {
        title: "Contact Us - Zygotrix",
        description: "Reach out to Zygotrix for demos, integration guidance, or collaboration opportunities.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
};

export default function ContactPage() {
    return <ContactClient />;
}
