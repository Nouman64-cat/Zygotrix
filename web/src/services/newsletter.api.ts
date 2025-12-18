import API from "./api";
import { API_ROUTES } from "./apiConstants";

export interface NewsletterSubscribeRequest {
  email: string;
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

export interface SendNewsletterRequest {
  recipient_emails: string[];
  template_type: "changelog" | "release" | "news" | "update";
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

export const getAllRecipients = async (): Promise<AllRecipientsResponse> => {
  const response = await API.get(API_ROUTES.newsletter.recipients);
  return response.data;
};

export const unsubscribeFromNewsletter = async (email: string) => {
  const response = await API.delete(API_ROUTES.newsletter.unsubscribe(email));
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
