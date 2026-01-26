import type { Metadata } from "next";
import BlogDetailClient from "../../../components/blog/BlogDetailClient";
import { fetchBlogBySlug, fetchBlogs } from "../../../services/hygraphApi";

// Define the type for route params
type Props = {
    params: Promise<{ slug: string }>;
};

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;

    try {
        const blog = await fetchBlogBySlug(resolvedParams.slug);

        if (!blog) {
            return {
                title: "Article Not Found",
            };
        }

        return {
            title: `${blog.title} | Zygotrix Blog`,
            description: blog.excerpt || blog.content.markdown.substring(0, 160),
            openGraph: {
                title: blog.title,
                description: blog.excerpt || blog.content.markdown.substring(0, 160),
                images: blog.imageUrl ? [blog.imageUrl] : [],
                type: "article",
                authors: blog.authors.map((a) => a.name),
            },
        };
    } catch (error) {
        return {
            title: "Blog Article",
        };
    }
}

// Generate static parameters for blog posts at build time
export async function generateStaticParams() {
    try {
        const { blogs } = await fetchBlogs();
        return blogs.map((blog) => ({
            slug: blog.slug,
        }));
    } catch (error) {
        console.error("Failed to generate static params for blogs:", error);
        return [];
    }
}

export default async function BlogDetailPage({ params }: Props) {
    const resolvedParams = await params;
    return <BlogDetailClient slug={resolvedParams.slug} />;
}
