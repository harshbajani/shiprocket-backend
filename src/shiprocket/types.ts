export interface ShiprocketAuthResponse {
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  company_id: number;
}
export interface ShiprocketAuthRequest {
  email: string;
  password: string;
}
export interface ShiprocketOrderRequest {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: "COD" | "Prepaid";
  shipping_charges: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}
export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}
export interface ShiprocketOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code: string | null;
  courier_company_id: number | null;
  courier_name: string | null;
}
export interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: string;
    shipment_track: Array<{
      id: number;
      awb_code: string;
      courier_company_id: number;
      shipment_id: number;
      order_id: number;
      pickup_date: string | null;
      delivered_date: string | null;
      weight: string;
      packages: number;
      current_status: string;
      delivered_to: string | null;
      destination: string;
      consignee_name: string;
      origin: string;
      courier_agent_details: string | null;
      edd: string | null;
    }>;
    shipment_track_activities: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
    }>;
  };
}
export interface ShiprocketPickupLocationRequest {
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
}
export interface ShiprocketPickupLocationResponse {
  success: boolean;
  message: string;
  pickup_id?: number;
}
export interface ShiprocketServiceabilityRequest {
  pickup_postcode: string;
  delivery_postcode: string;
  weight: number;
}
export interface ShiprocketServiceabilityResponse {
  status: number;
  postcode_serviceability: boolean;
  available_courier_companies: Array<{
    courier_company_id: number;
    courier_name: string;
    freight_charge: number;
    cod_charges: number;
    cod_multiplier: number;
    delivery_days: string;
  }>;
}
export interface ShiprocketWebhookPayload {
  order_id: number;
  shipment_id: number;
  current_status: string;
  delivered_date?: string;
  pickup_date?: string;
  awb_code: string;
  courier_name: string;
  track_status: number;
  shipment_status: string;
  activities?: Array<{
    date: string;
    status: string;
    activity: string;
    location: string;
  }>;
}
export interface ShiprocketConfig {
  API_BASE_URL: string;
  STAGING_API_BASE_URL: string;
  EMAIL?: string;
  PASSWORD?: string;
  DEFAULT_PICKUP_LOCATION: string;
  DEFAULT_CHANNEL_ID: string;
  STATUS_MAPPING: Record<string, string>;
  NOTIFICATION_MAPPING: Record<string, string>;
  ENDPOINTS: {
    AUTH: string;
    CREATE_ORDER: string;
    TRACK_ORDER: string;
    TRACK_BY_ORDER_ID: string;
    CANCEL_ORDER: string;
    GENERATE_PICKUP: string;
    GET_SERVICEABILITY: string;
    GET_COURIERS: string;
    ADD_PICKUP_LOCATION: string;
    GET_PICKUP_LOCATIONS: string;
    PRINT_INVOICE: string;
  };
  DEFAULT_DIMENSIONS: {
    length: number;
    breadth: number;
    height: number;
    weight: number;
  };
}
export type ShiprocketOrderStatus = keyof ShiprocketConfig["STATUS_MAPPING"];
export type SystemOrderStatus =
  ShiprocketConfig["STATUS_MAPPING"][ShiprocketOrderStatus];
export interface ShiprocketError {
  message: string;
  status: number;
  statusText: string;
  response?: any;
}
export interface ShiprocketAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ShiprocketError;
}
