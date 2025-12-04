import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type {
  AdminUserListResponse,
  AdminUserActionResponse,
  UserProfile,
  AdminUserStats,
  UserRole,
  MessageResponse,
} from "../types/auth";

export type AdminUserFilters = {
  page?: number;
  page_size?: number;
  search?: string;
  role?: UserRole;
  status?: "active" | "inactive";
};

export const fetchAdminUsers = async (
  filters: AdminUserFilters = {}
): Promise<AdminUserListResponse> => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.page_size)
    params.append("page_size", filters.page_size.toString());
  if (filters.search) params.append("search", filters.search);
  if (filters.role) params.append("role", filters.role);
  if (filters.status) params.append("status", filters.status);

  const queryString = params.toString();
  const url = queryString
    ? `${API_ROUTES.admin.users}?${queryString}`
    : API_ROUTES.admin.users;

  const response = await API.get<AdminUserListResponse>(url);
  return response.data;
};

export const fetchAdminUserDetail = async (
  userId: string
): Promise<UserProfile> => {
  const response = await API.get<UserProfile>(
    API_ROUTES.admin.userDetail(userId)
  );
  return response.data;
};

export const deactivateUser = async (
  userId: string,
  reason?: string
): Promise<AdminUserActionResponse> => {
  const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  const response = await API.post<AdminUserActionResponse>(
    `${API_ROUTES.admin.deactivateUser(userId)}${params}`
  );
  return response.data;
};

export const reactivateUser = async (
  userId: string
): Promise<AdminUserActionResponse> => {
  const response = await API.post<AdminUserActionResponse>(
    API_ROUTES.admin.reactivateUser(userId)
  );
  return response.data;
};

export const deleteUser = async (userId: string): Promise<MessageResponse> => {
  const response = await API.delete<MessageResponse>(
    API_ROUTES.admin.userDetail(userId)
  );
  return response.data;
};

export const updateUserRole = async (
  userId: string,
  newRole: UserRole
): Promise<AdminUserActionResponse> => {
  const response = await API.patch<AdminUserActionResponse>(
    `${API_ROUTES.admin.updateUserRole(userId)}?new_role=${newRole}`
  );
  return response.data;
};

export const fetchAdminStats = async (): Promise<AdminUserStats> => {
  const response = await API.get<AdminUserStats>(API_ROUTES.admin.stats);
  return response.data;
};
