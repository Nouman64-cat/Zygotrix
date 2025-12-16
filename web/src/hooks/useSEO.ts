import { useEffect } from "react";

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    ogImage?: string;
    ogType?: string;
    canonicalUrl?: string;
}

/**
 * Custom hook to set SEO meta tags dynamically.
 * Sets title, description, Open Graph tags, and other meta tags.
 */
const useSEO = ({
    title,
    description,
    keywords,
    ogImage = "/og-default.png",
    ogType = "website",
    canonicalUrl,
}: SEOProps) => {
    useEffect(() => {
        // Set document title
        const previousTitle = document.title;
        document.title = `${title} | Zygotrix`;

        // Helper to set or create meta tag
        const setMetaTag = (name: string, content: string, property = false) => {
            const attribute = property ? "property" : "name";
            let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
            if (!element) {
                element = document.createElement("meta");
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }
            element.setAttribute("content", content);
        };

        // Set meta description
        setMetaTag("description", description);

        // Set keywords if provided
        if (keywords) {
            setMetaTag("keywords", keywords);
        }

        // Open Graph tags
        setMetaTag("og:title", `${title} | Zygotrix`, true);
        setMetaTag("og:description", description, true);
        setMetaTag("og:type", ogType, true);
        setMetaTag("og:image", ogImage, true);
        setMetaTag("og:site_name", "Zygotrix", true);

        // Twitter Card tags
        setMetaTag("twitter:card", "summary_large_image");
        setMetaTag("twitter:title", `${title} | Zygotrix`);
        setMetaTag("twitter:description", description);
        setMetaTag("twitter:image", ogImage);

        // Canonical URL
        if (canonicalUrl) {
            let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
            if (!link) {
                link = document.createElement("link");
                link.setAttribute("rel", "canonical");
                document.head.appendChild(link);
            }
            link.setAttribute("href", canonicalUrl);
        }

        return () => {
            document.title = previousTitle;
        };
    }, [title, description, keywords, ogImage, ogType, canonicalUrl]);
};

export default useSEO;
