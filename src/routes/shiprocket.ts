import { Router, Request, Response } from 'express';
import { ShiprocketSDK } from '../shiprocket';

const router = Router();
const sdk = new ShiprocketSDK();

// Auth status
router.get('/auth/status', async (_req: Request, res: Response) => {
  res.json({ success: true, token: sdk.getTokenInfo() });
});

// Create order
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const payload = req.body; // Expecting ShiprocketOrderRequest format
    console.log('[shiprocket-backend] POST /shiprocket/orders', {
      order_id: payload?.order_id,
      pickup_location: payload?.pickup_location,
      items: Array.isArray(payload?.order_items) ? payload.order_items.length : 0,
    });
    const result = await sdk.orders.createOrder(payload);
    if (!result.success) {
      console.error('[shiprocket-backend] createOrder error', result.error);
    }
    res.status(result.success ? 200 : (result.error?.status || 400)).json(result);
  } catch (e) {
    console.error('[shiprocket-backend] createOrder exception', e);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Cancel orders
router.post('/orders/cancel', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: number[] };
    const result = await sdk.orders.cancelOrders(ids || []);
    res.status(result.success ? 200 : 400).json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to cancel orders' });
  }
});

// Generate pickup
router.post('/orders/pickup', async (req: Request, res: Response) => {
  try {
    const { shipmentIds } = req.body as { shipmentIds: number[] };
    const result = await sdk.orders.generatePickup(shipmentIds || []);
    res.status(result.success ? 200 : 400).json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to generate pickup' });
  }
});

// Tracking by AWB
router.get('/tracking/awb/:awb', async (req: Request, res: Response) => {
  try {
    const result = await sdk.tracking.trackByAWB(req.params.awb);
    res.status(result.success ? 200 : 400).json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to track by AWB' });
  }
});

// Tracking by Shiprocket order id
router.get('/tracking/order/:orderId', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.orderId, 10);
    const result = await sdk.tracking.trackByOrderId(id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to track by order id' });
  }
});

// Pickup locations
router.get('/pickups', async (_req: Request, res: Response) => {
  try {
    console.log('[shiprocket-backend] GET /shiprocket/pickups');
    const result = await sdk.pickups.getAllPickupLocations();
    if (!result.success) {
      console.error('[shiprocket-backend] getAllPickupLocations error', result.error);
    }
    res.status(result.success ? 200 : (result.error?.status || 400)).json(result);
  } catch (e) {
    console.error('[shiprocket-backend] getAllPickupLocations exception', e);
    res.status(500).json({ success: false, error: 'Failed to fetch pickup locations' });
  }
});

router.post('/pickups', async (req: Request, res: Response) => {
  try {
    console.log('[shiprocket-backend] POST /shiprocket/pickups', { pickup_location: req.body?.pickup_location });
    const result = await sdk.pickups.addPickupLocation(req.body);
    if (!result.success) {
      console.error('[shiprocket-backend] addPickupLocation error', result.error);
    }
    res.status(result.success ? 200 : (result.error?.status || 400)).json(result);
  } catch (e) {
    console.error('[shiprocket-backend] addPickupLocation exception', e);
    res.status(500).json({ success: false, error: 'Failed to add pickup location' });
  }
});

// Optional: create vendor pickup location from vendor payload
router.post('/pickups/vendor', async (req: Request, res: Response) => {
  try {
    console.log('[shiprocket-backend] POST /shiprocket/pickups/vendor', { vendor: req.body?.name || req.body?._id });
    const result = await sdk.pickups.createVendorPickupLocation(req.body);
    if (!result.success) {
      console.error('[shiprocket-backend] createVendorPickupLocation error', result.error);
    }
    res.status(result.success ? 200 : 400).json(result);
  } catch (e) {
    console.error('[shiprocket-backend] createVendorPickupLocation exception', e);
    res.status(500).json({ success: false, error: 'Failed to create vendor pickup location' });
  }
});

export default router;
