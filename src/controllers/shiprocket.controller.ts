import { Request, Response } from "express";
import { ShiprocketService } from "../services/shiprocket.service";

export class ShiprocketController {
  private shiprocketService = ShiprocketService.getInstance();

  // Auth status
  async getAuthStatus(req: Request, res: Response) {
    try {
      const tokenInfo = this.shiprocketService.getTokenInfo();
      res.json({ success: true, token: tokenInfo });
    } catch (error) {
      console.error("[ShiprocketController] getAuthStatus error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to get auth status" });
    }
  }

  // Create order
  async createOrder(req: Request, res: Response) {
    try {
      const payload = req.body;
      console.log("[ShiprocketController] createOrder payload:", {
        order_id: payload?.order_id,
        pickup_location: payload?.pickup_location,
        items: Array.isArray(payload?.order_items)
          ? payload.order_items.length
          : 0,
        payment_method: payload?.payment_method,
        billing_customer_name: payload?.billing_customer_name,
        sub_total: payload?.sub_total,
        weight: payload?.weight,
      });

      // Validate required fields
      const requiredFields = [
        "order_id",
        "order_date",
        "payment_method",
        "order_items",
        "sub_total",
        "billing_customer_name",
        "billing_address",
        "billing_state",
        "billing_country",
        "billing_phone",
        "billing_pincode",
        "length",
        "breadth",
        "height",
        "weight",
      ];

      const missingFields = requiredFields.filter(
        (field) =>
          payload[field] === undefined ||
          payload[field] === null ||
          payload[field] === ""
      );

      // Special validation for shipping_is_billing (can be true or false)
      if (
        payload.shipping_is_billing === undefined ||
        payload.shipping_is_billing === null
      ) {
        missingFields.push("shipping_is_billing");
      }

      if (missingFields.length > 0) {
        console.error(
          "[ShiprocketController] Missing required fields:",
          missingFields
        );
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      const result = await this.shiprocketService.createOrder(payload);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[ShiprocketController] createOrder error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create order";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Cancel orders
  async cancelOrders(req: Request, res: Response) {
    try {
      const { ids } = req.body as { ids: number[] };
      const result = await this.shiprocketService.cancelOrder(ids || []);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[ShiprocketController] cancelOrders error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to cancel orders";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Track by AWB
  async trackByAWB(req: Request, res: Response) {
    try {
      const awb = req.params.awb;
      const result = await this.shiprocketService.trackOrderByAWB(awb);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[ShiprocketController] trackByAWB error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to track by AWB";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Track by order ID
  async trackByOrderId(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const result = await this.shiprocketService.trackOrderById(orderId);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[ShiprocketController] trackByOrderId error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to track by order ID";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Get pickup locations
  async getPickupLocations(req: Request, res: Response) {
    try {
      console.log("[ShiprocketController] getPickupLocations");
      const result = await this.shiprocketService.getPickupLocations();
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[ShiprocketController] getPickupLocations error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch pickup locations";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Add pickup location
  async addPickupLocation(req: Request, res: Response) {
    try {
      console.log("[ShiprocketController] addPickupLocation", {
        pickup_location: req.body?.pickup_location,
      });
      const result = await this.shiprocketService.addPickupLocation(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[ShiprocketController] addPickupLocation error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add pickup location";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Create vendor pickup location
  async createVendorPickupLocation(req: Request, res: Response) {
    try {
      console.log("[ShiprocketController] createVendorPickupLocation", {
        vendor: req.body?.name || req.body?._id,
      });
      const result = await this.shiprocketService.createVendorPickupLocation(
        req.body
      );
      res.json(result);
    } catch (error) {
      console.error(
        "[ShiprocketController] createVendorPickupLocation error:",
        error
      );
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create vendor pickup location";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Update vendor pickup location
  async updateVendorPickupLocation(req: Request, res: Response) {
    try {
      const { oldLocationName, ...vendorData } = req.body;
      console.log("[ShiprocketController] updateVendorPickupLocation", {
        vendor: vendorData?.name || vendorData?._id,
        oldLocation: oldLocationName,
      });
      const result = await this.shiprocketService.updateVendorPickupLocation(
        vendorData,
        oldLocationName
      );
      res.json(result);
    } catch (error) {
      console.error(
        "[ShiprocketController] updateVendorPickupLocation error:",
        error
      );
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update vendor pickup location";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Calculate shipping rates
  async calculateRates(req: Request, res: Response) {
    try {
      const {
        pickup_postcode,
        delivery_postcode,
        weight,
        length,
        breadth,
        height,
        cod,
        declared_value,
      } = req.body;

      // Basic validation
      if (!pickup_postcode || !delivery_postcode || !weight) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required parameters: pickup_postcode, delivery_postcode, weight",
        });
      }

      const rateRequestData = {
        pickup_postcode: pickup_postcode.toString(),
        delivery_postcode: delivery_postcode.toString(),
        weight: parseFloat(weight.toString()),
        length: parseInt(length?.toString() || "10"),
        breadth: parseInt(breadth?.toString() || "10"),
        height: parseInt(height?.toString() || "10"),
        cod: parseInt(cod?.toString() || "0"),
        declared_value: parseFloat(declared_value?.toString() || "100"),
      };

      console.log("[ShiprocketController] calculateRates", rateRequestData);
      const result = await this.shiprocketService.calculateShippingRates(
        rateRequestData
      );
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[ShiprocketController] calculateRates error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to calculate shipping rates";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Webhook handler
  async handleWebhook(req: Request, res: Response) {
    try {
      console.log("[ShiprocketController] handleWebhook", req.body);

      const payload = req.body;

      // Convert payload to standard format
      const webhookData = {
        order_id: payload.order_id,
        shipment_id: payload.shipment_id,
        current_status: payload.current_status,
        awb_code: payload.awb || payload.awb_code,
        courier_name: payload.courier_name,
        delivered_date: payload.delivered_date,
        pickup_date: payload.pickup_date,
        activities: payload.scans?.map((scan: any) => ({
          date: scan.date,
          status: scan.status,
          activity: scan.activity,
          location: scan.location,
        })),
      };

      // Here you would typically update your order database
      console.log("[ShiprocketController] Webhook processed:", {
        order_id: webhookData.order_id,
        status: webhookData.current_status,
        awb: webhookData.awb_code,
      });

      res.json({
        success: true,
        message: "Webhook processed successfully",
      });
    } catch (error) {
      console.error("[ShiprocketController] handleWebhook error:", error);
      const message =
        error instanceof Error ? error.message : "Webhook processing failed";
      res.status(500).json({ success: false, error: message });
    }
  }

  // Webhook verification endpoint
  async verifyWebhook(req: Request, res: Response) {
    res.json({
      success: true,
      message: "Shiprocket webhook endpoint is active",
      timestamp: new Date().toISOString(),
    });
  }

  // Status sync handler
  async syncStatus(req: Request, res: Response) {
    try {
      const authorization = req.headers.authorization;

      // Simple API key validation for cron job security
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      console.log("[ShiprocketController] Starting status sync...");

      // This would typically sync order statuses from Shiprocket
      // For now, return success with mock results
      const results = {
        total: 0,
        updated: 0,
        errors: 0,
        notifications_sent: 0,
      };

      console.log("[ShiprocketController] Status sync completed:", results);

      res.json({
        success: true,
        message: "Status sync completed",
        results,
      });
    } catch (error) {
      console.error("[ShiprocketController] syncStatus error:", error);
      const message = error instanceof Error ? error.message : "Sync failed";
      res.status(500).json({ success: false, error: message });
    }
  }

  // Get sync status
  async getSyncStatus(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        active_shipments: 0, // This would be calculated from your database
        last_sync: null,
        sync_endpoint: "/api/shiprocket/sync-status",
        webhook_endpoint: "/api/shiprocket/webhook",
      });
    } catch (error) {
      console.error("[ShiprocketController] getSyncStatus error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to get sync status";
      res.status(500).json({ success: false, error: message });
    }
  }

  // Advanced tracking with email notifications
  async trackOrderAdvanced(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const type = req.query.type || "order"; // 'order' or 'shipment' or 'awb'
      const sendEmail = req.query.sendEmail === "true";

      if (!id) {
        return res
          .status(400)
          .json({ success: false, error: "ID is required" });
      }

      let trackingResponse;

      if (type === "awb") {
        trackingResponse = await this.shiprocketService.trackOrderByAWB(id);
      } else if (type === "order") {
        trackingResponse = await this.shiprocketService.trackOrderById(
          parseInt(id)
        );
      } else {
        return res
          .status(400)
          .json({ success: false, error: "Invalid tracking type" });
      }

      // Format tracking response
      const shipmentTrack = trackingResponse.tracking_data?.shipment_track?.[0];
      const trackingActivities =
        trackingResponse.tracking_data?.shipment_track_activities || [];

      if (!shipmentTrack) {
        return res
          .status(404)
          .json({ success: false, error: "No tracking data found" });
      }

      const formattedTracking = {
        awb_code: shipmentTrack.awb_code,
        courier_name:
          (shipmentTrack as any).courier_name ||
          `Courier ${shipmentTrack.courier_company_id}`,
        shipping_status: shipmentTrack.current_status,
        pickup_date: shipmentTrack.pickup_date,
        delivered_date: shipmentTrack.delivered_date,
        eta: shipmentTrack.edd,
        last_update: new Date().toISOString(),
        shipping_history: trackingActivities
          .map((activity: any) => ({
            status: activity.status,
            activity: activity.activity,
            location: activity.location,
            date: activity.date,
            time: activity.time || null,
          }))
          .reverse(),
        order_id: shipmentTrack.order_id,
        shipment_id: shipmentTrack.shipment_id,
        origin: shipmentTrack.origin,
        destination: shipmentTrack.destination,
        consignee_name: shipmentTrack.consignee_name,
      };

      // If sendEmail is true, you would send notification here
      // This is a placeholder - you'd need to implement email logic
      if (sendEmail) {
        console.log(
          "[ShiprocketController] Email notification would be sent here"
        );
      }

      res.json({
        success: true,
        tracking: formattedTracking,
        emailSent: sendEmail,
      });
    } catch (error) {
      console.error("[ShiprocketController] trackOrderAdvanced error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to track order";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Apply calculated shipping rate to order
  async applyShippingRate(req: Request, res: Response) {
    try {
      const {
        orderId,
        courierName,
        shippingRate,
        estimatedDelivery,
        rateDetails,
      } = req.body;

      // Basic validation
      if (!orderId || !courierName || !shippingRate) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required parameters: orderId, courierName, shippingRate",
        });
      }

      // Here you would update your order database
      // This is a placeholder - you'd need to implement database logic
      console.log("[ShiprocketController] Apply shipping rate:", {
        orderId,
        courierName,
        shippingRate,
        estimatedDelivery,
      });

      // Mock response - replace with actual database update
      const updateData = {
        courierName,
        shippingRate,
        estimatedDelivery,
        deliveryCharges: Math.round(shippingRate),
      };

      res.json({
        success: true,
        message: "Shipping rate applied successfully",
        data: updateData,
      });
    } catch (error) {
      console.error("[ShiprocketController] applyShippingRate error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to apply shipping rate";
      res.status(500).json({ success: false, error: message });
    }
  }

  // Advanced pickup location management
  async managePickupLocations(req: Request, res: Response) {
    try {
      const action = req.query.action || req.body.action;

      switch (action) {
        case "list":
          const locations = await this.shiprocketService.getPickupLocations();
          res.json({ success: true, data: locations });
          break;

        case "create-admin":
          const {
            pickup_location,
            name,
            email,
            phone,
            address,
            address_2,
            city,
            state,
            country,
            pin_code,
          } = req.body;

          if (
            !pickup_location ||
            !name ||
            !email ||
            !phone ||
            !address ||
            !city ||
            !state ||
            !country ||
            !pin_code
          ) {
            return res.status(400).json({
              success: false,
              error: "Missing required fields for pickup location creation",
            });
          }

          const result = await this.shiprocketService.addPickupLocation({
            pickup_location,
            name,
            email,
            phone,
            address,
            address_2: address_2 || "",
            city,
            state,
            country,
            pin_code,
          });

          res.json({
            success: true,
            message: "Pickup location created successfully",
            data: result,
          });
          break;

        default:
          res.status(400).json({ success: false, error: "Invalid action" });
      }
    } catch (error) {
      console.error(
        "[ShiprocketController] managePickupLocations error:",
        error
      );
      const message =
        error instanceof Error
          ? error.message
          : "Failed to manage pickup locations";
      res.status(500).json({ success: false, error: message });
    }
  }

  // Generate invoice
  async generateInvoice(req: Request, res: Response) {
    try {
      const { ids } = req.body as { ids: string[] };

      // Validate input
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Order IDs are required (array of strings)",
        });
      }

      console.log("[ShiprocketController] generateInvoice", { ids });

      const result = await this.shiprocketService.printInvoice(ids);

      // Check if any orders failed
      if (result.not_created && result.not_created.length > 0) {
        console.warn(
          "[ShiprocketController] Some invoices not created:",
          result.not_created
        );
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("[ShiprocketController] generateInvoice error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to generate invoice";
      res.status(400).json({ success: false, error: message });
    }
  }

  // Download invoice - alternative endpoint that redirects to invoice URL
  async downloadInvoice(req: Request, res: Response) {
    try {
      const { ids } = req.body as { ids: string[] };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Order IDs are required",
        });
      }

      console.log("[ShiprocketController] downloadInvoice", { ids });

      const result = await this.shiprocketService.printInvoice(ids);

      if (!result.is_invoice_created || !result.invoice_url) {
        return res.status(400).json({
          success: false,
          error: "Invoice could not be generated",
          not_created: result.not_created,
        });
      }

      // Return the URL for frontend to handle download
      res.json({
        success: true,
        data: {
          invoice_url: result.invoice_url,
          is_invoice_created: result.is_invoice_created,
          not_created: result.not_created,
          irn_no: result.irn_no,
        },
      });
    } catch (error) {
      console.error("[ShiprocketController] downloadInvoice error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to download invoice";
      res.status(400).json({ success: false, error: message });
    }
  }
}
