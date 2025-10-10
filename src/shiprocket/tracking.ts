import { SHIPROCKET_CONFIG } from "./config";
import { ShiprocketHttpClient } from "./http-client";
import { ShiprocketAuth } from "./auth";
import { ShiprocketTrackingResponse, ShiprocketAPIResponse } from "./types";

export class ShiprocketTracking {
  private httpClient: ShiprocketHttpClient;
  private auth: ShiprocketAuth;

  constructor(httpClient?: ShiprocketHttpClient, auth?: ShiprocketAuth) {
    this.httpClient = httpClient || new ShiprocketHttpClient();
    this.auth = auth || new ShiprocketAuth(this.httpClient);
  }

  async trackByAWB(
    awbCode: string
  ): Promise<ShiprocketAPIResponse<ShiprocketTrackingResponse>> {
    const token = await this.auth.getToken();
    if (!token)
      return {
        success: false,
        error: {
          message: "Authentication failed",
          status: 401,
          statusText: "Unauthorized",
        },
      };
    return this.httpClient.get<ShiprocketTrackingResponse>(
      `${SHIPROCKET_CONFIG.ENDPOINTS.TRACK_ORDER}/${awbCode}`,
      token
    );
  }

  async trackByOrderId(
    orderId: number
  ): Promise<ShiprocketAPIResponse<ShiprocketTrackingResponse>> {
    const token = await this.auth.getToken();
    if (!token)
      return {
        success: false,
        error: {
          message: "Authentication failed",
          status: 401,
          statusText: "Unauthorized",
        },
      };
    return this.httpClient.get<ShiprocketTrackingResponse>(
      `${SHIPROCKET_CONFIG.ENDPOINTS.TRACK_BY_ORDER_ID}?order_id=${orderId}`,
      token
    );
  }
}
