import API from "./api";
import { API_ROUTES } from "./apiConstants";
import type {
  DataImportResponse,
  PopulationSimRequest,
  PopulationSimResponse,
  PGSDemoRequest,
  PGSDemoResponse,
} from "../types/api";

export const uploadGenomeFile = async (
  file: File,
  options: { persist?: boolean } = {},
): Promise<DataImportResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("persist", options.persist ? "true" : "false");

  const response = await API.post<DataImportResponse>(
    API_ROUTES.data.importFile,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const simulatePopulation = async (
  payload: PopulationSimRequest,
): Promise<PopulationSimResponse> => {
  const response = await API.post<PopulationSimResponse>(
    API_ROUTES.population.simulate,
    payload,
  );
  return response.data;
};

export const runPGSDemo = async (
  payload: PGSDemoRequest,
): Promise<PGSDemoResponse> => {
  const response = await API.post<PGSDemoResponse>(
    API_ROUTES.pgs.demo,
    payload,
  );
  return response.data;
};

