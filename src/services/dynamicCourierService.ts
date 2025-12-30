import { supabase } from "@/integrations/supabase/client";

export type CourierProvider = "bobgo" | "courier-guy";

interface CourierSettings {
  active_courier: CourierProvider;
  bobgo_locker_name: string;
  courier_guy_locker_name: string;
}

// Cache for settings to avoid repeated database calls
let cachedSettings: CourierSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get courier settings from cache or database
 */
async function getCourierSettings(): Promise<CourierSettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && now - cacheTimestamp < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "app_courier_settings")
      .single();

    if (!error && data?.value) {
      cachedSettings = data.value as CourierSettings;
      cacheTimestamp = now;
      return cachedSettings;
    }
  } catch (err) {
    console.warn("Failed to fetch courier settings:", err);
  }

  // Default fallback
  return {
    active_courier: "bobgo",
    bobgo_locker_name: "BobGo Lockers",
    courier_guy_locker_name: "Courier Guy Lockers",
  };
}

/**
 * Get the currently active courier provider
 */
export async function getActiveCourier(): Promise<CourierProvider> {
  const settings = await getCourierSettings();
  return settings.active_courier;
}

/**
 * Get the locker name for the currently active courier
 */
export async function getActiveLockerName(): Promise<string> {
  const settings = await getCourierSettings();
  return settings.active_courier === "bobgo"
    ? settings.bobgo_locker_name
    : settings.courier_guy_locker_name;
}

/**
 * Get the correct edge function name for creating a shipment
 */
export async function getCreateShipmentFunction(): Promise<string> {
  const courier = await getActiveCourier();
  return courier === "bobgo"
    ? "bobgo-create-shipment"
    : "shiplogic-create-shipment";
}

/**
 * Get the correct edge function name for getting rates
 */
export async function getGetRatesFunction(): Promise<string> {
  const courier = await getActiveCourier();
  return courier === "bobgo" ? "bobgo-get-rates" : "shiplogic-get-rates";
}

/**
 * Get the correct edge function name for tracking a shipment
 */
export async function getTrackShipmentFunction(): Promise<string> {
  const courier = await getActiveCourier();
  return courier === "bobgo"
    ? "bobgo-track-shipment"
    : "shiplogic-track-shipment";
}

/**
 * Get the correct edge function name for getting pickup points
 */
export async function getGetPickupPointsFunction(): Promise<string> {
  const courier = await getActiveCourier();
  return courier === "bobgo"
    ? "bobgo-get-locations"
    : "shiplogic-get-pickup-points";
}

/**
 * Get the correct edge function name for cancelling a shipment
 */
export async function getCancelShipmentFunction(): Promise<string> {
  const courier = await getActiveCourier();
  return courier === "bobgo"
    ? "bobgo-cancel-shipment"
    : "shiplogic-cancel-shipment";
}

/**
 * Get the tracking URL for a shipment
 */
export async function getTrackingUrl(trackingNumber: string): Promise<string> {
  const courier = await getActiveCourier();
  if (courier === "bobgo") {
    return `https://track.bobgo.co.za/${encodeURIComponent(trackingNumber)}`;
  } else {
    // Shiplogic tracking URL (you may need to adjust based on their actual URL)
    return `https://track.shiplogic.com/${encodeURIComponent(trackingNumber)}`;
  }
}

/**
 * Invalidate the cache (call this after updating courier settings)
 */
export function invalidateCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
}

/**
 * Get courier provider display name
 */
export async function getCourierDisplayName(): Promise<string> {
  const courier = await getActiveCourier();
  return courier === "bobgo" ? "BobGo" : "Courier Guy";
}
