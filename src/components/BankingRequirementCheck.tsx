import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  MapPin,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BankingService } from "@/services/bankingService";
import type { BankingRequirementsStatus } from "@/types/banking";
import { useAuth } from "@/contexts/AuthContext";
import BobGoLockerSelector from "@/components/checkout/BobGoLockerSelector";
import { BobGoLocation } from "@/services/bobgoLocationsService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BankingRequirementCheckProps {
  onCanProceed: (canProceed: boolean) => void;
  children?: React.ReactNode;
}

const BankingRequirementCheck: React.FC<BankingRequirementCheckProps> = ({
  onCanProceed,
  children,
}) => {
  const { user } = useAuth();
  const [bankingStatus, setBankingStatus] =
    useState<BankingRequirementsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkRequirements();
    }
  }, [user]);

  const checkRequirements = async (forceRefresh = false) => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("🔍 Checking listing requirements for user:", user.id, forceRefresh ? "(forced refresh)" : "");

      // Check for saved locker
      let hasSavedLocker = false;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_delivery_locker_data")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.preferred_delivery_locker_data) {
          const lockerData = profile.preferred_delivery_locker_data as any;
          if (lockerData.id && lockerData.name) {
            hasSavedLocker = true;
            console.log("📍 User has saved locker");
          }
        }
      } catch (error) {
        console.warn("Failed to check saved locker:", error);
      }

      // Check pickup address from seller requirements
      const requirements = await BankingService.getSellerRequirements(user.id);

      console.log("✅ Locker result:", hasSavedLocker, "📍 Address result:", requirements);

      // User can list if they have EITHER locker OR pickup address
      const canList = hasSavedLocker || requirements.hasPickupAddress;

      const status: BankingRequirementsStatus = {
        hasBankingInfo: true,
        hasPickupAddress: requirements.hasPickupAddress,
        isVerified: true,
        canListBooks: canList,
        missingRequirements: canList ? [] : [
          ...(hasSavedLocker ? [] : ["Locker saved OR "]),
          ...(requirements.hasPickupAddress ? [] : ["Pickup address required"]),
        ],
      };

      console.log("📊 Final listing requirements status:", status);

      setBankingStatus(status);
      onCanProceed(status.canListBooks);
    } catch (error) {
      console.error("Error checking listing requirements:", error);
      onCanProceed(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bankingStatus) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to verify selling requirements. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (bankingStatus.canListBooks) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Save a Locker to Start Listing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-orange-700">
            Search for and save a BobGo locker location to your profile to start listing books:
          </p>

          {/* Locker Search Section */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Search for a BobGo Locker
            </h4>
            <BobGoLockerSelector
              onLockerSelect={() => {}}
              title="Find a Locker Location"
              description="Enter an address to find nearby locker locations. Select one and click 'Save to Profile' to get started."
              showCardLayout={false}
            />
          </div>

          {/* Info Box */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Pro Tip:</strong> Lockers are the easiest way to list books. No need to coordinate with couriers—just drop off at a nearby BobGo location and get paid fast!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankingRequirementCheck;
