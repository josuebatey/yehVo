import { Purchases } from "@revenuecat/purchases-js";

interface RevenueCatOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: RevenueCatPackage[];
}

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

interface RevenueCatCustomerInfo {
  originalAppUserId: string;
  allPurchaseDates: Record<string, string>;
  activeSubscriptions: string[];
  allExpirationDates: Record<string, string>;
  entitlements: {
    active: Record<string, any>;
    all: Record<string, any>;
  };
}

class RevenueCatService {
  private isInitialized = false;

  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize RevenueCat Web SDK

      await Purchases.configure({
        apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
        appUserId: userId,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize RevenueCat:", error);
      throw new Error("RevenueCat initialization failed");
    }
  }

  async getOfferings(): Promise<RevenueCatOffering[]> {
    if (!this.isInitialized) {
      throw new Error("RevenueCat not initialized");
    }

    try {
      const offerings = await Purchases.getOfferings();

      return Object.values(offerings.all).map((offering: any) => ({
        identifier: offering.identifier,
        serverDescription: offering.serverDescription,
        availablePackages: offering.availablePackages.map((pkg: any) => ({
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
    } catch (error) {
      console.error("Failed to get offerings:", error);
      return [];
    }
  }

  async purchasePackage(packageIdentifier: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error("RevenueCat not initialized");
    }

    try {
      const offerings = await Purchases.getOfferings();

      // Find the package
      let targetPackage: any = null;
      for (const offering of Object.values(offerings.all)) {
        const pkg = (offering as any).availablePackages.find(
          (p: any) => p.identifier === packageIdentifier
        );
        if (pkg) {
          targetPackage = pkg;
          break;
        }
      }

      if (!targetPackage) {
        throw new Error("Package not found");
      }

      const { customerInfo } = await Purchases.purchasePackage(targetPackage);

      // Check if the purchase was successful
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      console.error("Purchase failed:", error);
      return false;
    }
  }

  async getCustomerInfo(): Promise<RevenueCatCustomerInfo | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();

      return {
        originalAppUserId: customerInfo.originalAppUserId,
        allPurchaseDates: customerInfo.allPurchaseDates,
        activeSubscriptions: customerInfo.activeSubscriptions,
        allExpirationDates: customerInfo.allExpirationDates,
        entitlements: {
          active: customerInfo.entitlements.active,
          all: customerInfo.entitlements.all,
        },
      };
    } catch (error) {
      console.error("Failed to get customer info:", error);
      return null;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const { customerInfo } = await Purchases.restorePurchases();

      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      console.error("Failed to restore purchases:", error);
      return false;
    }
  }

  async isProUser(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    return customerInfo
      ? Object.keys(customerInfo.entitlements.active).length > 0
      : false;
  }
}

export const revenueCatService = new RevenueCatService();
