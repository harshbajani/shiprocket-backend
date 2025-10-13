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
    try {
      console.log(`[Shiprocket Tracking] Tracking by AWB: ${awbCode}`);

      const token = await this.auth.getToken();
      if (!token) {
        return {
          success: false,
          error: {
            message: "Authentication failed",
            status: 401,
            statusText: "Unauthorized",
          },
        };
      }

      const response = await this.httpClient.get<ShiprocketTrackingResponse>(
        `${SHIPROCKET_CONFIG.ENDPOINTS.TRACK_ORDER}/${awbCode}`,
        token
      );

      if (response.success) {
        console.log(
          `[Shiprocket Tracking] Successfully tracked AWB: ${awbCode}`
        );
      } else {
        console.error(
          `[Shiprocket Tracking] Failed to track AWB: ${awbCode}`,
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error("[Shiprocket Tracking] Error tracking by AWB:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to track order",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  async trackByOrderId(
    orderId: number
  ): Promise<ShiprocketAPIResponse<ShiprocketTrackingResponse>> {
    try {
      console.log(`[Shiprocket Tracking] Tracking by order ID: ${orderId}`);

      const token = await this.auth.getToken();
      if (!token) {
        return {
          success: false,
          error: {
            message: "Authentication failed",
            status: 401,
            statusText: "Unauthorized",
          },
        };
      }

      const response = await this.httpClient.get<ShiprocketTrackingResponse>(
        `${SHIPROCKET_CONFIG.ENDPOINTS.TRACK_BY_ORDER_ID}?order_id=${orderId}`,
        token
      );

      if (response.success) {
        console.log(
          `[Shiprocket Tracking] Successfully tracked order ID: ${orderId}`
        );
      } else {
        console.error(
          `[Shiprocket Tracking] Failed to track order ID: ${orderId}`,
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error("[Shiprocket Tracking] Error tracking by order ID:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to track order",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  getShipmentStatus(trackingData: ShiprocketTrackingResponse): {
    status: string;
    lastActivity?: string;
    lastLocation?: string;
    lastUpdate?: string;
    deliveredDate?: string;
    pickupDate?: string;
    edd?: string;
  } {
    const data = trackingData.tracking_data;
    const shipmentTrack = data.shipment_track[0]; // Get first (latest) tracking info
    const lastActivity = data.shipment_track_activities[0]; // Get latest activity

    return {
      status: data.shipment_status,
      lastActivity: lastActivity?.activity,
      lastLocation: lastActivity?.location,
      lastUpdate: lastActivity?.date,
      deliveredDate: shipmentTrack?.delivered_date || undefined,
      pickupDate: shipmentTrack?.pickup_date || undefined,
      edd: shipmentTrack?.edd || undefined,
    };
  }

  formatTrackingHistory(trackingData: ShiprocketTrackingResponse): Array<{
    date: string;
    status: string;
    activity: string;
    location: string;
    timestamp: Date;
  }> {
    return trackingData.tracking_data.shipment_track_activities
      .map((activity) => ({
        ...activity,
        timestamp: new Date(activity.date),
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by latest first
  }

  isDelivered(trackingData: ShiprocketTrackingResponse): boolean {
    const status = trackingData.tracking_data.shipment_status.toUpperCase();
    return status === "DELIVERED";
  }

  /**
   * Check if order is in transit
   */
  isInTransit(trackingData: ShiprocketTrackingResponse): boolean {
    const status = trackingData.tracking_data.shipment_status.toUpperCase();
    return ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"].includes(status);
  }

  /**
   * Check if order is cancelled or returned
   */
  isCancelledOrReturned(trackingData: ShiprocketTrackingResponse): boolean {
    const status = trackingData.tracking_data.shipment_status.toUpperCase();
    return [
      "CANCELLED",
      "RETURNED",
      "RTO_INITIATED",
      "RTO_DELIVERED",
      "LOST",
      "DAMAGED",
    ].includes(status);
  }

  /**
   * Get estimated delivery date
   */
  getEstimatedDelivery(trackingData: ShiprocketTrackingResponse): Date | null {
    const edd = trackingData.tracking_data.shipment_track[0]?.edd;
    return edd ? new Date(edd) : null;
  }

  /**
   * Generate tracking URL for customer
   */
  getTrackingUrl(awbCode: string): string {
    return `https://shiprocket.co/tracking/${awbCode}`;
  }
}
