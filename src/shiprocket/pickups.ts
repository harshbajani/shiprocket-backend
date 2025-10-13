import { SHIPROCKET_CONFIG } from "./config";
import { ShiprocketHttpClient } from "./http-client";
import { ShiprocketAuth } from "./auth";
import {
  ShiprocketPickupLocationRequest,
  ShiprocketPickupLocationResponse,
  ShiprocketAPIResponse,
} from "./types";

export class ShiprocketPickups {
  private httpClient: ShiprocketHttpClient;
  private auth: ShiprocketAuth;

  constructor(httpClient?: ShiprocketHttpClient, auth?: ShiprocketAuth) {
    this.httpClient = httpClient || new ShiprocketHttpClient();
    this.auth = auth || new ShiprocketAuth(this.httpClient);
  }

  async getAllPickupLocations(): Promise<ShiprocketAPIResponse<any>> {
    try {
      console.log("[Shiprocket Pickups] Fetching all pickup locations");

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

      const response = await this.httpClient.get(
        SHIPROCKET_CONFIG.ENDPOINTS.GET_PICKUP_LOCATIONS,
        token
      );

      if (response.success) {
        console.log(
          "[Shiprocket Pickups] Successfully fetched pickup locations"
        );
      } else {
        console.error(
          "[Shiprocket Pickups] Failed to fetch pickup locations",
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error(
        "[Shiprocket Pickups] Error fetching pickup locations:",
        error
      );

      return {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch pickup locations",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  async addPickupLocation(
    locationData: ShiprocketPickupLocationRequest
  ): Promise<ShiprocketAPIResponse<ShiprocketPickupLocationResponse>> {
    try {
      console.log(
        `[Shiprocket Pickups] Adding pickup location: ${locationData.pickup_location}`
      );

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

      const response =
        await this.httpClient.post<ShiprocketPickupLocationResponse>(
          SHIPROCKET_CONFIG.ENDPOINTS.ADD_PICKUP_LOCATION,
          locationData,
          token
        );

      if (response.success) {
        console.log(
          `[Shiprocket Pickups] Successfully added pickup location: ${locationData.pickup_location}`
        );
      } else {
        console.error(
          `[Shiprocket Pickups] Failed to add pickup location: ${locationData.pickup_location}`,
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error(
        "[Shiprocket Pickups] Error adding pickup location:",
        error
      );

      return {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to add pickup location",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  async updateVendorPickupLocation(
    vendor: any,
    oldLocationName?: string
  ): Promise<{ success: boolean; location_name?: string; error?: string; updated?: boolean }> {
    try {
      console.log(`[Shiprocket Pickups] Updating pickup location for vendor: ${vendor.name}`);
      console.log(`[Shiprocket Pickups] Old location name: ${oldLocationName}`);
      
      const newLocationName = this.generateLocationName(vendor);
      console.log(`[Shiprocket Pickups] New location name: ${newLocationName}`);
      
      // If the location name hasn't changed, still proceed to update the address details
      if (oldLocationName && oldLocationName === newLocationName) {
        console.log(`[Shiprocket Pickups] Location name unchanged, but updating address details`);
      } else {
        console.log(`[Shiprocket Pickups] Location name changed from '${oldLocationName}' to '${newLocationName}'`);
      }
      
      // Create/update the pickup location with new details
      const result = await this.createVendorPickupLocation(vendor);
      
      if (result.success) {
        return {
          ...result,
          updated: oldLocationName !== newLocationName,
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error(
        "[Shiprocket Pickups] Error updating vendor pickup location:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async createVendorPickupLocation(
    vendor: any
  ): Promise<{ success: boolean; location_name?: string; error?: string }> {
    try {
      if (!vendor.store?.addresses) {
        return {
          success: false,
          error: "Vendor address not found",
        };
      }

      const address = vendor.store.addresses;
      const locationName = this.generateLocationName(vendor);

      const pickupLocationData: ShiprocketPickupLocationRequest = {
        pickup_location: locationName,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.store.contact,
        // Shiprocket requires House/Flat/Road No in address
        address: this.sanitizeAddressLine1(
          (address.address_line_1 || "").trim()
        ),
        address_2: (address.address_line_2 || address.locality || "").trim(),
        city: (
          address.city ||
          address.address_line_2 ||
          address.locality ||
          ""
        ).trim(),
        state: (address.state || "").trim(),
        country: "India",
        pin_code: (address.pincode || "").toString(),
      };

      console.log(
        `[Shiprocket Pickups] Creating pickup location for vendor: ${vendor.name}`
      );
      const response = await this.addPickupLocation(pickupLocationData);

      if (response.success) {
        return {
          success: true,
          location_name: locationName,
        };
      } else {
        // Check if the error is about existing inactive address
        const errorMessage =
          response.error?.message || response.error?.response || "";
        if (
          typeof errorMessage === "string" &&
          (errorMessage.includes(
            "Address name already exists and is inactive"
          ) ||
            errorMessage.includes("already exists and is inactive"))
        ) {
          console.log(
            `[Shiprocket Pickups] Pickup location ${locationName} already exists but is inactive. Using existing location.`
          );
          return {
            success: true,
            location_name: locationName,
          };
        }

        return {
          success: false,
          error: response.error?.message || "Failed to create pickup location",
        };
      }
    } catch (error) {
      console.error(
        "[Shiprocket Pickups] Error creating vendor pickup location:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private sanitizeAddressLine1(line1: string): string {
    if (!line1) return "";
    let s = line1.trim();
    s = s
      .replace(/\bMarg\b/gi, "Road")
      .replace(/\bRd\.?\b/gi, "Road")
      .replace(/\bSt\.?\b/gi, "Street");
    const hasKeyword = /(house|flat|plot|block|road|street|no\.?)/i.test(s);
    if (!hasKeyword) {
      const m = s.match(/\b(\d+[A-Za-z\-\/]*)\b/);
      if (m) s = `House No. ${m[1]}, ${s}`;
      else s = `House No. 1, ${s}`;
    }
    return s.substring(0, 120);
  }

  generateLocationName(vendor: any): string {
    console.log('[Shiprocket Pickups] Generating location name for vendor:', {
      vendorName: vendor.name,
      storeData: vendor.store,
      storeName: vendor.store?.storeName
    });
    
    // Try multiple ways to get the store name
    let storeName = vendor.store?.storeName || 
                   vendor.storeName || 
                   vendor.name || 
                   "Store";
    
    console.log('[Shiprocket Pickups] Raw store name:', storeName);
    
    // Clean and format the store name
    storeName = storeName.trim().replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
    
    // If still empty, use vendor name as fallback
    if (!storeName || storeName === "_" || storeName.length === 0) {
      storeName = (vendor.name || "Store").trim().replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
    }
    
    console.log('[Shiprocket Pickups] Cleaned store name:', storeName);
    
    const vendorId = vendor._id || "unknown";
    const vendorIdSuffix = vendorId.toString().slice(-8); // Last 8 characters
    
    // Calculate available space for store name (36 total - 1 underscore - 8 vendor suffix)
    const maxStoreNameLength = 36 - 1 - vendorIdSuffix.length;
    
    // Truncate store name if needed
    if (storeName.length > maxStoreNameLength) {
      storeName = storeName.slice(0, maxStoreNameLength);
    }
    
    // Build final name: StoreName_VendorId
    const baseName = `${storeName}_${vendorIdSuffix}`.replace(/[^a-zA-Z0-9_]/g, "_");
    
    // Final safety check for 36 character limit
    const finalName = baseName.length > 36 ? baseName.slice(0, 36) : baseName;
    
    console.log('[Shiprocket Pickups] Generated pickup location name:', {
      storeName,
      vendorIdSuffix,
      baseName,
      finalName,
      length: finalName.length
    });
    
    return finalName;
  }

  getVendorPickupLocation(vendor: any): string {
    return (
      vendor.shiprocket_pickup_location || this.generateLocationName(vendor)
    );
  }

  /**
   * Check if vendor has valid pickup location setup
   */
  hasValidPickupLocation(vendor: any): boolean {
    return !!(
      vendor.shiprocket_pickup_location &&
      vendor.shiprocket_pickup_location_added
    );
  }
}
