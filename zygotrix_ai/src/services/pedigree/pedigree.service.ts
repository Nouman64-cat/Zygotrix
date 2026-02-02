import axiosInstance from "../api/config/axios.config";
import { API_ENDPOINTS } from "../api/constants/api.constants";
import type { PedigreeRequest, PedigreeResponse } from "../../types";

class PedigreeService {
  /**
   * Analyze a pedigree query using natural language
   */
  async analyze(request: PedigreeRequest): Promise<PedigreeResponse> {
    try {
      const response = await axiosInstance.post<PedigreeResponse>(
        API_ENDPOINTS.GENETICS.PEDIGREE_ANALYZE,
        request,
      );
      return response.data;
    } catch (error) {
      console.error("Pedigree analysis failed:", error);
      throw error;
    }
  }
}

export default new PedigreeService();
