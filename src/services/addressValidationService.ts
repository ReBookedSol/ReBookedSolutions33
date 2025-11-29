import { supabase } from "@/integrations/supabase/client";
import { safeLogError } from "@/utils/errorHandling";

interface Address {
  complex?: string;
  unitNumber?: string;
  streetAddress: string;
  suburb?: string;
  city: string;
  province: string;
  postalCode: string;
  [key: string]: string | number | boolean | null;
}

export const validateAddress = (address: Address): boolean => {
  return !!(
    address.streetAddress &&
    address.city &&
    address.province &&
    address.postalCode
  );
};

export const canUserListBooks = async (userId: string): Promise<boolean> => {
  try {
    let hasValidAddress = false;
    let hasSavedLocker = false;

    // 1) Check for saved locker first (simpler check)
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("preferred_delivery_locker_data")
        .eq("id", userId)
        .maybeSingle();

      if (!error && profile?.preferred_delivery_locker_data) {
        const lockerData = profile.preferred_delivery_locker_data as any;
        if (lockerData.id && lockerData.name) {
          hasSavedLocker = true;
          return true; // Can list if they have a locker
        }
      }
    } catch (error) {
      // Failed to check saved locker
    }

    // 2) Try the preferred encrypted path (profiles/books decryption via edge function)
    try {
      const { getSellerDeliveryAddress } = await import("@/services/simplifiedAddressService");
      const decrypted = await getSellerDeliveryAddress(userId);

      if (decrypted && (decrypted.street || decrypted.streetAddress) && decrypted.city && decrypted.province && (decrypted.postal_code || decrypted.postalCode)) {
        hasValidAddress = true;
      }
    } catch (error) {
      // Failed to check decrypted pickup address
    }

    if (hasValidAddress) {
      return true;
    }

    // 3) Fallback: check simplified stored addresses (unencrypted user_addresses table / fallback service)
    try {
      const fallbackModule = await import("@/services/fallbackAddressService");
      const fallbackSvc = fallbackModule?.default || fallbackModule?.fallbackAddressService;
      if (fallbackSvc && typeof fallbackSvc.getBestAddress === 'function') {
        const best = await fallbackSvc.getBestAddress(userId, 'pickup');
        if (best && best.success && best.address) {
          const addr = best.address as any;
          if (addr.street || addr.streetAddress || addr.line1) {
            if (addr.city && addr.province && (addr.postalCode || addr.postal_code || addr.zip)) {
              return true;
            }
          }
        }
      }
    } catch (error) {
      // Fallback user_addresses check failed
    }

    // 4) Fallback: legacy plaintext pickup_address on profiles or books table
    try {
      const { getUserAddresses, getSellerPickupAddress } = await import("@/services/addressService");

      // Check profile-level plaintext addresses (if any)
      try {
        const profileAddresses = await getUserAddresses(userId);
        if (profileAddresses && profileAddresses.pickup_address) {
          const pa: any = profileAddresses.pickup_address;
          if ((pa.street || pa.streetAddress || pa.line1) && pa.city && pa.province && (pa.postalCode || pa.postal_code || pa.zip)) {
            return true;
          }
        }
      } catch (err) {
        // addressService.getUserAddresses failed
      }

      // Check books table legacy pickup address
      try {
        const bookPickup = await getSellerPickupAddress(userId);
        if (bookPickup && (bookPickup.street || bookPickup.streetAddress) && bookPickup.city && bookPickup.province && (bookPickup.postal_code || bookPickup.postalCode)) {
          return true;
        }
      } catch (err) {
        // addressService.getSellerPickupAddress failed
      }
    } catch (error) {
      // Legacy addressService fallback failed
    }

    return false;
  } catch (error) {
    safeLogError("Error in canUserListBooks", error, { userId });
    return false;
  }
};

export const updateAddressValidation = async (
  userId: string,
  pickupAddress: Address,
  shippingAddress: Address,
  addressesSame: boolean,
) => {
  try {
    const isPickupValid = validateAddress(pickupAddress);
    const isShippingValid = addressesSame ? isPickupValid : validateAddress(shippingAddress);
    const canList = isPickupValid && isShippingValid;

    // Update metadata only; never write plaintext addresses
    const { error } = await supabase
      .from("profiles")
      .update({
        addresses_same: addressesSame,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      safeLogError("Error updating address validation", error, { userId });
      throw new Error(
        `Failed to update address validation: ${error.message || "Unknown error"}`,
      );
    }

    return { canListBooks: canList };
  } catch (error) {
    safeLogError("Error in updateAddressValidation", error, { userId });
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Address validation failed: ${errorMessage}`);
  }
};
