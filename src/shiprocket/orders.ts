import { SHIPROCKET_CONFIG } from "./config";
import { ShiprocketHttpClient } from "./http-client";
import { ShiprocketAuth } from "./auth";
import {
  ShiprocketOrderRequest,
  ShiprocketOrderResponse,
  ShiprocketAPIResponse,
} from "./types";

export class ShiprocketOrders {
  private httpClient: ShiprocketHttpClient;
  private auth: ShiprocketAuth;

  constructor(httpClient?: ShiprocketHttpClient, auth?: ShiprocketAuth) {
    this.httpClient = httpClient || new ShiprocketHttpClient();
    this.auth = auth || new ShiprocketAuth(this.httpClient);
  }

  async createOrder(
    orderData: ShiprocketOrderRequest
  ): Promise<ShiprocketAPIResponse<ShiprocketOrderResponse>> {
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
    return this.httpClient.post<ShiprocketOrderResponse>(
      SHIPROCKET_CONFIG.ENDPOINTS.CREATE_ORDER,
      orderData,
      token
    );
  }

  async cancelOrders(orderIds: number[]): Promise<ShiprocketAPIResponse<any>> {
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
    return this.httpClient.post(
      SHIPROCKET_CONFIG.ENDPOINTS.CANCEL_ORDER,
      { ids: orderIds },
      token
    );
  }

  async generatePickup(
    orderIds: number[]
  ): Promise<ShiprocketAPIResponse<any>> {
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
    return this.httpClient.post(
      SHIPROCKET_CONFIG.ENDPOINTS.GENERATE_PICKUP,
      { shipment_id: orderIds },
      token
    );
  }
}
