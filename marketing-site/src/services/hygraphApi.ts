import type {
  BlogDetail,
  BlogListEntry,
  CategorySummary,
  TagSummary,
} from "../types/blog";

import { HYGRAPH_ENDPOINT } from "../config";

// HYGRAPH_TOKEN remains a secret from env
const HYGRAPH_TOKEN = process.env.NEXT_PUBLIC_HYGRAPH_TOKEN || "";

type GraphQLResponse<T> = {
  data: T;
  errors?: Array<{ message: string }>;
};

const BLOGS_QUERY = `query BlogsPageData {
  blogs(orderBy: date_DESC) {
    date
    excerpt
    image {
      url
    }
    slug
    title
    content {
      html
      markdown
    }
    authors {
      name
      bio
      image {
        url
      }
    }
    categories {
      slug
      title
    }
    tags {
      slug
      title
    }
  }
  categories {
    description
    slug
    title
  }
  tags {
    slug
    title
  }
}`;

const BLOG_BY_SLUG_QUERY = `query BlogBySlug($slug: String!) {
  blog(where: { slug: $slug }) {
    date
    excerpt
    image {
      url
    }
    slug
    title
    content {
      markdown
    }
    authors {
      name
      bio
      image {
        url
      }
    }
    categories {
      slug
      title
    }
    tags {
      slug
      title
    }
  }
}`;

interface BlogsQueryResult {
  blogs: Array<{
    date: string;
    excerpt: string;
    image: { url: string } | null;
    slug: string;
    title: string;
    content: { markdown: string } | null;
    authors: Array<{
      name: string;
      role?: string;
      bio?: string;
      image: { url: string } | null;
    }>;
    categories: Array<{ slug: string; title: string }>;
    tags: Array<{ slug: string; title: string }>;
  }>;
  categories: Array<{
    description: string | null;
    slug: string;
    title: string;
  }>;
  tags: Array<{ slug: string; title: string }>;
}

interface BlogBySlugResult {
  blog: BlogsQueryResult["blogs"][number] | null;
}

const ensureEndpoint = () => {
  if (!HYGRAPH_ENDPOINT) {
    throw new Error(
      "Hygraph endpoint is not configured. Set NEXT_PUBLIC_HYGRAPH_ENDPOINT in your environment."
    );
  }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const executeGraphQL = async <T>(
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal,
  retries = 5,
  backoff = 500
): Promise<T> => {
  ensureEndpoint();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(HYGRAPH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(HYGRAPH_TOKEN ? { Authorization: `Bearer ${HYGRAPH_TOKEN}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
        next: { revalidate: 60 },
        signal,
      });

      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempt === retries) {
          throw new Error(`Hygraph request failed with status ${response.status} after ${retries} retries`);
        }
        const waitTime = backoff * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Hygraph rate limited (${response.status}). Retrying in ${waitTime}ms (Attempt ${attempt + 1}/${retries})...`);
        await delay(waitTime);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Hygraph request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as GraphQLResponse<T>;

      if (payload.errors && payload.errors.length > 0) {
        throw new Error(payload.errors[0].message);
      }

      return payload.data;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // If it's a network error (fetch throws), also retry
      const waitTime = backoff * Math.pow(2, attempt);
      console.warn(`Hygraph request error: ${error instanceof Error ? error.message : String(error)}. Retrying in ${waitTime}ms...`);
      await delay(waitTime);
    }
  }

  throw new Error("Hygraph request failed: Unknown error");
};

const mapBlogToListEntry = (
  blog: BlogsQueryResult["blogs"][number]
): BlogListEntry => ({
  slug: blog.slug,
  title: blog.title,
  excerpt: blog.excerpt,
  date: blog.date,
  imageUrl: blog.image?.url ?? null,
  authors: blog.authors.map((author) => ({
    name: author.name,
    imageUrl: author.image?.url ?? null,
    role: author?.role,
    bio: author.bio,
  })),
  categories: blog.categories.map((category) => ({
    slug: category.slug,
    title: category.title,
  })),
  tags: blog.tags.map((tag) => ({
    slug: tag.slug,
    title: tag.title,
  })),
});

const mapBlogToDetail = (
  blog: BlogsQueryResult["blogs"][number]
): BlogDetail => ({
  ...mapBlogToListEntry(blog),
  content: {
    markdown: blog.content?.markdown ?? "",
  },
});

export const fetchBlogs = async (
  signal?: AbortSignal
): Promise<{
  blogs: BlogListEntry[];
  categories: CategorySummary[];
  tags: TagSummary[];
}> => {
  const data = await executeGraphQL<BlogsQueryResult>(
    BLOGS_QUERY,
    undefined,
    signal
  );

  return {
    blogs: data.blogs.map(mapBlogToListEntry),
    categories: data.categories.map((category) => ({
      slug: category.slug,
      title: category.title,
      description: category.description ?? "",
    })),
    tags: data.tags.map((tag) => ({
      slug: tag.slug,
      title: tag.title,
    })),
  };
};

export const fetchBlogBySlug = async (
  slug: string,
  signal?: AbortSignal
): Promise<BlogDetail | null> => {
  const data = await executeGraphQL<BlogBySlugResult>(
    BLOG_BY_SLUG_QUERY,
    { slug },
    signal
  );

  if (!data.blog) {
    return null;
  }

  return mapBlogToDetail(data.blog);
};

const BLOGS_BY_AUTHOR_QUERY = `query BlogsByAuthor($authorName: String!) {
  blogs(where: { authors_some: { name: $authorName } }, orderBy: date_DESC) {
    date
    excerpt
    image {
      url
    }
    slug
    title
    content {
      markdown
    }
    authors {
      name
      bio
      image {
        url
      }
    }
    categories {
      slug
      title
    }
    tags {
      slug
      title
    }
  }
}`;

interface BlogsByAuthorResult {
  blogs: BlogsQueryResult["blogs"];
}

export const fetchBlogsByAuthor = async (
  authorName: string,
  signal?: AbortSignal
): Promise<BlogListEntry[]> => {
  const data = await executeGraphQL<BlogsByAuthorResult>(
    BLOGS_BY_AUTHOR_QUERY,
    { authorName },
    signal
  );

  return data.blogs.map(mapBlogToListEntry);
};
