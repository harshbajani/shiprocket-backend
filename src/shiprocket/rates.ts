import { SHIPROCKET_CONFIG } from "./config";
import { ShiprocketHttpClient } from "./http-client";
import { ShiprocketAuth } from "./auth";
import { ShiprocketAPIResponse } from "./types";

export interface ShippingRateRequest {
  pickup_postcode: string;
  delivery_postcode: string;
  weight: number;
  length?: number;
  breadth?: number;
  height?: number;
  cod?: number;
  declared_value?: number;
}

export interface CourierRate {
  courier_name: string;
  rate: number;
  estimated_delivery_date: string;
  cod_charges: number;
  fuel_surcharge: number;
  total_rate: number;
  description?: string;
  pickup_performance?: number;
  delivery_performance?: number;
}

export interface ShippingRateResponse {
  rates: CourierRate[];
  request_data: ShippingRateRequest;
}

export class ShiprocketRates {
  private httpClient: ShiprocketHttpClient;
  private auth: ShiprocketAuth;

  constructor(httpClient?: ShiprocketHttpClient, auth?: ShiprocketAuth) {
    this.httpClient = httpClient || new ShiprocketHttpClient();
    this.auth = auth || new ShiprocketAuth(this.httpClient);
  }

  async calculateRates(
    rateData: ShippingRateRequest
  ): Promise<ShiprocketAPIResponse<ShippingRateResponse>> {
    try {
      console.log(`[Shiprocket Rates] Calculating rates from ${rateData.pickup_postcode} to ${rateData.delivery_postcode}`);

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

      // Prepare query parameters for the rate calculation API
      const queryParams = new URLSearchParams({
        pickup_postcode: rateData.pickup_postcode.toString(),
        delivery_postcode: rateData.delivery_postcode.toString(),
        weight: rateData.weight.toString(),
        length: (rateData.length || 10).toString(),
        breadth: (rateData.breadth || 10).toString(),
        height: (rateData.height || 10).toString(),
        cod: (rateData.cod || 0).toString(),
        declared_value: (rateData.declared_value || 100).toString(),
      });

      const response = await this.httpClient.get(
        `/courier/serviceability/?${queryParams.toString()}`,
        token
      );

      if (response.success && response.data) {
        const responseData = response.data as any;
        const rates = responseData.data?.available_courier_companies || [];

        // Transform the response to a more usable format
        const transformedRates: CourierRate[] = rates
          .map((courier: any) => ({
            courier_name: courier.courier_name,
            rate: parseFloat(courier.rate || 0),
            estimated_delivery_date:
              courier.etd ||
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
            cod_charges: parseFloat(courier.cod_charges || 0),
            fuel_surcharge: parseFloat(courier.other_charges || 0),
            total_rate: parseFloat(courier.freight_charge || courier.rate || 0),
            description: courier.description,
            pickup_performance: courier.pickup_performance,
            delivery_performance: courier.delivery_performance,
          }))
          .sort((a: CourierRate, b: CourierRate) => a.total_rate - b.total_rate); // Sort by price

        const result: ShippingRateResponse = {
          rates: transformedRates,
          request_data: rateData,
        };

        console.log(
          `[Shiprocket Rates] Successfully calculated ${transformedRates.length} rates`
        );

        return {
          success: true,
          data: result,
        };
      } else {
        console.error(
          "[Shiprocket Rates] API Error:",
          response.error
        );
        return {
          success: false,
          error: {
            message: response.error?.message || "Failed to calculate shipping rates",
            status: response.error?.status || 400,
            statusText: response.error?.statusText || "Bad Request",
            response: response.error?.response,
          },
        };
      }
    } catch (error) {
      console.error("[Shiprocket Rates] Error calculating rates:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to calculate shipping rates",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  /**
   * Get cheapest rate from calculated rates
   */
  getCheapestRate(rates: CourierRate[]): CourierRate | null {
    if (!rates || rates.length === 0) return null;
    return rates.reduce((cheapest, current) => 
      current.total_rate < cheapest.total_rate ? current : cheapest
    );
  }

  /**
   * Get fastest rate from calculated rates (shortest ETA)
   */
  getFastestRate(rates: CourierRate[]): CourierRate | null {
    if (!rates || rates.length === 0) return null;
    return rates.reduce((fastest, current) => {
      const fastestDate = new Date(fastest.estimated_delivery_date);
      const currentDate = new Date(current.estimated_delivery_date);
      return currentDate < fastestDate ? current : fastest;
    });
  }

  /**
   * Filter rates by courier name
   */
  filterRatesByCourier(rates: CourierRate[], courierName: string): CourierRate[] {
    return rates.filter(rate => 
      rate.courier_name.toLowerCase().includes(courierName.toLowerCase())
    );
  }

  /**
   * Check if COD is available for the route
   */
  isCODAvailable(rates: CourierRate[]): boolean {
    return rates.some(rate => rate.cod_charges >= 0);
  }
}