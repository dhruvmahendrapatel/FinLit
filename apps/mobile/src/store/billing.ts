import { MockBillingProvider, type BillingProvider } from "@finlit/core";

/**
 * Single billing provider for the app. Swap `MockBillingProvider` for a RevenueCat-backed
 * adapter (react-native-purchases) once store products exist; the screens only use this interface.
 */
export const billing: BillingProvider = new MockBillingProvider({ delayMs: 900 });
