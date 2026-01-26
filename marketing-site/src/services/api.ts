import { API_BASE_URL } from "./apiConstants";

const API = {
    get: async <T>(url: string, config?: RequestInit): Promise<{ data: T }> => {
        const fullUrl = `${API_BASE_URL}${url}`;
        const response = await fetch(fullUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            ...config,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const error = new Error(`Request failed with status ${response.status}`);
            (error as any).response = { status: response.status, data: errorBody };
            throw error;
        }

        const data = await response.json();
        return { data };
    },

    post: async <T>(url: string, body: any, config?: RequestInit): Promise<{ data: T }> => {
        const fullUrl = `${API_BASE_URL}${url}`;
        const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            ...config,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const error = new Error(`Request failed with status ${response.status}`);
            (error as any).response = { status: response.status, data: errorBody };
            throw error;
        }

        const data = await response.json();
        return { data };
    },
};

export default API;
