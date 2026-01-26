import { MetadataRoute } from 'next';
import { fetchBlogs } from '../services/hygraphApi';
import { fetchTeamMembers } from '../services/teamMember';

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://zygotrix.com';

    // Static routes
    const routes = [
        '',
        '/about',
        '/contact',
        '/pricing',
        '/product/ai',
        '/tools/dna-generator',
        '/tools/dna-to-protein',
        '/tools/punnett-square',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Fetch dynamic blog posts
    const { blogs } = await fetchBlogs();
    const blogRoutes = blogs.map((blog: any) => ({
        url: `${baseUrl}/blogs/${blog.slug}`,
        lastModified: new Date(blog.date),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // Fetch dynamic team members
    const teamMembers = await fetchTeamMembers();
    const teamRoutes = teamMembers.map((member: any) => ({
        url: `${baseUrl}/team/${member.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
    }));

    return [...routes, ...blogRoutes, ...teamRoutes];
}
