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

export interface ContactSubmission {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  message: string;
  submitted_at: string;
  is_read: boolean;
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

export const getAllContactSubmissions = async (): Promise<
  ContactSubmission[]
> => {
  const response = await API.get<ContactSubmission[]>(
    API_ROUTES.contact.submissions
  );
  return response.data;
};

export const markSubmissionAsRead = async (submissionId: string) => {
  const response = await API.patch(
    API_ROUTES.contact.markAsRead(submissionId)
  );
  return response.data;
};

export const deleteContactSubmission = async (submissionId: string) => {
  const response = await API.delete(
    API_ROUTES.contact.deleteSubmission(submissionId)
  );
  return response.data;
};
