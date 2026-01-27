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
            alternates: {
                canonical: `/blogs/${blog.slug}`,
            },
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
    const blog = await fetchBlogBySlug(resolvedParams.slug);
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog?.title,
        image: blog?.imageUrl ? [blog.imageUrl] : [],
        datePublished: blog?.date, // Ensure this field exists in your API response
        author: {
            '@type': 'Person',
            name: blog?.authors[0]?.name || 'Zygotrix Team'
        }
    };
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogDetailClient slug={resolvedParams.slug} />
        </>
    );
}
