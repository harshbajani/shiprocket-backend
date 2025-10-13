import { getShiprocketSDK } from "../shiprocket/index";
import type {
  ShiprocketOrderRequest,
  ShiprocketOrderResponse,
  ShiprocketTrackingResponse,
  ShiprocketPickupLocationRequest,
} from "../shiprocket/types";

// Export legacy interfaces for backward compatibility
export type {
  ShiprocketAuthResponse,
  ShiprocketOrderItem,
  ShiprocketWebhookPayload,
} from "../shiprocket/types";

export class ShiprocketService {
  private static instance: ShiprocketService;
  private sdk = getShiprocketSDK();
  private backend = process.env.SHIPROCKET_BACKEND_URL || "";

  private async fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.backend}${path}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data && data.success === false)) {
      const msg =
        (data && (data.error || data.message)) ||
        `Request failed: ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  }

  private constructor() {}

  public static getInstance(): ShiprocketService {
    if (!ShiprocketService.instance) {
      ShiprocketService.instance = new ShiprocketService();
    }
    return ShiprocketService.instance;
  }

  /**
   * Create order in Shiprocket (legacy direct SDK)
   */
  async createOrder(
    orderData: ShiprocketOrderRequest
  ): Promise<ShiprocketOrderResponse> {
    const response = await this.sdk.orders.createOrder(orderData);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to create order");
    }
    return response.data!;
  }

  /**
   * Create order via backend with context: order + vendor + optional custom pickup location
   */
  async createOrderWithContext(params: {
    order: ShiprocketOrderRequest;
    vendor?: any;
    customPickupLocation?: any;
  }): Promise<ShiprocketOrderResponse> {
    if (!this.backend)
      throw new Error("SHIPROCKET_BACKEND_URL is not configured");
    // Backend expects raw ShiprocketOrderRequest as the body
    const resp = await this.fetchJSON<{
      success: boolean;
      data: ShiprocketOrderResponse;
    }>("/shiprocket/orders", {
      method: "POST",
      body: JSON.stringify(params.order),
    });
    return resp.data as ShiprocketOrderResponse;
  }

  /**
   * Track order by AWB code
   */
  async trackOrderByAWB(awbCode: string): Promise<ShiprocketTrackingResponse> {
    const response = await this.sdk.tracking.trackByAWB(awbCode);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to track order");
    }
    return response.data!;
  }

  /**
   * Track order by Shiprocket order ID
   */
  async trackOrderById(orderId: number): Promise<ShiprocketTrackingResponse> {
    const response = await this.sdk.tracking.trackByOrderId(orderId);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to track order");
    }
    return response.data!;
  }

  /**
   * Cancel Shiprocket orders
   */
  async cancelOrder(orderIds: number[]): Promise<any> {
    const response = await this.sdk.orders.cancelOrders(orderIds);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to cancel orders");
    }
    return response.data;
  }

  /**
   * Add pickup location via backend
   */
  async addPickupLocation(
    locationData: ShiprocketPickupLocationRequest
  ): Promise<any> {
    if (!this.backend)
      throw new Error("SHIPROCKET_BACKEND_URL is not configured");
    const resp = await this.fetchJSON<{ success: boolean; data: any }>(
      "/shiprocket/pickups",
      { method: "POST", body: JSON.stringify(locationData) }
    );
    return resp.data;
  }

  /**
   * Get all pickup locations via backend
   */
  async getPickupLocations(): Promise<any> {
    if (!this.backend)
      throw new Error("SHIPROCKET_BACKEND_URL is not configured");
    const resp = await this.fetchJSON<{ success: boolean; data: any }>(
      "/shiprocket/pickups",
      { method: "GET" }
    );
    return resp.data;
  }

  /**
   * Create pickup location for vendor via backend (expects vendor with store.addresses)
   */
  async createVendorPickupLocation(
    vendor: any
  ): Promise<{ success: boolean; location_name?: string; error?: string }> {
    if (!this.backend)
      throw new Error("SHIPROCKET_BACKEND_URL is not configured");

    // Backend expects the vendor object at the root of the body
    const vendorPayload = {
      _id: vendor?._id,
      name: vendor?.name,
      email: vendor?.email,
      shiprocket_pickup_location: vendor?.shiprocket_pickup_location,
      store: {
        contact: vendor?.store?.contact,
        // Accept both store.address or store.addresses shapes
        address: vendor?.store?.address,
        addresses: vendor?.store?.addresses || vendor?.store?.address || null,
      },
    };

    const resp = await this.fetchJSON<{
      success: boolean;
      location_name?: string;
      error?: string;
    }>("/shiprocket/pickups/vendor", {
      method: "POST",
      body: JSON.stringify(vendorPayload),
    });
    return resp;
  }

  /**
   * Format order data from your system to Shiprocket format
   */
  formatOrderForShiprocket(
    order: any,
    address: any,
    user: any,
    vendorData?: any
  ): ShiprocketOrderRequest {
    return this.sdk.orders.formatOrderForShiprocket(
      order,
      address,
      user,
      vendorData
    );
  }

  /**
   * Map Shiprocket status to your system status
   */
  mapStatusToSystem(shiprocketStatus: string): string {
    return this.sdk.orders.mapStatusToSystem(shiprocketStatus);
  }

  /**
   * Check if status change should trigger email notification
   */
  shouldNotifyUser(shiprocketStatus: string): boolean {
    return this.sdk.orders.shouldNotifyUser(shiprocketStatus);
  }

  /**
   * Get notification type for email
   */
  getNotificationType(shiprocketStatus: string): string | null {
    return this.sdk.orders.getNotificationType(shiprocketStatus);
  }

  /**
   * Check authentication status
   */
  isAuthenticated(): boolean {
    return this.sdk.isAuthenticated();
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo() {
    return this.sdk.getTokenInfo();
  }
}

// Export types for backward compatibility
export type {
  ShiprocketOrderRequest,
  ShiprocketOrderResponse,
  ShiprocketTrackingResponse,
  ShiprocketPickupLocationRequest,
} from "../shiprocket/types";
