import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type {
  AdminUserListResponse,
  AdminUserActionResponse,
  UserProfile,
  AdminUserStats,
  UserRole,
  MessageResponse,
  ChatbotSettings,
  ChatbotSettingsResponse,
  ChatbotSettingsHistoryResponse,
  PromptTemplate,
  PromptTemplateUpdate,
  PromptType,
  PromptHistoryResponse,
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

// Subscription management
export const updateUserSubscription = async (
  userId: string,
  subscriptionStatus: "free" | "pro"
): Promise<AdminUserActionResponse> => {
  const response = await API.patch<AdminUserActionResponse>(
    `${API_ROUTES.admin.userDetail(
      userId
    )}/subscription?subscription_status=${subscriptionStatus}`
  );
  return response.data;
};

// Chatbot settings functions
export const fetchChatbotSettings = async (): Promise<ChatbotSettings> => {
  const response = await API.get<ChatbotSettings>(
    API_ROUTES.admin.chatbotSettings
  );
  return response.data;
};

export const updateChatbotSettings = async (
  settings: Partial<ChatbotSettings>
): Promise<ChatbotSettingsResponse> => {
  const response = await API.put<ChatbotSettingsResponse>(
    API_ROUTES.admin.updateChatbotSettings,
    settings
  );
  return response.data;
};

export const fetchChatbotSettingsHistory = async (
  limit: number = 50,
  skip: number = 0
): Promise<ChatbotSettingsHistoryResponse> => {
  const response = await API.get<ChatbotSettingsHistoryResponse>(
    `${API_ROUTES.admin.chatbotSettings}/history?limit=${limit}&skip=${skip}`
  );
  return response.data;
};

// Prompt template management functions
export const fetchAllPrompts = async (): Promise<PromptTemplate[]> => {
  const response = await API.get<PromptTemplate[]>(API_ROUTES.admin.prompts);
  return response.data;
};

export const fetchPrompt = async (
  promptType: PromptType
): Promise<PromptTemplate> => {
  const response = await API.get<PromptTemplate>(
    API_ROUTES.admin.promptDetail(promptType)
  );
  return response.data;
};

export const updatePrompt = async (
  promptType: PromptType,
  data: PromptTemplateUpdate
): Promise<PromptTemplate> => {
  const response = await API.put<PromptTemplate>(
    API_ROUTES.admin.updatePrompt(promptType),
    data
  );
  return response.data;
};

export const resetPromptToDefault = async (
  promptType: PromptType
): Promise<MessageResponse> => {
  const response = await API.post<MessageResponse>(
    API_ROUTES.admin.resetPrompt(promptType)
  );
  return response.data;
};

export const fetchPromptHistory = async (
  limit: number = 50,
  skip: number = 0,
  promptType?: PromptType
): Promise<PromptHistoryResponse> => {
  let url = `${API_ROUTES.admin.prompts}/history?limit=${limit}&skip=${skip}`;
  if (promptType) {
    url += `&prompt_type=${promptType}`;
  }
  const response = await API.get<PromptHistoryResponse>(url);
  return response.data;
};
