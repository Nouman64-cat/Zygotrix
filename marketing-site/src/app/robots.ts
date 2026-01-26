import { MetadataRoute } from 'next';

export const dynamic = "force-static"; // Force static generation needed for output: export

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/private/', '/studio/'], // Example disallowed paths
        },
        sitemap: 'https://zygotrix.com/sitemap.xml',
    }
}
