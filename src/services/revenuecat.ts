import { Purchases } from "@revenuecat/purchases-js";

interface RevenueCatPackage {
  identifier: string;
  packageType: string;
  product?: {
    identifier?: string;
    description?: string;
    title?: string;
    price?: number;
    priceString?: string;
    currencyCode?: string;
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
      Purchases.configure(import.meta.env.VITE_REVENUECAT_API_KEY, userId);

      this.isInitialized = true;
    } catch (err) {
      console.error("Failed to initialize RevenueCat:", err);
      throw new Error("RevenueCat initialization failed");
    }
  }

  async getOfferings(): Promise<RevenueCatOffering[]> {
    if (!this.isInitialized) throw new Error("RevenueCat not initialized");

    const offerings = await Purchases.getSharedInstance().getOfferings();

    return Object.values(offerings.all).map((o) => ({
      identifier: o.identifier,
      serverDescription: o.serverDescription,
      availablePackages: o.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        packageType: pkg.packageType,
        // product: {
        //   identifier: pkg.product.identifier,
        //   description: pkg.product.description,
        //   title: pkg.product.title,
        //   price: pkg.product.price,
        //   priceString: pkg.product.priceString,
        //   currencyCode: pkg.product.currencyCode,
        // },
      })),
    }));
  }

  async isProUser(): Promise<boolean> {
    if (!this.isInitialized) throw new Error("RevenueCat not initialized");

    try {
      const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
      return customerInfo.entitlements.active.pro !== undefined;
    } catch (error) {
      console.error("Failed to check Pro status:", error);
      return false;
    }
  }

  async purchasePackage(packageIdentifier: string): Promise<boolean> {
    if (!this.isInitialized) throw new Error("RevenueCat not initialized");

    try {
      const offerings = await this.getOfferings();
      const offering = offerings.find(o => 
        o.availablePackages.some(pkg => pkg.identifier === packageIdentifier)
      );
      
      if (!offering) {
        throw new Error(`Package ${packageIdentifier} not found`);
      }

      const packageToPurchase = offering.availablePackages.find(pkg => 
        pkg.identifier === packageIdentifier
      );

      if (!packageToPurchase) {
        throw new Error(`Package ${packageIdentifier} not found`);
      }

      // Note: This is a simplified implementation
      // In a real app, you'd need to handle the actual purchase flow
      return false; // For now, return false as this needs proper implementation
    } catch (error) {
      console.error("Failed to purchase package:", error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!this.isInitialized) throw new Error("RevenueCat not initialized");
    try {
      // Note: restorePurchases() method might not exist in the current version
      // This is a simplified implementation
      return false; // For now, return false as this needs proper implementation
    } catch (error) {
      return false;
    }
  }
}

export const revenueCatService = new RevenueCatService();
