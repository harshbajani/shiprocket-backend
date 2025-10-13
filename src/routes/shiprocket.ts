import { Router } from 'express';
import { ShiprocketController } from '../controllers/shiprocket.controller';

const router = Router();
const controller = new ShiprocketController();

// Auth status
router.get('/auth/status', controller.getAuthStatus.bind(controller));

// Create order
router.post('/orders', controller.createOrder.bind(controller));

// Cancel orders
router.post('/orders/cancel', controller.cancelOrders.bind(controller));

// Tracking by AWB
router.get('/tracking/awb/:awb', controller.trackByAWB.bind(controller));

// Tracking by Shiprocket order id
router.get('/tracking/order/:orderId', controller.trackByOrderId.bind(controller));

// Pickup locations
router.get('/pickups', controller.getPickupLocations.bind(controller));
router.post('/pickups', controller.addPickupLocation.bind(controller));
router.post('/pickups/vendor', controller.createVendorPickupLocation.bind(controller));
router.post('/pickups/vendor/update', controller.updateVendorPickupLocation.bind(controller));

// Calculate shipping rates
router.post('/rates/calculate', controller.calculateRates.bind(controller));

// Webhook endpoints
router.post('/webhook', controller.handleWebhook.bind(controller));
router.get('/webhook', controller.verifyWebhook.bind(controller));

// Status sync endpoints
router.post('/sync-status', controller.syncStatus.bind(controller));
router.get('/sync-status', controller.getSyncStatus.bind(controller));

// Advanced tracking with email notifications
router.get('/track/:id', controller.trackOrderAdvanced.bind(controller));
router.get('/track/order/:id', controller.trackOrderAdvanced.bind(controller));

// Apply shipping rate
router.post('/apply-rate', controller.applyShippingRate.bind(controller));

// Advanced pickup location management
router.get('/pickup-locations', controller.managePickupLocations.bind(controller));
router.post('/pickup-locations', controller.managePickupLocations.bind(controller));

export default router;
