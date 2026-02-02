import type {
  TeamMemberResponse,
  TeamMembersResponse,
  TeamMemberSummary,
} from "../types/teamMember";
import { HYGRAPH_ENDPOINT } from "../config";

// HYGRAPH_TOKEN remains secret
const HYGRAPH_TOKEN =
  process.env.NEXT_PUBLIC_HYGRAPH_TOKEN ||
  process.env.NEXT_PUBLIC_HYGRAPH_PERMANENT_AUTH_TOKEN ||
  "";

const ensureEndpoint = () => {
  if (!HYGRAPH_ENDPOINT) {
    throw new Error("HYGRAPH_ENDPOINT is not configured");
  }
};

export const fetchTeamMember = async (
  slug: string,
  signal?: AbortSignal
): Promise<TeamMemberResponse> => {
  ensureEndpoint();

  const query = `
    query GetTeamMember($slug: String!) {
      teamMember(where: { slug: $slug }) {
        bio {
          markdown
        }
        founder
        introduction
        active
        name
        photo {
          url
        }
        role
        slug
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
    signal,
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

export const fetchTeamMembers = async (
  signal?: AbortSignal
): Promise<TeamMemberSummary[]> => {
  ensureEndpoint();

  const query = `
    query GetTeamMembers {
      teamMembers {
        name
        role
        slug
        introduction
        founder
        active
        photo {
          url
          fileName
        }
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
    body: JSON.stringify({ query }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Hygraph request failed with status ${response.status}`);
  }

  const payload: TeamMembersResponse = await response.json();

  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0].message);
  }

  return payload.data?.teamMembers ?? [];
};
