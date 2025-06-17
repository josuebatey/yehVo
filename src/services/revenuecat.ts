import { Purchases } from "@revenuecat/purchases-js";

interface RevenueCatPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
}

interface RevenueCatOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: RevenueCatPackage[];
}

interface RevenueCatCustomerInfo {
  originalAppUserId: string;
  allPurchaseDates: Record<string, string>;
  activeSubscriptions: string[];
  allExpirationDates: Record<string, string>;
  entitlements: {
    active: Record<string, unknown>;
    all: Record<string, unknown>;
  };
}

class RevenueCatService {
  private isInitialized = false;

  /** Call once after the user signs in */
  async initialize(userId: string) {
    if (this.isInitialized) return;

    try {
      // DEBUG: confirm the env variable arrived
      console.log("RevenueCat key:", import.meta.env.VITE_REVENUECAT_API_KEY);

      await Purchases.configure({
        apiKey: import.meta.env.VITE_REVENUECAT_API_KEY!, // must be public web key
        appUserId: userId,
      });

      this.isInitialized = true;
    } catch (err) {
      console.error("Failed to initialize RevenueCat:", err);
      throw new Error("RevenueCat initialization failed");
    }
  }

  async getOfferings(): Promise<RevenueCatOffering[]> {
    if (!this.isInitialized) throw new Error("RevenueCat not initialized");

    const offerings = await Purchases.getOfferings();

    return Object.values(offerings.all).map((o) => ({
      identifier: o.identifier,
      serverDescription: o.serverDescription,
      availablePackages: o.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        packageType: pkg.packageType,
        product: {
          identifier: pkg.product.identifier,
          description: pkg.product.description,
          title: pkg.product.title,
          price: pkg.product.price,
          priceString: pkg.product.priceString,
          currencyCode: pkg.product.currencyCode,
        },
      })),
    }));
  }

  /* purchasePackage, restorePurchases, isProUser … (same as before) */
}

export const revenueCatService = new RevenueCatService();
