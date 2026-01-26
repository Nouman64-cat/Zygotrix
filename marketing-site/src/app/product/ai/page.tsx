import type { Metadata } from "next";
import AiClient from "../../../components/product/AiClient";

export const metadata: Metadata = {
    title: "ZygoAI - Your AI Genetics Assistant",
    description: "ZygoAI is an advanced AI assistant built for genetics research and education. Control simulations naturally.",
    openGraph: {
        title: "ZygoAI - Your AI Genetics Assistant",
        description: "ZygoAI is an advanced AI assistant built for genetics research and education. Control simulations naturally.",
        type: "website",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
};

export default function AiPage() {
    return <AiClient />;
}
