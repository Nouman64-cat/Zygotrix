import API from "./api";
import { API_ROUTES } from "./apiConstants";

export interface NewsletterSubscribeRequest {
  email: string;
}


export interface NewsletterSubscriber {
  _id: string;
  email: string;
  subscribed_at: string;
  source: string;
  type: "newsletter_subscriber";
}

export interface SystemUser {
  _id: string;
  email: string;
  full_name?: string;
  user_role: string;
  created_at: string;
  type: "system_user";
}

export interface AllRecipientsResponse {
  newsletter_subscribers: NewsletterSubscriber[];
  system_users: SystemUser[];
  total_newsletter_subscribers: number;
  total_system_users: number;
  total: number;
}

export interface NewsletterSubscribeResponse {
  message: string;
  email: string;
  subscribed_at: string;
}

export interface NewsletterSubscription {
  _id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
  source: string;
}

export interface SendNewsletterRequest {
  recipient_emails: string[];
  template_type: "changelog" | "release" | "news" | "update" | "marketing";
  subject: string;
  content: string;
}

export interface SendNewsletterResponse {
  total: number;
  success: number;
  failed: number;
  failed_emails: Array<{ email: string; error: string }>;
}

export const subscribeToNewsletter = async (
  email: string
): Promise<NewsletterSubscribeResponse> => {
  const response = await API.post<NewsletterSubscribeResponse>(
    API_ROUTES.newsletter.subscribe,
    { email }
  );
  return response.data;
};

export const getAllSubscriptions = async (): Promise<{
  count: number;
  subscriptions: NewsletterSubscription[];
}> => {
  const response = await API.get(API_ROUTES.newsletter.subscriptions);
  return response.data;
};

export const unsubscribeFromNewsletter = async (email: string) => {
  const response = await API.delete(API_ROUTES.newsletter.unsubscribe(email));
  return response.data;
};

export const getAllRecipients = async (): Promise<AllRecipientsResponse> => {
  const response = await API.get(API_ROUTES.newsletter.recipients);
  return response.data;
};

export const sendNewsletter = async (
  data: SendNewsletterRequest
): Promise<SendNewsletterResponse> => {
  const response = await API.post<SendNewsletterResponse>(
    API_ROUTES.newsletter.send,
    data
  );
  return response.data;
};

// AI Template Generation & Management

export interface GenerateTemplateRequest {
  description: string;
  template_type?: string;
}

export interface GenerateTemplateResponse {
  html: string;
  description: string;
  template_type: string;
  generated_at: string;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface SaveTemplateRequest {
  name: string;
  html: string;
  description: string;
  template_type: string;
  thumbnail_url?: string;
}

export interface EmailTemplate {
  _id: string;
  name: string;
  html: string;
  description: string;
  template_type: string;
  created_by: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  usage_count: number;
}

export const generateTemplateWithAI = async (
  data: GenerateTemplateRequest
): Promise<GenerateTemplateResponse> => {
  const response = await API.post<GenerateTemplateResponse>(
    API_ROUTES.newsletter.generateTemplate,
    data
  );
  return response.data;
};

export const saveCustomTemplate = async (
  data: SaveTemplateRequest
): Promise<EmailTemplate> => {
  const response = await API.post<EmailTemplate>(
    API_ROUTES.newsletter.templates,
    data
  );
  return response.data;
};

export const getCustomTemplates = async (
  templateType?: string
): Promise<{ templates: EmailTemplate[]; count: number }> => {
  const params = templateType ? { template_type: templateType } : {};
  const response = await API.get(API_ROUTES.newsletter.templates, { params });
  return response.data;
};

export const deleteCustomTemplate = async (templateId: string): Promise<void> => {
  await API.delete(API_ROUTES.newsletter.deleteTemplate(templateId));
};
