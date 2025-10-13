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
    try {
      console.log(`[Shiprocket Orders] Creating order: ${orderData.order_id}`);

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
      const response = await this.httpClient.post<ShiprocketOrderResponse>(
        SHIPROCKET_CONFIG.ENDPOINTS.CREATE_ORDER,
        orderData,
        token
      );

      if (response.success) {
        console.log(
          `[Shiprocket Orders] Order created successfully: ${orderData.order_id}`
        );
      } else {
        console.error(
          `[Shiprocket Orders] Failed to create order: ${orderData.order_id}`,
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error("[Shiprocket Orders] Error creating order:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to create order",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  async cancelOrders(orderIds: number[]): Promise<ShiprocketAPIResponse<any>> {
    try {
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
      const response = await this.httpClient.post(
        SHIPROCKET_CONFIG.ENDPOINTS.CANCEL_ORDER,
        { ids: orderIds },
        token
      );

      if (response.success) {
        console.log(
          `[Shiprocket Orders] Orders cancelled successfully:`,
          orderIds
        );
      } else {
        console.error(
          `[Shiprocket Orders] Failed to cancel orders:`,
          orderIds,
          response.error
        );
      }
      return response;
    } catch (error) {
      console.error("[Shiprocket Orders] Error cancelling orders:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to cancel orders",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  async generatePickup(
    orderIds: number[]
  ): Promise<ShiprocketAPIResponse<any>> {
    try {
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

      const response = await this.httpClient.post(
        SHIPROCKET_CONFIG.ENDPOINTS.GENERATE_PICKUP,
        { shipment_id: orderIds },
        token
      );

      if (response.success) {
        console.log(
          `[Shiprocket Orders] Pickup generated successfully:`,
          orderIds
        );
      } else {
        console.error(
          `[Shiprocket Orders] Failed to generate pickup:`,
          orderIds,
          response.error
        );
      }

      return response;
    } catch (error) {
      console.error("[Shiprocket Orders] Error generating pickup:", error);

      return {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate pickup",
          status: 500,
          statusText: "Internal Server Error",
          response: error,
        },
      };
    }
  }

  formatOrderForShiprocket(
    order: any,
    address: any,
    user: any,
    vendorData?: any
  ): ShiprocketOrderRequest {
    console.log("[Shiprocket] Formatting order for Shiprocket:", {
      orderId: order.orderId,
      itemCount: order.items?.length,
      hasProductData: order.items?.[0]?.productData ? "Yes" : "No",
    });

    // Calculate total weight and dimensions from products
    let totalWeight = 0;
    let maxLength = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.length;
    let maxWidth = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.breadth;
    let maxHeight = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.height;

    order.items.forEach((item: any) => {
      // Direct access to populated product data (productId is populated object)
      let itemWeight = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.weight;
      let itemLength = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.length;
      let itemWidth = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.breadth;
      let itemHeight = SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.height;

      // Check if productId is populated (object vs string)
      if (item.productId && typeof item.productId === "object") {
        // Direct access to product data - no complex transformation needed
        const product = item.productId;

        // Get weight (appliedWeight takes precedence over deadWeight)
        itemWeight =
          product.appliedWeight ||
          product.deadWeight ||
          SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.weight;

        // Get dimensions
        if (product.dimensions) {
          itemLength =
            product.dimensions.length ||
            SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.length;
          itemWidth =
            product.dimensions.width ||
            SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.breadth;
          itemHeight =
            product.dimensions.height ||
            SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.height;
        }

        console.log(
          `[Shiprocket] Item ${item.productName}: weight=${itemWeight}kg, dimensions=${itemLength}x${itemWidth}x${itemHeight}cm`
        );
      } else {
        console.log(
          `[Shiprocket] Item ${item.productName}: using defaults (product not populated)`
        );
      }

      // Update maximum dimensions for the package
      maxLength = Math.max(maxLength, itemLength);
      maxWidth = Math.max(maxWidth, itemWidth);
      maxHeight = Math.max(maxHeight, itemHeight);

      // Add to total weight
      totalWeight += (item.quantity || 1) * itemWeight;
    });

    // Ensure minimum weight and valid number
    totalWeight =
      isNaN(totalWeight) || totalWeight <= 0 ? 0.5 : Math.max(totalWeight, 0.5);

    // Ensure dimensions are valid numbers
    maxLength =
      isNaN(maxLength) || maxLength <= 0
        ? SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.length
        : maxLength;
    maxWidth =
      isNaN(maxWidth) || maxWidth <= 0
        ? SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.breadth
        : maxWidth;
    maxHeight =
      isNaN(maxHeight) || maxHeight <= 0
        ? SHIPROCKET_CONFIG.DEFAULT_DIMENSIONS.height
        : maxHeight;

    console.log("[Shiprocket] Calculated totals:", {
      totalWeight: totalWeight + "kg",
      dimensions: `${Math.round(maxLength)}x${Math.round(
        maxWidth
      )}x${Math.round(maxHeight)}cm`,
    });

    // Determine pickup location based on vendor or use default
    let pickupLocation = vendorData?.shiprocket_pickup_location;

    if (!pickupLocation && vendorData) {
      // Generate pickup location name with 36 character limit
      const storeName = vendorData?.store?.storeName || "Store";
      const vendorId = vendorData?._id || "default";
      let baseName = `${storeName}_${vendorId}`.replace(/[^a-zA-Z0-9_]/g, "_");

      // Enforce 36 character limit (Shiprocket requirement)
      if (baseName.length > 36) {
        const vendorIdSuffix = vendorId.slice(-8);
        const maxStoreNameLength = 36 - vendorIdSuffix.length - 1;
        const truncatedStoreName = storeName.slice(0, maxStoreNameLength);
        baseName = `${truncatedStoreName}_${vendorIdSuffix}`.replace(
          /[^a-zA-Z0-9_]/g,
          "_"
        );

        if (baseName.length > 36) {
          baseName = baseName.slice(0, 36);
        }
      }

      pickupLocation = baseName;
    }

    if (!pickupLocation) {
      pickupLocation = SHIPROCKET_CONFIG.DEFAULT_PICKUP_LOCATION;
    }

    return {
      order_id: order.orderId,
      order_date: new Date(order.createdAt).toISOString().split("T")[0], // YYYY-MM-DD format
      pickup_location: pickupLocation,
      channel_id: SHIPROCKET_CONFIG.DEFAULT_CHANNEL_ID,
      comment: `Order from Gujarat Store - ${order.orderId}`,

      // Billing address
      billing_customer_name:
        address.name?.split(" ")[0] ||
        address.name ||
        user.name?.split(" ")[0] ||
        "Customer",
      billing_last_name:
        address.name?.split(" ").slice(1).join(" ") ||
        user.name?.split(" ").slice(1).join(" ") ||
        "",
      billing_address: address.address_line_1 || "",
      billing_address_2: address.address_line_2 || "",
      billing_city: address.locality || address.city || "",
      billing_pincode: address.pincode || address.pin_code || "",
      billing_state: address.state || "",
      billing_country: "India",
      billing_email: user.email || "",
      billing_phone: address.contact || user.phone || "",

      // Shipping address (explicitly provide even if same as billing for better compatibility)
      shipping_is_billing: false,
      shipping_customer_name:
        address.name?.split(" ")[0] ||
        address.name ||
        user.name?.split(" ")[0] ||
        "Customer",
      shipping_last_name:
        address.name?.split(" ").slice(1).join(" ") ||
        user.name?.split(" ").slice(1).join(" ") ||
        "",
      shipping_address: address.address_line_1 || "",
      shipping_address_2: address.address_line_2 || "",
      shipping_city: address.locality || address.city || "",
      shipping_pincode: address.pincode || address.pin_code || "",
      shipping_state: address.state || "",
      shipping_country: "India",
      shipping_email: user.email || "",
      shipping_phone: address.contact || user.phone || "",

      // Order items - direct access to order item fields
      order_items: order.items.map((item: any) => {
        // Use the productId as SKU - if it's populated, get the _id, otherwise use as-is
        const itemSku =
          typeof item.productId === "object" && item.productId._id
            ? item.productId._id.toString()
            : item.productId
            ? item.productId.toString()
            : "SKU";

        return {
          name: item.productName || "Product",
          sku: itemSku,
          units: item.quantity || 1,
          selling_price: item.price || 0,
          discount: 0,
          tax: 0,
          hsn: 0,
          category: "General",
        };
      }),

      // Payment and pricing
      payment_method:
        order.paymentOption === "cash-on-delivery" ? "COD" : "Prepaid",
      shipping_charges: order.deliveryCharges,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: order.discountAmount || 0,
      sub_total: order.subtotal,

      // Package dimensions - use calculated values from products
      length: Math.round(maxLength),
      breadth: Math.round(maxWidth),
      height: Math.round(maxHeight),
      weight: Math.max(totalWeight, 0.5), // Minimum weight of 0.5kg
    };
  }

  /**
   * Map Shiprocket status to your system status
   */
  mapStatusToSystem(shiprocketStatus: string): string {
    const status = shiprocketStatus.toUpperCase();
    return SHIPROCKET_CONFIG.STATUS_MAPPING[status] || "processing";
  }

  /**
   * Check if status change should trigger email notification
   */
  shouldNotifyUser(shiprocketStatus: string): boolean {
    const status = shiprocketStatus.toUpperCase();
    return Object.keys(SHIPROCKET_CONFIG.NOTIFICATION_MAPPING).includes(status);
  }

  /**
   * Get notification type for email
   */
  getNotificationType(shiprocketStatus: string): string | null {
    const status = shiprocketStatus.toUpperCase();
    return SHIPROCKET_CONFIG.NOTIFICATION_MAPPING[status] || null;
  }
}
