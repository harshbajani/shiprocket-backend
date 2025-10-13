import { SHIPROCKET_CONFIG } from "./config";
import { ShiprocketError, ShiprocketAPIResponse } from "./types";

export class ShiprocketHttpClient {
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || SHIPROCKET_CONFIG.API_BASE_URL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<ShiprocketAPIResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const config: RequestInit = { ...options, headers };

      console.log(`[Shiprocket] ${options.method || "GET"} ${url}`);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        const error: ShiprocketError = {
          message: `API Error: ${response.status} ${response.statusText}`,
          status: response.status,
          statusText: response.statusText,
          response: errorText,
        };

        console.error(`[Shiprocket] Error:`, error);

        return { success: false, error };
      }

      const data = await response.json();
      console.log(`[Shiprocket] Success:`, {
        status: response.status,
        data: typeof data,
      });

      return { success: true, data };
    } catch (error) {
      console.error(`[Shiprocket] Request failed:`, error);

      const shiprocketError: ShiprocketError = {
        message: error instanceof Error ? error.message : "Unknown error",
        status: 0,
        statusText: "Network Error",
        response: error,
      };
      return { success: false, error: shiprocketError };
    }
  }

  async get<T>(
    endpoint: string,
    token?: string
  ): Promise<ShiprocketAPIResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" }, token);
  }

  async post<T>(
    endpoint: string,
    data: any,
    token?: string
  ): Promise<ShiprocketAPIResponse<T>> {
    return this.request<T>(
      endpoint,
      { method: "POST", body: JSON.stringify(data) },
      token
    );
  }

  async put<T>(
    endpoint: string,
    data: any,
    token?: string
  ): Promise<ShiprocketAPIResponse<T>> {
    return this.request<T>(
      endpoint,
      { method: "PUT", body: JSON.stringify(data) },
      token
    );
  }

  async delete<T>(
    endpoint: string,
    token?: string
  ): Promise<ShiprocketAPIResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" }, token);
  }
}
