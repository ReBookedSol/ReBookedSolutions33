import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle,
  Truck,
  Settings,
  RefreshCw,
} from "lucide-react";

interface CourierSettings {
  id: string;
  active_courier: "bobgo" | "courier-guy";
  bobgo_api_enabled: boolean;
  courier_guy_api_enabled: boolean;
  bobgo_locker_name: string;
  courier_guy_locker_name: string;
  updated_at: string;
  updated_by: string | null;
}

const CourierOptionsPanelAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CourierSettings | null>(null);
  const [bobgoLockerName, setBobgoLockerName] = useState("BobGo Lockers");
  const [courierGuyLockerName, setCourierGuyLockerName] = useState(
    "Courier Guy Lockers"
  );

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is admin
    const isUserAdmin =
      user.user_metadata?.role === "admin" ||
      user.user_metadata?.is_admin === true ||
      user.app_metadata?.role === "admin";

    if (!isUserAdmin) {
      toast.error("Access Denied: Admin privileges required");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await loadSettings();
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "app_courier_settings")
        .single();

      if (!error && data) {
        const loadedSettings = data.value as CourierSettings;
        setSettings(loadedSettings);
        setBobgoLockerName(loadedSettings.bobgo_locker_name);
        setCourierGuyLockerName(loadedSettings.courier_guy_locker_name);
      } else {
        // Initialize with defaults
        const defaultSettings: CourierSettings = {
          id: `courier-settings-${Date.now()}`,
          active_courier: "bobgo",
          bobgo_api_enabled: true,
          courier_guy_api_enabled: false,
          bobgo_locker_name: "BobGo Lockers",
          courier_guy_locker_name: "Courier Guy Lockers",
          updated_at: new Date().toISOString(),
          updated_by: null,
        };
        setSettings(defaultSettings);
        setBobgoLockerName(defaultSettings.bobgo_locker_name);
        setCourierGuyLockerName(defaultSettings.courier_guy_locker_name);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load courier settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourier = async (courier: "bobgo" | "courier-guy") => {
    if (!settings) return;

    const updatedSettings: CourierSettings = {
      ...settings,
      active_courier: courier,
      bobgo_api_enabled: courier === "bobgo",
      courier_guy_api_enabled: courier === "courier-guy",
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    };

    setSaving(true);
    try {
      const { error } = await supabase.from("app_settings").upsert({
        key: "app_courier_settings",
        value: updatedSettings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSettings(updatedSettings);
      toast.success(
        `Switched to ${courier === "bobgo" ? "BobGo" : "Courier Guy"}`
      );
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLockerNames = async () => {
    if (!settings) return;

    const updatedSettings: CourierSettings = {
      ...settings,
      bobgo_locker_name: bobgoLockerName,
      courier_guy_locker_name: courierGuyLockerName,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    };

    setSaving(true);
    try {
      const { error } = await supabase.from("app_settings").upsert({
        key: "app_courier_settings",
        value: updatedSettings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSettings(updatedSettings);
      toast.success("Locker names updated successfully");
    } catch (error) {
      console.error("Error saving locker names:", error);
      toast.error("Failed to update locker names");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Admin access required</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-book-600" />
              <p>Loading settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-8 w-8 text-book-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Courier Options Panel
            </h1>
          </div>
          <p className="text-gray-600">
            Manage which courier service is used for shipments
          </p>
        </div>

        {/* Active Courier Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-book-600" />
              Active Courier Service
            </CardTitle>
            <CardDescription>
              Choose which courier provider handles shipments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BobGo Option */}
              <div
                className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
                  settings?.active_courier === "bobgo"
                    ? "border-book-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => handleSelectCourier("bobgo")}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg text-gray-900">BobGo</h3>
                    {settings?.active_courier === "bobgo" && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Primary courier service for shipments and locker networks
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">API Status:</span>{" "}
                      <span
                        className={
                          settings?.bobgo_api_enabled
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        {settings?.bobgo_api_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Locker Name:</span>{" "}
                      <span className="text-gray-600">
                        {settings?.bobgo_locker_name}
                      </span>
                    </p>
                  </div>
                  {settings?.active_courier === "bobgo" && (
                    <div className="pt-2 border-t border-blue-200">
                      <p className="text-xs font-medium text-book-600">
                        ✓ Currently Active
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Courier Guy Option */}
              <div
                className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
                  settings?.active_courier === "courier-guy"
                    ? "border-book-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => handleSelectCourier("courier-guy")}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg text-gray-900">
                      Courier Guy
                    </h3>
                    {settings?.active_courier === "courier-guy" && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Alternative courier provider with Shiplogic API integration
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">API Status:</span>{" "}
                      <span
                        className={
                          settings?.courier_guy_api_enabled
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        {settings?.courier_guy_api_enabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Locker Name:</span>{" "}
                      <span className="text-gray-600">
                        {settings?.courier_guy_locker_name}
                      </span>
                    </p>
                  </div>
                  {settings?.active_courier === "courier-guy" && (
                    <div className="pt-2 border-t border-blue-200">
                      <p className="text-xs font-medium text-book-600">
                        ✓ Currently Active
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locker Names Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Locker Network Names</CardTitle>
            <CardDescription>
              Customize how locker networks are displayed to users based on the
              active courier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* BobGo Locker Name */}
            <div className="space-y-2">
              <Label htmlFor="bobgo-locker-name" className="font-medium">
                BobGo Locker Name
              </Label>
              <Input
                id="bobgo-locker-name"
                value={bobgoLockerName}
                onChange={(e) => setBobgoLockerName(e.target.value)}
                placeholder="e.g., BobGo Lockers"
                className="text-base"
              />
              <p className="text-xs text-gray-500">
                This name appears when BobGo is the active courier service
              </p>
            </div>

            {/* Courier Guy Locker Name */}
            <div className="space-y-2">
              <Label htmlFor="courier-guy-locker-name" className="font-medium">
                Courier Guy Locker Name
              </Label>
              <Input
                id="courier-guy-locker-name"
                value={courierGuyLockerName}
                onChange={(e) => setCourierGuyLockerName(e.target.value)}
                placeholder="e.g., Courier Guy Lockers"
                className="text-base"
              />
              <p className="text-xs text-gray-500">
                This name appears when Courier Guy is the active courier service
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleUpdateLockerNames}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save Locker Names"}
            </Button>
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BobGo Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">BobGo Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-gray-600">
              <p>
                <span className="font-medium text-gray-900">API Type:</span> BobGo
                API
              </p>
              <p>
                <span className="font-medium text-gray-900">Status:</span> Active
                integration
              </p>
              <p>
                <span className="font-medium text-gray-900">Functions:</span>{" "}
                bobgo-create-shipment, bobgo-get-rates, bobgo-track-shipment
              </p>
            </CardContent>
          </Card>

          {/* Courier Guy Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Courier Guy Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-gray-600">
              <p>
                <span className="font-medium text-gray-900">API Type:</span>{" "}
                Shiplogic API
              </p>
              <p>
                <span className="font-medium text-gray-900">Status:</span> Ready for
                deployment
              </p>
              <p>
                <span className="font-medium text-gray-900">Functions:</span>{" "}
                create-shipment, get-rates, get-pickup-points, track-shipment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Last Updated Info */}
        {settings && (
          <Card className="bg-gray-100 border-gray-200">
            <CardContent className="pt-6 text-sm text-gray-600">
              <p>
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(settings.updated_at).toLocaleString()}
              </p>
              {settings.updated_by && (
                <p>
                  <span className="font-medium">Updated By:</span> {settings.updated_by}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourierOptionsPanelAdmin;
