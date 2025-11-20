import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { 
  getAddressSuggestions, 
  selectAddressSuggestion,
  type AddressSuggestion 
} from "@/services/addressAutocompleteService";

export interface AddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  additional_info?: string;
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

const ManualAddressInput: React.FC<ManualAddressInputProps> = ({
  onAddressSelect,
  label = "Address",
  required = false,
  defaultValue = {},
  className = "",
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [street, setStreet] = useState(defaultValue?.street || "");
  const [city, setCity] = useState(defaultValue?.city || "");
  const [province, setProvince] = useState(defaultValue?.province || "");
  const [postalCode, setPostalCode] = useState(defaultValue?.postalCode || "");
  const [additionalInfo, setAdditionalInfo] = useState(defaultValue?.additional_info || "");
  const [isValid, setIsValid] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState("");
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle autocomplete search with debouncing
  const handleSearchInputChange = async (value: string) => {
    setSearchInput(value);
    setAutocompleteError("");

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    
    // Debounce the search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await getAddressSuggestions(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setAutocompleteError("Failed to fetch address suggestions. Please try again.");
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  };

  // Handle suggestion selection and auto-fill address fields
  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    try {
      setIsLoadingSuggestions(true);
      const parsed = await selectAddressSuggestion(suggestion.place_id);
      
      if (parsed) {
        // Auto-fill the address fields with parsed components
        setStreet(parsed.street_address);
        setCity(parsed.city);
        setPostalCode(parsed.postal_code);
        
        // Try to match the province to the SA provinces list
        const matchedProvince = SA_PROVINCES.find(
          p => p.toLowerCase() === parsed.province.toLowerCase()
        );
        setProvince(matchedProvince || parsed.province);
      }
      
      setSearchInput("");
      setSuggestions([]);
      setShowSuggestions(false);
      setAutocompleteError("");
    } catch (err) {
      console.error("Error selecting suggestion:", err);
      setAutocompleteError("Failed to get address details. Please try again.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSuggestions]);

  // Validate address and trigger callback when complete
  useEffect(() => {
    const complete = street.trim() && city.trim() && province && postalCode.trim();
    setIsValid(!!complete);

    if (complete) {
      const addressData: AddressData = {
        formattedAddress: `${street.trim()}, ${city.trim()}, ${province}, ${postalCode.trim()}, South Africa`,
        street: street.trim(),
        city: city.trim(),
        province,
        postalCode: postalCode.trim(),
        country: "South Africa",
        additional_info: additionalInfo.trim() || undefined,
      };
      onAddressSelect(addressData);
    }
  }, [street, city, province, postalCode, additionalInfo, onAddressSelect]);

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <Label className="text-base font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Address Autocomplete Search */}
          <div className="space-y-2">
            <Label htmlFor="address-search" className="text-sm font-medium">
              Search Address (Autocomplete)
            </Label>
            <div className="relative">
              <div className="flex gap-2 items-center">
                <Input
                  id="address-search"
                  type="text"
                  placeholder="Start typing address (e.g., 85 Flamingo Rd)"
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="flex-1"
                  disabled={isLoadingSuggestions}
                />
                {isLoadingSuggestions && (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600 flex-shrink-0" />
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.place_id}-${index}`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      type="button"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {autocompleteError && (
                <div className="mt-2 flex items-start gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{autocompleteError}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Or fill in the fields below manually
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Address Details
            </h4>

            {/* Street Address */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="street" className="text-sm font-medium">
                  Street Address *
                </Label>
                <Input
                  id="street"
                  type="text"
                  placeholder="123 Main Street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required={required}
                  className="mt-1"
                />
              </div>

              {/* City and Postal Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    City *
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Cape Town"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required={required}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode" className="text-sm font-medium">
                    Postal Code *
                  </Label>
                  <Input
                    id="postalCode"
                    type="text"
                    placeholder="8001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required={required}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Province */}
              <div>
                <Label htmlFor="province" className="text-sm font-medium">
                  Province *
                </Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a province" />
                  </SelectTrigger>
                  <SelectContent>
                    {SA_PROVINCES.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Information */}
              <div>
                <Label htmlFor="additional_info" className="text-sm font-medium">
                  Additional Information (Optional)
                </Label>
                <Textarea
                  id="additional_info"
                  placeholder="e.g., Building entrance details, security gate code, special instructions..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include any helpful details for pickup/delivery (gate codes, building access, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Address Preview */}
          {isValid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Complete Address:
                  </p>
                  <p className="text-sm text-green-700">
                    {street}, {city}, {province} {postalCode}, South Africa
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualAddressInput;
