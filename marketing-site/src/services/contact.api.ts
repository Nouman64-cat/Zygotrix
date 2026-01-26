import API from "./api";
import { API_ROUTES } from "./apiConstants";

export interface ContactFormRequest {
    name?: string;
    email: string;
    phone?: string;
    message: string;
}

export interface ContactFormResponse {
    message: string;
    id: string;
    submitted_at: string;
}

export const submitContactForm = async (
    data: ContactFormRequest
): Promise<ContactFormResponse> => {
    const response = await API.post<ContactFormResponse>(
        API_ROUTES.contact.submit,
        data
    );
    return response.data;
};
