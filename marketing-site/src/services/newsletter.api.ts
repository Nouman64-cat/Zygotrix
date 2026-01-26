import API from "./api";
import { API_ROUTES } from "./apiConstants";

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
