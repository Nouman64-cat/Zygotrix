import { useState, useEffect } from "react";
import type { TeamMember } from "../types/teamMember";
import { fetchTeamMember } from "../services/teamMember";

export const useTeamMember = (slug: string) => {
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeamMember = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchTeamMember(slug);

        if (!response.data.teamMember) {
          throw new Error("Team member not found");
        }

        setTeamMember(response.data.teamMember);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load team member"
        );
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadTeamMember();
    }
  }, [slug]);

  return { teamMember, loading, error };
};
