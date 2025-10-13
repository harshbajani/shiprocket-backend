/**
 * Shiprocket SDK
 * Clean, modular Shiprocket integration for Next.js
 */

// Core modules
export { ShiprocketHttpClient } from "./http-client";
export { ShiprocketAuth } from "./auth";
export { ShiprocketOrders } from "./orders";
export { ShiprocketTracking } from "./tracking";
export { ShiprocketPickups } from "./pickups";
export { ShiprocketRates } from "./rates";

// Configuration
export {
  SHIPROCKET_CONFIG,
  validateConfig,
  getApiBaseUrl,
  isStaging,
} from "./config";

// Types
export * from "./types";

// Main SDK class
import { ShiprocketHttpClient } from "./http-client";
import { ShiprocketAuth } from "./auth";
import { ShiprocketOrders } from "./orders";
import { ShiprocketTracking } from "./tracking";
import { ShiprocketPickups } from "./pickups";
import { ShiprocketRates } from "./rates";

/**
 * Main Shiprocket SDK Class
 * Provides unified access to all Shiprocket modules
 */
export class ShiprocketSDK {
  public readonly http: ShiprocketHttpClient;
  public readonly auth: ShiprocketAuth;
  public readonly orders: ShiprocketOrders;
  public readonly tracking: ShiprocketTracking;
  public readonly pickups: ShiprocketPickups;
  public readonly rates: ShiprocketRates;

  constructor() {
    // Initialize HTTP client
    this.http = new ShiprocketHttpClient();

    // Initialize auth module
    this.auth = new ShiprocketAuth(this.http);

    // Initialize other modules with shared instances
    this.orders = new ShiprocketOrders(this.http, this.auth);
    this.tracking = new ShiprocketTracking(this.http, this.auth);
    this.pickups = new ShiprocketPickups(this.http, this.auth);
    this.rates = new ShiprocketRates(this.http, this.auth);
  }

  /**
   * Get authentication status
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    this.auth.clearAuth();
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo() {
    return this.auth.getTokenInfo();
  }
}

// Create singleton instance
let sdkInstance: ShiprocketSDK | null = null;

/**
 * Get Shiprocket SDK singleton instance
 */
export function getShiprocketSDK(): ShiprocketSDK {
  if (!sdkInstance) {
    sdkInstance = new ShiprocketSDK();
  }
  return sdkInstance;
}

/**
 * Reset SDK instance (for testing)
 */
export function resetShiprocketSDK(): void {
  sdkInstance = null;
}
