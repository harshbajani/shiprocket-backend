export { ShiprocketHttpClient } from './shiprocket/http-client';
export { ShiprocketAuth } from './shiprocket/auth';
export { ShiprocketOrders } from './shiprocket/orders';
export { ShiprocketTracking } from './shiprocket/tracking';
export { ShiprocketPickups } from './shiprocket/pickups';
export { SHIPROCKET_CONFIG, validateConfig, getApiBaseUrl, isStaging } from './shiprocket/config';
export * from './shiprocket/types';

import { ShiprocketHttpClient } from './shiprocket/http-client';
import { ShiprocketAuth } from './shiprocket/auth';
import { ShiprocketOrders } from './shiprocket/orders';
import { ShiprocketTracking } from './shiprocket/tracking';
import { ShiprocketPickups } from './shiprocket/pickups';

export class ShiprocketSDK {
  public readonly http: ShiprocketHttpClient;
  public readonly auth: ShiprocketAuth;
  public readonly orders: ShiprocketOrders;
  public readonly tracking: ShiprocketTracking;
  public readonly pickups: ShiprocketPickups;

  constructor() {
    this.http = new ShiprocketHttpClient();
    this.auth = new ShiprocketAuth(this.http);
    this.orders = new ShiprocketOrders(this.http, this.auth);
    this.tracking = new ShiprocketTracking(this.http, this.auth);
    this.pickups = new ShiprocketPickups(this.http, this.auth);
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  clearAuth(): void {
    this.auth.clearAuth();
  }

  getTokenInfo() {
    return this.auth.getTokenInfo();
  }
}
