export interface AuthorSummary {
    name: string;
    imageUrl: string | null;
    role?: string;
    bio?: string;
}

export interface CategorySummary {
    slug: string;
    title: string;
    description?: string;
}

export interface TagSummary {
    slug: string;
    title: string;
}

export interface BlogListEntry {
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    imageUrl: string | null;
    authors: AuthorSummary[];
    categories: CategorySummary[];
    tags: TagSummary[];
}

export interface BlogDetail extends BlogListEntry {
    content: { markdown: string };
}
