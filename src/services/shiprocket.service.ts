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
   * Add pickup location using SDK directly (backend implementation)
   */
  async addPickupLocation(
    locationData: ShiprocketPickupLocationRequest
  ): Promise<any> {
    const response = await this.sdk.pickups.addPickupLocation(locationData);
    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to add pickup location"
      );
    }
    return response.data;
  }

  /**
   * Get all pickup locations using SDK directly (backend implementation)
   */
  async getPickupLocations(): Promise<any> {
    const response = await this.sdk.pickups.getAllPickupLocations();
    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to get pickup locations"
      );
    }
    return response.data;
  }

  /**
   * Update pickup location for vendor using SDK directly (backend implementation)
   */
  async updateVendorPickupLocation(
    vendor: any,
    oldLocationName?: string
  ): Promise<{
    success: boolean;
    location_name?: string;
    error?: string;
    updated?: boolean;
  }> {
    try {
      const result = await this.sdk.pickups.updateVendorPickupLocation(
        vendor,
        oldLocationName
      );
      return result;
    } catch (error) {
      console.error(
        "[ShiprocketService] updateVendorPickupLocation error:",
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update vendor pickup location",
      };
    }
  }

  /**
   * Create pickup location for vendor using SDK directly (backend implementation)
   */
  async createVendorPickupLocation(
    vendor: any
  ): Promise<{ success: boolean; location_name?: string; error?: string }> {
    try {
      const result = await this.sdk.pickups.createVendorPickupLocation(vendor);
      return result;
    } catch (error) {
      console.error(
        "[ShiprocketService] createVendorPickupLocation error:",
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create vendor pickup location",
      };
    }
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

  /**
   * Calculate shipping rates
   */
  async calculateShippingRates(rateData: any): Promise<any> {
    const response = await this.sdk.rates.calculateRates(rateData);
    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to calculate shipping rates"
      );
    }
    return response.data;
  }

  /**
   * Get cheapest rate from rates array
   */
  getCheapestRate(rates: any[]): any {
    return this.sdk.rates.getCheapestRate(rates);
  }

  /**
   * Get fastest rate from rates array
   */
  getFastestRate(rates: any[]): any {
    return this.sdk.rates.getFastestRate(rates);
  }

  /**
   * Generate invoice for Shiprocket order(s)
   * @param orderIds - Array of Shiprocket order IDs
   * @returns Invoice URL and creation status
   */
  async printInvoice(orderIds: string[]): Promise<{
    is_invoice_created: boolean;
    invoice_url: string;
    not_created: string[];
    irn_no: string;
  }> {
    const response = await this.sdk.orders.printInvoice(orderIds);
    if (!response.success) {
      throw new Error(response.error?.message || "Failed to generate invoice");
    }
    return response.data!;
  }
}

// Export types for backward compatibility
export type {
  ShiprocketOrderRequest,
  ShiprocketOrderResponse,
  ShiprocketTrackingResponse,
  ShiprocketPickupLocationRequest,
} from "../shiprocket/types";
