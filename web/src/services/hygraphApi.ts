import type {
  BlogDetail,
  BlogListEntry,
  CategorySummary,
  TagSummary,
} from "../types/blog";

const HYGRAPH_ENDPOINT =
  import.meta.env.VITE_HYGRAPH_ENDPOINT ||
  "https://ap-south-1.cdn.hygraph.com/content/cmg0d4ao2013r08wb95es4c0w/master";

const HYGRAPH_TOKEN =
  import.meta.env.VITE_HYGRAPH_TOKEN ||
  import.meta.env.VITE_HYGRAPH_PERMANENT_AUTH_TOKEN ||
  "";

type GraphQLResponse<T> = {
  data: T;
  errors?: Array<{ message: string }>; // minimal GraphQL error typing
};

const BLOGS_QUERY = `query BlogsPageData {
  blogs {
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
      "Hygraph endpoint is not configured. Set VITE_HYGRAPH_ENDPOINT in your environment."
    );
  }
};

const executeGraphQL = async <T>(
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> => {
  ensureEndpoint();

  const response = await fetch(HYGRAPH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(HYGRAPH_TOKEN ? { Authorization: `Bearer ${HYGRAPH_TOKEN}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Hygraph request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0].message);
  }

  return payload.data;
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
  blogs(where: { authors_some: { name: $authorName } }) {
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
