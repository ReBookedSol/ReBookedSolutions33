import { supabase } from "@/integrations/supabase/client";

export type CourierProvider = "bobgo" | "courier-guy";

export interface CourierSettings {
  id: string;
  active_courier: CourierProvider;
  bobgo_api_enabled: boolean;
  courier_guy_api_enabled: boolean;
  bobgo_locker_name: string;
  courier_guy_locker_name: string;
  updated_at: string;
  updated_by: string | null;
}

const SETTINGS_KEY = "app_courier_settings";

/**
 * Get current active courier settings from Supabase
 */
export const getCourierSettings = async (): Promise<CourierSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .eq("key", SETTINGS_KEY)
      .single();

    if (error) {
      console.warn("Failed to fetch courier settings:", error);
      return null;
    }

    if (!data || !data.value) {
      return null;
    }

    return data.value as CourierSettings;
  } catch (error) {
    console.error("Error fetching courier settings:", error);
    return null;
  }
};

/**
 * Update active courier selection
 */
export const updateActiveCourier = async (
  courier: CourierProvider,
  userId?: string
): Promise<CourierSettings | null> => {
  try {
    const existing = await getCourierSettings();
    
    const settings: CourierSettings = {
      id: existing?.id || `courier-settings-${Date.now()}`,
      active_courier: courier,
      bobgo_api_enabled: courier === "bobgo",
      courier_guy_api_enabled: courier === "courier-guy",
      bobgo_locker_name: existing?.bobgo_locker_name || "BobGo Lockers",
      courier_guy_locker_name: existing?.courier_guy_locker_name || "Courier Guy Lockers",
      updated_at: new Date().toISOString(),
      updated_by: userId || null,
    };

    const { data, error } = await supabase
      .from("app_settings")
      .upsert({
        key: SETTINGS_KEY,
        value: settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "key"
      })
      .select();

    if (error) {
      console.error("Failed to update courier settings:", error);
      return null;
    }

    if (data && data[0]) {
      return data[0].value as CourierSettings;
    }

    return settings;
  } catch (error) {
    console.error("Error updating courier settings:", error);
    return null;
  }
};

/**
 * Get locker name for currently active courier
 */
export const getActiveLockerName = async (): Promise<string> => {
  const settings = await getCourierSettings();
  
  if (!settings) {
    return "BobGo Lockers"; // Default fallback
  }

  return settings.active_courier === "bobgo" 
    ? settings.bobgo_locker_name 
    : settings.courier_guy_locker_name;
};

/**
 * Get the active courier provider
 */
export const getActiveCourier = async (): Promise<CourierProvider> => {
  const settings = await getCourierSettings();
  return settings?.active_courier || "bobgo";
};

/**
 * Update locker names for courier providers
 */
export const updateLockerNames = async (
  bobgoName: string,
  courierGuyName: string,
  userId?: string
): Promise<CourierSettings | null> => {
  try {
    const existing = await getCourierSettings();
    
    const settings: CourierSettings = {
      id: existing?.id || `courier-settings-${Date.now()}`,
      active_courier: existing?.active_courier || "bobgo",
      bobgo_api_enabled: existing?.bobgo_api_enabled ?? true,
      courier_guy_api_enabled: existing?.courier_guy_api_enabled ?? false,
      bobgo_locker_name: bobgoName,
      courier_guy_locker_name: courierGuyName,
      updated_at: new Date().toISOString(),
      updated_by: userId || null,
    };

    const { data, error } = await supabase
      .from("app_settings")
      .upsert({
        key: SETTINGS_KEY,
        value: settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "key"
      })
      .select();

    if (error) {
      console.error("Failed to update locker names:", error);
      return null;
    }

    if (data && data[0]) {
      return data[0].value as CourierSettings;
    }

    return settings;
  } catch (error) {
    console.error("Error updating locker names:", error);
    return null;
  }
};
