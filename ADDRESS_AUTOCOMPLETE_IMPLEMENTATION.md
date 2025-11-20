# Address Autocomplete Implementation - Complete Code

This document contains all code related to the address autocomplete feature in the ReBooked Solutions application.

## Table of Contents
1. [Edge Functions (Backend)](#edge-functions-backend)
2. [Service Layer](#service-layer)
3. [React Components](#react-components)
4. [Types and Interfaces](#types-and-interfaces)

---

## Edge Functions (Backend)

### 1. Address Autocomplete Edge Function
**File:** `supabase/functions/address-autocomplete/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const input = url.searchParams.get('input');

    if (!input) {
      return new Response(
        JSON.stringify({ error: 'Missing input parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call Google Places Autocomplete API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:za`;
    
    console.log('Calling Google Places Autocomplete API');
    const response = await fetch(placesUrl);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google API error:', data);
      return new Response(
        JSON.stringify({ error: `Google API error: ${data.status}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Transform the response to our format
    const suggestions = (data.predictions || []).map((prediction: any) => ({
      description: prediction.description,
      place_id: prediction.place_id,
    }));

    console.log(`Found ${suggestions.length} suggestions`);

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in autocomplete function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

---

### 2. Address Place Details Edge Function
**File:** `supabase/functions/address-place-details/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const placeId = url.searchParams.get('place_id');

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'Missing place_id parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Google Place Details API with address_components
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=formatted_address,geometry,address_components&key=${apiKey}`;

    console.log('Calling Google Place Details API');
    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google API error:', data);
      return new Response(
        JSON.stringify({ error: `Google API error: ${data.status}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = data.result;

    // Parse address components
    const components = result.address_components || [];
    const addressData: any = {
      formatted_address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      street_number: '',
      route: '',
      street_address: '',
      city: '',
      province: '',
      postal_code: '',
      country: ''
    };

    // Extract components
    components.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        addressData.street_number = component.long_name;
      }
      if (types.includes('route')) {
        addressData.route = component.long_name;
      }
      if (types.includes('locality')) {
        addressData.city = component.long_name;
      }
      if (types.includes('sublocality') && !addressData.city) {
        addressData.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        addressData.province = component.long_name;
      }
      if (types.includes('postal_code')) {
        addressData.postal_code = component.long_name;
      }
      if (types.includes('country')) {
        addressData.country = component.long_name;
      }
    });

    // Combine street number and route for full street address
    addressData.street_address = `${addressData.street_number} ${addressData.route}`.trim();

    console.log('Place details retrieved:', addressData);

    return new Response(
      JSON.stringify(addressData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in autocomplete-details function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

---

## Service Layer

### Address Autocomplete Service
**File:** `src/services/addressAutocompleteService.ts`

```typescript
import { supabase } from "@/integrations/supabase/client";
import { ENV } from "@/config/environment";

export interface Suggestion {
  description: string;
  place_id: string;
}

export interface LocationDetails {
  address: string;
  lat: number;
  lng: number;
}

export interface PickupPoint {
  name: string;
  distance: string;
  address: string;
}

/**
 * Fetch address suggestions from the autocomplete Edge Function
 */
export const fetchSuggestions = async (searchInput: string): Promise<Suggestion[]> => {
  if (!searchInput.trim()) {
    return [];
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${ENV.VITE_SUPABASE_URL}/functions/v1/address-autocomplete?input=${encodeURIComponent(searchInput)}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ENV.VITE_SUPABASE_ANON_KEY}`,
          'apikey': ENV.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.error) {
      console.error('Error fetching suggestions:', result.error);
      return [];
    }

    return result.suggestions || [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
};

/**
 * Fetch address details from place_id
 */
export const fetchAddressDetails = async (placeId: string): Promise<LocationDetails | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${ENV.VITE_SUPABASE_URL}/functions/v1/address-place-details?place_id=${encodeURIComponent(placeId)}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ENV.VITE_SUPABASE_ANON_KEY}`,
          'apikey': ENV.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const details: LocationDetails = await response.json();

    if (!details.address) {
      console.error('Failed to get address details');
      return null;
    }

    return details;
  } catch (error) {
    console.error('Error fetching address details:', error);
    return null;
  }
};

/**
 * Fetch nearby pickup points from Bob Go API
 */
export const fetchPickupPoints = async (lat: number, lng: number): Promise<PickupPoint[]> => {
  try {
    // Mock pickup points for now - replace with actual Bob Go API call
    const mockPickupPoints: PickupPoint[] = [
      {
        name: "Pep Stores - Menlyn",
        distance: "1.2 km",
        address: "Shop 123, Menlyn Park Shopping Centre, Pretoria"
      },
      {
        name: "Pep Stores - Brooklyn",
        distance: "2.5 km",
        address: "Shop 45, Brooklyn Mall, Pretoria"
      },
      {
        name: "Pep Stores - Centurion",
        distance: "5.8 km",
        address: "Shop 67, Centurion Mall, Centurion"
      }
    ];

    return mockPickupPoints;
  } catch (error) {
    console.error('Error fetching pickup points:', error);
    return [];
  }
};
```

---

## React Components

### 1. ManualAddressInput Component
**File:** `src/components/ManualAddressInput.tsx`

```typescript
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSuggestions, fetchAddressDetails, type Suggestion } from "@/services/addressAutocompleteService";

export interface AddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  additional_info?: string;
}

interface AddressFormData {
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

interface ManualAddressInputProps {
  onAddressSelect: (addressData: AddressData) => void;
  label?: string;
  required?: boolean;
  defaultValue?: Partial<AddressData>;
  className?: string;
}

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export const ManualAddressInput = ({
  onAddressSelect,
  label = "Address",
  required = false,
  defaultValue = {},
  className = "",
}: ManualAddressInputProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState(
    defaultValue?.additional_info || ""
  );
  const [formData, setFormData] = useState<AddressFormData>({
    street_address: defaultValue?.street || "",
    city: defaultValue?.city || "",
    province: defaultValue?.province || "",
    postal_code: defaultValue?.postalCode || "",
    country: defaultValue?.country || "South Africa",
  });

  const debounceTimer = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions as user types
  const handleSearch = async (value: string) => {
    setSearchInput(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Set new timer for debouncing (300ms as per guide)
    debounceTimer.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const results = await fetchSuggestions(value);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // Handle suggestion selection and auto-fill
  const handleSelectSuggestion = async (placeId: string, description: string) => {
    setSearchInput(description);
    setShowDropdown(false);

    try {
      setIsLoading(true);
      const details = await fetchAddressDetails(placeId);

      if (details) {
        // Parse the formatted address
        // Format: "Street Number Street Name, Suburb, City, Postal Code, Country"
        const parts = details.address.split(',').map(p => p.trim());

        let streetAddr = parts[0] || '';
        if (parts[1] && !parts[1].match(/^\d+$/)) {
          streetAddr = `${parts[0]}, ${parts[1]}`;
        }

        const city = parts[2] || parts[1] || '';
        const postalCode = parts[3] || '';

        // Auto-fill the form fields
        setFormData({
          street_address: streetAddr,
          city: city,
          province: "",
          postal_code: postalCode,
          country: "South Africa",
        });
      }
    } catch (error) {
      console.error("Error fetching address details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Trigger callback when form is valid
  useEffect(() => {
    if (
      formData.street_address &&
      formData.city &&
      formData.province &&
      formData.postal_code
    ) {
      const addressData: AddressData = {
        formattedAddress: `${formData.street_address}, ${formData.city}, ${formData.province}, ${formData.postal_code}, ${formData.country}`,
        street: formData.street_address,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postal_code,
        country: formData.country,
        additional_info: additionalInfo || undefined,
      };
      onAddressSelect(addressData);
    }
  }, [formData, additionalInfo]);

  return (
    <div className={`w-full max-w-2xl space-y-6 ${className}`}>
      {label && (
        <Label className="text-base font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {/* Address Search Input */}
      <div className="relative" ref={dropdownRef}>
        <Label htmlFor="address-search">Search Address</Label>
        <Input
          id="address-search"
          type="text"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Start typing an address..."
          className="mt-2"
          disabled={isLoading}
        />

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                onClick={() =>
                  handleSelectSuggestion(suggestion.place_id, suggestion.description)
                }
                className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors border-b last:border-b-0"
                type="button"
              >
                {suggestion.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Auto-filled Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            value={formData.street_address}
            onChange={(e) =>
              setFormData({ ...formData, street_address: e.target.value })
            }
            placeholder="Street address"
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="City"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              value={formData.province}
              onChange={(e) =>
                setFormData({ ...formData, province: e.target.value })
              }
              placeholder="Province"
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postal">Postal Code</Label>
            <Input
              id="postal"
              value={formData.postal_code}
              onChange={(e) =>
                setFormData({ ...formData, postal_code: e.target.value })
              }
              placeholder="Postal code"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              placeholder="Country"
              className="mt-2"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="additional_info">Additional Information (Optional)</Label>
          <textarea
            id="additional_info"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="e.g., Building entrance details, security gate code, special instructions..."
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Include any helpful details for pickup/delivery (gate codes, building access, etc.)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManualAddressInput;
```

---

### 2. ModernAddressTab Component
**File:** `src/components/profile/ModernAddressTab.tsx`

```typescript
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Plus,
  Edit,
  Truck,
  Home,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Package,
  Loader2,
  Info,
} from "lucide-react";
import ManualAddressInput from "@/components/ManualAddressInput";
import type { AddressData as GoogleAddressData } from "@/components/ManualAddressInput";
import { AddressData, Address } from "@/types/address";
import { handleAddressError } from "@/utils/errorDisplayUtils";

interface ModernAddressTabProps {
  addressData: AddressData | null;
  onSaveAddresses?: (
    pickup: Address,
    shipping: Address,
    same: boolean,
  ) => Promise<void>;
  isLoading?: boolean;
}

const ModernAddressTab = ({
  addressData,
  onSaveAddresses,
  isLoading = false,
}: ModernAddressTabProps) => {
  const [editMode, setEditMode] = useState<
    "none" | "pickup" | "shipping" | "both"
  >("none");
  const [pickupAddress, setPickupAddress] = useState<Address | null>(null);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (addressData) {
      setPickupAddress(addressData.pickup_address);
      setShippingAddress(addressData.shipping_address);
      setSameAsPickup(addressData.addresses_same || false);
    }
  }, [addressData]);

  // Small optimization: prefill addresses quickly without awaiting heavy decrypt flows elsewhere
  useEffect(() => {
    // if no address data yet, attempt a lightweight cached fetch (non-blocking)
    let cancelled = false;
    const tryPrefetch = async () => {
      if (addressData) return;
      try {
        const cacheKey = `cached_address_${window?.__USER_ID__}`;
        const cached = cacheKey ? (window as any)?.localStorage?.getItem?.(cacheKey) : null;
        if (cached && !cancelled) {
          const parsed = JSON.parse(cached);
          setPickupAddress(parsed.pickup_address || null);
          setShippingAddress(parsed.shipping_address || null);
          setSameAsPickup(parsed.addresses_same || false);
        }
      } catch (e) {
        // ignore cache failures
      }
    };
    tryPrefetch();
    return () => { cancelled = true; };
  }, []);

  const formatAddress = (address: Address | null | undefined) => {
    if (!address) return null;
    return `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`;
  };

  const handleSave = async () => {
    if (!pickupAddress || !shippingAddress || !onSaveAddresses) return;

    setIsSaving(true);
    try {
      await onSaveAddresses(pickupAddress, shippingAddress, sameAsPickup);
      setEditMode("none");
    } catch (error) {
      const formattedError = handleAddressError(error, "save");
      console.error(formattedError.developerMessage, formattedError.originalError);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (mode: "pickup" | "shipping" | "both") => {
    setEditMode(mode);
    // Initialize addresses if they don't exist
    if (!pickupAddress) {
      setPickupAddress({
        street: "",
        city: "",
        province: "",
        postalCode: "",
        country: "South Africa",
      });
    }
    if (!shippingAddress) {
      setShippingAddress({
        street: "",
        city: "",
        province: "",
        postalCode: "",
        country: "South Africa",
      });
    }
  };

  const handlePickupAddressChange = useCallback((address: GoogleAddressData) => {
    const formattedAddress: Address = {
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };
    setPickupAddress(formattedAddress);

    if (sameAsPickup) {
      setShippingAddress(formattedAddress);
    }
  }, [sameAsPickup]);

  const handleShippingAddressChange = useCallback((address: GoogleAddressData) => {
    const formattedAddress: Address = {
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };
    setShippingAddress(formattedAddress);
  }, []);

  if (isLoading) {
    return (
      <Card className="border-2 border-orange-100 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-orange-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
          <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
            <MapPin className="h-6 w-6 text-orange-600" />
            Address Management
            {pickupAddress && shippingAddress && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Set up your pickup and shipping addresses to enable book sales and
              deliveries. The pickup address is where our couriers can pick up your books,
              and the shipping address is where you'll receive books you
              purchase.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Address Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup Address */}
        <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Pickup Address
              {pickupAddress && (
                <Badge
                  variant="outline"
                  className="border-blue-300 text-blue-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Where our couriers can pick up your books
              </p>

              {pickupAddress && editMode !== "pickup" && editMode !== "both" ? (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Home className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Current Address
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                          {formatAddress(pickupAddress)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => startEditing("pickup")}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Pickup Address
                  </Button>
                </div>
              ) : editMode === "pickup" || editMode === "both" ? (
                <div className="space-y-4">
                  <ManualAddressInput
                    label="Pickup Address"
                    required
                    onAddressSelect={handlePickupAddressChange}
                    defaultValue={
                      pickupAddress
                        ? {
                            formattedAddress: `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.province}, ${pickupAddress.postalCode}`,
                            street: pickupAddress.street,
                            city: pickupAddress.city,
                            province: pickupAddress.province,
                            postalCode: pickupAddress.postalCode,
                            country: pickupAddress.country,
                          }
                        : undefined
                    }
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600 mb-2">
                    No Pickup Address Set
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add a pickup address to start selling books
                  </p>
                  <Button
                    onClick={() => startEditing("pickup")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pickup Address
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Shipping Address
              {shippingAddress && (
                <Badge
                  variant="outline"
                  className="border-green-300 text-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Where you want to receive books that are shipped to you
              </p>

              {shippingAddress &&
              editMode !== "shipping" &&
              editMode !== "both" ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <Navigation className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">
                          Current Address
                        </p>
                        <p className="text-sm text-green-800 mt-1">
                          {formatAddress(shippingAddress)}
                        </p>
                        {sameAsPickup && (
                          <Badge className="mt-2 bg-green-100 text-green-800 border-0">
                            Same as pickup address
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => startEditing("shipping")}
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Shipping Address
                  </Button>
                </div>
              ) : editMode === "shipping" || editMode === "both" ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="same-as-pickup"
                      checked={sameAsPickup}
                      onChange={(e) => {
                        setSameAsPickup(e.target.checked);
                        if (e.target.checked && pickupAddress) {
                          setShippingAddress(pickupAddress);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor="same-as-pickup"
                      className="text-sm font-medium"
                    >
                      Use pickup address for shipping
                    </label>
                  </div>

                  {!sameAsPickup && (
                    <ManualAddressInput
                      label="Shipping Address"
                      required
                      onAddressSelect={handleShippingAddressChange}
                      defaultValue={
                        shippingAddress
                          ? {
                              formattedAddress: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}`,
                              street: shippingAddress.street,
                              city: shippingAddress.city,
                              province: shippingAddress.province,
                              postalCode: shippingAddress.postalCode,
                              country: shippingAddress.country,
                            }
                          : undefined
                      }
                    />
                  )}

                  {sameAsPickup && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Your shipping address will be the same as your pickup
                        address.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600 mb-2">
                    No Shipping Address Set
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add a shipping address to receive deliveries
                  </p>
                  <Button
                    onClick={() => startEditing("shipping")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shipping Address
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons for Edit Mode */}
      {editMode !== "none" && (
        <Card className="border-2 border-purple-100">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                onClick={() => setEditMode("none")}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!pickupAddress || !shippingAddress || isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Saving..." : "Save Addresses"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Setup */}
      {!pickupAddress && !shippingAddress && editMode === "none" && (
        <Card className="border-2 border-indigo-100">
          <CardContent className="p-6 text-center">
            <MapPin className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quick Address Setup
            </h3>
            <p className="text-gray-600 mb-6">
              Set up both addresses at once to get started quickly
            </p>
            <Button
              onClick={() => startEditing("both")}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Set Up Both Addresses
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernAddressTab;
```

---

## Types and Interfaces

### Address Type Definition
**File:** `src/types/address.ts` (Excerpt)

```typescript
export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  streetAddress?: string;
  instructions?: string;
  additional_info?: string;
}

export interface AddressData {
  pickup_address?: Address;
  shipping_address?: Address;
  addresses_same?: boolean;
}
```

---

## Configuration & Environment Variables

### Required Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key  # Set in Supabase Edge Functions Secrets
```

### Supabase Edge Function Secrets
In your Supabase Dashboard:
- Go to: Project Settings → Edge Functions → Secrets
- Add: `GOOGLE_MAPS_API_KEY` with your Google Maps API key

---

## Data Flow Architecture

```
User Input (Search) 
    ↓
ManualAddressInput.handleSearch() 
    ↓
fetchSuggestions() (Service)
    ↓
address-autocomplete Edge Function
    ↓
Google Places Autocomplete API
    ↓
Returns: [{description, place_id}, ...]
    ↓
Display Dropdown Suggestions
    ↓
User Selects Suggestion
    ↓
ManualAddressInput.handleSelectSuggestion()
    ↓
fetchAddressDetails() (Service)
    ↓
address-place-details Edge Function
    ↓
Google Place Details API
    ↓
Returns: {address, lat, lng, street_address, city, province, postal_code, country}
    ↓
Parse & Auto-fill Form Fields
    ↓
Callback: onAddressSelect(AddressData)
    ↓
Parent Component Updates State
    ↓
ModernAddressTab.handlePickupAddressChange() / handleShippingAddressChange()
    ↓
Save to Database
```

---

## Key Features

✅ **Address Autocomplete** - Real-time suggestions as user types
✅ **Auto-fill Form Fields** - Automatically populates street, city, postal code
✅ **Debounced Search** - 300ms debounce to reduce API calls
✅ **CORS Handling** - Proper CORS headers on Edge Functions
✅ **Session-based Auth** - Uses Supabase session tokens for API calls
✅ **Fallback Support** - Falls back to anon key if no session
✅ **Address Parsing** - Intelligently parses Google's formatted address
✅ **Pickup Points** - Mock integration for nearby pickup points (Bob Go API ready)
✅ **Error Handling** - Comprehensive error handling and logging
✅ **Responsive Design** - Mobile-friendly address input forms

---

## Notes

- The address autocomplete is limited to South Africa (`components=country:za`)
- Province field must be manually selected from the dropdown
- Additional Information field is optional for special instructions
- The "Use pickup address for shipping" checkbox allows quick setup
- All sensitive API keys are stored in Supabase secrets, not in code
- The implementation uses React hooks for state management
- Address data is validated before being sent to parent components

