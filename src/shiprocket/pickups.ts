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
    return this.httpClient.get(
      SHIPROCKET_CONFIG.ENDPOINTS.GET_PICKUP_LOCATIONS,
      token
    );
  }

  async addPickupLocation(
    locationData: ShiprocketPickupLocationRequest
  ): Promise<ShiprocketAPIResponse<ShiprocketPickupLocationResponse>> {
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
    return this.httpClient.post<ShiprocketPickupLocationResponse>(
      SHIPROCKET_CONFIG.ENDPOINTS.ADD_PICKUP_LOCATION,
      locationData,
      token
    );
  }

  async createVendorPickupLocation(
    vendor: any
  ): Promise<{ success: boolean; location_name?: string; error?: string }> {
    try {
      const storeObj = vendor?.store || {};
      const address = storeObj.address || storeObj.addresses;
      if (!address)
        return { success: false, error: "Vendor address not found" };
      const locationName = this.generateLocationName(vendor);
      const pickupLocationData: ShiprocketPickupLocationRequest = {
        pickup_location: locationName,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.store.contact,
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
      const response = await this.addPickupLocation(pickupLocationData);
      if (response.success)
        return { success: true, location_name: locationName };
      const errMsg =
        response.error?.message || String(response.error?.response || "");
      if (errMsg.includes("already exists and is inactive"))
        return { success: true, location_name: locationName };
      return {
        success: false,
        error: response.error?.message || "Failed to create pickup location",
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
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
    const storeName = vendor.store?.storeName || "Store";
    const vendorId = vendor._id || "unknown";
    let baseName = `${storeName}_${vendorId}`.replace(/[^a-zA-Z0-9_]/g, "_");
    if (baseName.length > 36) {
      const vendorIdSuffix = vendorId.slice(-8);
      const maxStoreNameLength = 36 - vendorIdSuffix.length - 1;
      const truncatedStoreName = storeName.slice(0, maxStoreNameLength);
      baseName = `${truncatedStoreName}_${vendorIdSuffix}`.replace(
        /[^a-zA-Z0-9_]/g,
        "_"
      );
    }
    return baseName;
  }
}
