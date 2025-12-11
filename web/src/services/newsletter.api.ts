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

export const subscribeToNewsletter = async (
  email: string
): Promise<NewsletterSubscribeResponse> => {
  const response = await API.post<NewsletterSubscribeResponse>(
    API_ROUTES.newsletter.subscribe,
    { email }
  );
  return response.data;
};

export const getAllSubscriptions = async () => {
  const response = await API.get(API_ROUTES.newsletter.subscriptions);
  return response.data;
};

export const unsubscribeFromNewsletter = async (email: string) => {
  const response = await API.delete(API_ROUTES.newsletter.unsubscribe(email));
  return response.data;
};
