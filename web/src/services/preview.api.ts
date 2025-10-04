import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type {
  MendelianPreviewRequest,
  MendelianPreviewResponse,
} from "../types/api";

export const fetchMendelianPreview = async (
  payload: MendelianPreviewRequest,
  signal?: AbortSignal,
): Promise<MendelianPreviewResponse> => {
  const response = await API.post<MendelianPreviewResponse>(
    API_ROUTES.mendelian.preview,
    payload,
    { signal },
  );
  return response.data;
};

