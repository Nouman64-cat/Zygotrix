import type { TeamMemberResponse } from "../types/teamMember";

const HYGRAPH_ENDPOINT =
  import.meta.env.VITE_HYGRAPH_ENDPOINT ||
  "https://ap-south-1.cdn.hygraph.com/content/cmg0d4ao2013r08wb95es4c0w/master";

const HYGRAPH_TOKEN =
  import.meta.env.VITE_HYGRAPH_TOKEN ||
  import.meta.env.VITE_HYGRAPH_PERMANENT_AUTH_TOKEN ||
  "";

const ensureEndpoint = () => {
  if (!HYGRAPH_ENDPOINT) {
    throw new Error("HYGRAPH_ENDPOINT is not configured");
  }
};

export const fetchTeamMember = async (
  slug: string
): Promise<TeamMemberResponse> => {
  ensureEndpoint();

  const query = `
    query GetTeamMember($slug: String!) {
      teamMember(where: { slug: $slug }) {
        bio {
          markdown
        }
        name
        photo {
          url
        }
        role
        socialProfiles {
          username
          url
          platform
        }
      }
    }
  `;

  const response = await fetch(HYGRAPH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(HYGRAPH_TOKEN ? { Authorization: `Bearer ${HYGRAPH_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      query,
      variables: { slug },
    }),
  });

  if (!response.ok) {
    throw new Error(`Hygraph request failed with status ${response.status}`);
  }

  const payload = await response.json();

  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0].message);
  }

  return payload;
};
