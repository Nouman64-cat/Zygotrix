import { API_BASE_URL, API_ROUTES } from "./apiConstants";
export async function fetchUserProjects(token: string, page = 1, pageSize = 1) {
  const response = await fetch(
    `${API_BASE_URL}${API_ROUTES.projects.root}?page=${page}&page_size=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch projects");
  return response.json();
}
