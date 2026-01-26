import type { Metadata } from "next";
import BlogsClient from "../../components/blog/BlogsClient";

export const metadata: Metadata = {
    title: "Genetic Engineering Chronicles - Zygotrix Blogs",
    description: "Deep dives into genomics, biotechnology, and the future of precision medicine.",
    openGraph: {
        title: "Genetic Engineering Chronicles - Zygotrix Blogs",
        description: "Deep dives into genomics, biotechnology, and the future of precision medicine.",
        images: ["https://ap-south-1.graphassets.com/cmg0d4awz0abu07pfgv3s80hg/cmg0o8wb80r7d07pd9fu2aywz"],
    },
};

export default function BlogsPage() {
    return <BlogsClient />;
}
