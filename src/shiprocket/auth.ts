import { SHIPROCKET_CONFIG, validateConfig } from "./config";
import { ShiprocketHttpClient } from "./http-client";
import {
  ShiprocketAuthResponse,
  ShiprocketAuthRequest,
  ShiprocketAPIResponse,
} from "./types";

export class ShiprocketAuth {
  private httpClient: ShiprocketHttpClient;
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(httpClient?: ShiprocketHttpClient) {
    this.httpClient = httpClient || new ShiprocketHttpClient();
  }

  async authenticate(): Promise<ShiprocketAPIResponse<string>> {
    try {
      const configValidation = validateConfig();
      if (!configValidation.isValid) {
        return {
          success: false,
          error: {
            message: `Configuration errors: ${configValidation.errors.join(
              ", "
            )}`,
            status: 400,
            statusText: "Configuration Error",
          },
        };
      }

      if (this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        console.log("[Shiprocket Auth] Using cached token");
        return { success: true, data: this.authToken };
      }

      console.log("[Shiprocket Auth] Authenticating with Shiprocket...");

      const authRequest: ShiprocketAuthRequest = {
        email: SHIPROCKET_CONFIG.EMAIL!,
        password: SHIPROCKET_CONFIG.PASSWORD!,
      };

      const response = await this.httpClient.post<ShiprocketAuthResponse>(
        SHIPROCKET_CONFIG.ENDPOINTS.AUTH,
        authRequest
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || {
            message: "Authentication failed",
            status: 401,
            statusText: "Unauthorized",
          },
        };
      }

      this.authToken = response.data.token;
      this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      console.log("[Shiprocket Auth] Authentication successful");

      return { success: true, data: this.authToken };
    } catch (error) {
      console.error("[Shiprocket Auth] Authentication error:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Authentication failed",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  async getToken(): Promise<string | null> {
    const result = await this.authenticate();
    return result.success ? result.data! : null;
  }

  isAuthenticated(): boolean {
    return !!(
      this.authToken &&
      this.tokenExpiry &&
      new Date() < this.tokenExpiry
    );
  }

  clearAuth(): void {
    this.authToken = null;
    this.tokenExpiry = null;
    console.log("[Shiprocket Auth] Authentication cleared");
  }

  getTokenInfo(): { hasToken: boolean; expires?: Date; isValid?: boolean } {
    return {
      hasToken: !!this.authToken,
      expires: this.tokenExpiry || undefined,
      isValid: this.isAuthenticated(),
    };
  }
}
