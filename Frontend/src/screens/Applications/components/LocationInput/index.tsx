import type {
  UseFormRegister,
  FieldError,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { useState, useEffect, useMemo, useRef, Suspense, lazy } from "react";
import {
  FiMapPin,
  FiChevronDown,
  FiX,
  FiNavigation,
  FiSearch,
  FiGlobe,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { AdvancedLocationInput } from '../../../../components/AdvancedLocationInput';
import type { LocationCoordinates } from '../../../../services/advancedLocationService';
import { GetState, GetCity } from 'react-country-state-city';
import toast from 'react-hot-toast';

// Lazy load the Advanced Map component
const AdvancedMap = lazy(() =>
  import("../../../../components/AdvancedMap").then((module) => ({ default: module.AdvancedMap }))
);

type StateData = {
  id: number;
  name: string;
  state_code: string;
  latitude?: string;
  longitude?: string;
};

type CityData = {
  id: number;
  name: string;
  latitude?: string;
  longitude?: string;
};

// Define proper types for form data with enterprise location support
interface LocationFormData {
  region?: string;
  city?: string;
  postalCode?: string;
  fullAddress?: string;
  // Enterprise location fields
  advancedLocation?: {
    coordinates: LocationCoordinates;
    address: string;
    placeId?: string;
  };
  locationMethod?: 'manual' | 'advanced' | 'gps';
}

interface LocationInputProps {
  register: UseFormRegister<LocationFormData>;
  errors: {
    region?: FieldError;
    city?: FieldError;
    postalCode?: FieldError;
    fullAddress?: FieldError;
    advancedLocation?: FieldError;
    locationMethod?: FieldError;
  };
  setValue: UseFormSetValue<LocationFormData>;
  watch: UseFormWatch<LocationFormData>;
}

export const LocationInput = ({
  register,
  errors,
  setValue,
  watch,
}: LocationInputProps) => {
  const [region, setRegion] = useState("");
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMethod, setLocationMethod] = useState<'manual' | 'advanced' | 'gps'>('manual');
  const [showAdvancedInput, setShowAdvancedInput] = useState(false);
  const [advancedLocation, setAdvancedLocation] = useState<{
    coordinates: LocationCoordinates;
    address: string;
    placeId?: string;
  } | null>(null);
  
  // Dynamic state and city data
  const [states, setStates] = useState<StateData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Watch current form values with proper error handling
  const watchedRegion = watch ? watch("region") : "";
  const watchedCity = watch ? watch("city") : "";

  // Load Ghana states on component mount
  useEffect(() => {
    const loadStates = async () => {
      setLoadingStates(true);
      try {
        // Ghana country ID is 83 in react-country-state-city
        const ghanaStates = await GetState(83);
        setStates(ghanaStates);
      } catch (error) {
        console.error('Failed to load states:', error);
        toast.error('Failed to load regions');
      } finally {
        setLoadingStates(false);
      }
    };
    
    loadStates();
  }, []);

  // Load cities when a state is selected
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedStateId) {
        setCities([]);
        return;
      }
      
      setLoadingCities(true);
      try {
        const stateCities = await GetCity(83, selectedStateId);
        setCities(stateCities);
      } catch (error) {
        console.error('Failed to load cities:', error);
        toast.error('Failed to load cities');
      } finally {
        setLoadingCities(false);
      }
    };
    
    loadCities();
  }, [selectedStateId]);

  // Sync local state with form values
  useEffect(() => {
    if (watchedRegion && watchedRegion !== region) {
      setRegion(watchedRegion);
    }
  }, [watchedRegion, region]);

  useEffect(() => {
    if (watchedCity && watchedCity !== cityInput) {
      setCityInput(watchedCity);
    }
  }, [watchedCity, cityInput]);

  // Get current state data
  const currentStateData = useMemo(() => {
    return states.find(state => state.name === region || state.state_code === region);
  }, [states, region]);

  // Filter cities based on input
  const filteredCities = useMemo(() => {
    if (!cities.length) return [];
    return cities.filter((city) =>
      city.name.toLowerCase().includes(cityInput.toLowerCase())
    );
  }, [cities, cityInput]);

  // Set map location when region changes
  useEffect(() => {
    if (currentStateData && currentStateData.latitude && currentStateData.longitude) {
      setMapLocation({
        lat: parseFloat(currentStateData.latitude),
        lng: parseFloat(currentStateData.longitude)
      });
    }
  }, [currentStateData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".region-dropdown")) {
        setIsRegionOpen(false);
      }
      if (!target.closest(".city-dropdown")) {
        setIsCityOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRegionSelect = (stateData: StateData) => {
    setRegion(stateData.name);
    setSelectedStateId(stateData.id);
    setValue("region", stateData.name);
    setIsRegionOpen(false);
    setCityInput("");
    setValue("city", "");
    setAddressSuggestions([]);
    setCities([]); // Clear cities when region changes
  };

  const handleCitySelect = (cityData: CityData) => {
    setValue("city", cityData.name);
    setCityInput(cityData.name);
    setIsCityOpen(false);
    fetchAddressSuggestions(cityData.name);
    
    // Update map location if city has coordinates
    if (cityData.latitude && cityData.longitude) {
      const cityLocation = {
        lat: parseFloat(cityData.latitude),
        lng: parseFloat(cityData.longitude)
      };
      setMapLocation(cityLocation);
    }
  };

  const fetchAddressSuggestions = async (query: string) => {
    if (!query.trim()) return;

    // Simulate API call to address service
    setTimeout(() => {
      setAddressSuggestions([
        `${query} Central Business District`,
        `${query} Residential Area`,
        `Downtown ${query}`,
        `${query} Market Area`,
        `North ${query}`,
        `${query} New Town`,
        `${query} Industrial Area`,
      ]);
    }, 300);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapLocation({ lat: latitude, lng: longitude });
        setValue(
          "fullAddress",
          `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        );
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Fallback to simulated location
        if (currentStateData && currentStateData.latitude && currentStateData.longitude) {
          setMapLocation({
            lat: parseFloat(currentStateData.latitude) + (Math.random() * 0.1 - 0.05),
            lng: parseFloat(currentStateData.longitude) + (Math.random() * 0.1 - 0.05),
          });
          setValue("fullAddress", `Near ${currentStateData.name} Center`);
        }
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMapLocation({ lat, lng });
    setValue(
      "fullAddress",
      `Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    );
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Format: 2 letters + 3-5 digits
    if (value.length > 2) {
      value = value.slice(0, 2) + value.slice(2).replace(/[^0-9]/g, "");
    }
    if (value.length > 7) {
      value = value.slice(0, 7);
    }

    setValue("postalCode", value);
  };

  // Handle advanced location selection
  const handleAdvancedLocationChange = async (location?: {
    coordinates: LocationCoordinates;
    address: string;
    placeId?: string;
  }) => {
    if (location) {
      setAdvancedLocation(location);
      setMapLocation(location.coordinates);
      setValue("advancedLocation", location);
      setValue("fullAddress", location.address);
      setValue("locationMethod", "advanced");
      
      // Try to extract region/city from address for compatibility
      const addressParts = location.address.split(',');
      if (addressParts.length > 1) {
        const possibleCity = addressParts[0].trim();
        const possibleRegion = addressParts[addressParts.length - 1].trim();
        
        // Try to match with loaded Ghana states
        const matchedState = states.find(state =>
          state.name.toLowerCase().includes(possibleRegion.toLowerCase()) ||
          possibleRegion.toLowerCase().includes(state.name.toLowerCase())
        );
        
        if (matchedState) {
          setRegion(matchedState.name);
          setSelectedStateId(matchedState.id);
          setValue("region", matchedState.name);
          
          // Load cities for the matched state
          try {
            const stateCities = await GetCity(83, matchedState.id);
            setCities(stateCities);
            
            // Check if city matches any cities in the state
            const matchedCity = stateCities.find(city =>
              city.name.toLowerCase().includes(possibleCity.toLowerCase()) ||
              possibleCity.toLowerCase().includes(city.name.toLowerCase())
            );
            
            if (matchedCity) {
              setCityInput(matchedCity.name);
              setValue("city", matchedCity.name);
            }
          } catch (error) {
            console.warn('Failed to load cities for matched state:', error);
          }
        }
      }
      
      toast.success('Location set successfully!');
    } else {
      setAdvancedLocation(null);
      setValue("advancedLocation", undefined);
      setValue("locationMethod", "manual");
    }
  };

  // Switch between location input methods
  const handleLocationMethodChange = (method: 'manual' | 'advanced' | 'gps') => {
    setLocationMethod(method);
    setValue("locationMethod", method);
    
    if (method === 'advanced') {
      setShowAdvancedInput(true);
    } else {
      setShowAdvancedInput(false);
      if (method === 'manual') {
        setAdvancedLocation(null);
        setValue("advancedLocation", undefined);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Input Method Selector */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <FiGlobe className="mr-2 text-indigo-600" />
          Choose Location Input Method
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleLocationMethodChange('manual')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              locationMethod === 'manual'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center mb-2">
              <FiMapPin className={`mr-2 ${locationMethod === 'manual' ? 'text-indigo-600' : 'text-gray-500'}`} />
              <span className={`font-medium ${locationMethod === 'manual' ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'}`}>
                Manual Entry
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select region and city manually
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleLocationMethodChange('advanced')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              locationMethod === 'advanced'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center mb-2">
              <FiGlobe className={`mr-2 ${locationMethod === 'advanced' ? 'text-indigo-600' : 'text-gray-500'}`} />
              <span className={`font-medium ${locationMethod === 'advanced' ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'}`}>
                Smart Search
              </span>
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Recommended
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced autocomplete with GPS
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleLocationMethodChange('gps')}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              locationMethod === 'gps'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center mb-2">
              <FiNavigation className={`mr-2 ${locationMethod === 'gps' ? 'text-indigo-600' : 'text-gray-500'}`} />
              <span className={`font-medium ${locationMethod === 'gps' ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'}`}>
                GPS Only
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use current GPS location
            </p>
          </button>
        </div>
      </div>

      {/* Advanced Location Input */}
      {locationMethod === 'advanced' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiGlobe className="mr-2 text-indigo-600" />
              Advanced Location Search
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                High Accuracy
              </span>
            </h4>
            <AdvancedLocationInput
              value={advancedLocation ? {
                coordinates: advancedLocation.coordinates,
                address: advancedLocation.address,
                placeId: advancedLocation.placeId,
              } : undefined}
              onChange={handleAdvancedLocationChange}
              placeholder="Search for your address with high accuracy..."
              label="Address Search"
              showMap={false}
              autoComplete={true}
              bias={currentStateData?.latitude && currentStateData?.longitude ? {
                lat: parseFloat(currentStateData.latitude),
                lng: parseFloat(currentStateData.longitude)
              } : undefined}
              className="w-full"
            />
            {errors.advancedLocation && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.advancedLocation.message || 'Please select a valid location'}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Manual Entry Fields */}
      {locationMethod === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Enhanced Region Selector */}
        <div className="relative region-dropdown">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State/Province <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsRegionOpen(!isRegionOpen)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.region ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors`}
          >
            <span className="flex items-center">
              <FiMapPin className="mr-2 text-indigo-600" />
              {region ? (
                <span className="font-medium">{region}</span>
              ) : loadingStates ? (
                <span className="text-gray-400 flex items-center">
                  <span className="animate-spin mr-2">⟳</span>
                  Loading regions...
                </span>
              ) : (
                <span className="text-gray-400">Select region...</span>
              )}
            </span>
            <FiChevronDown
              className={`transition-transform duration-200 ${
                isRegionOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {isRegionOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-20 mt-1 w-full bg-white shadow-xl rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-auto"
              >
                <div className="py-1">
                  {loadingStates ? (
                    <div className="px-4 py-3 text-gray-500 flex items-center">
                      <span className="animate-spin mr-2">⟳</span>
                      Loading regions...
                    </div>
                  ) : states.length > 0 ? (
                    states.map((state) => (
                      <button
                        key={state.id}
                        type="button"
                        onClick={() => handleRegionSelect(state)}
                        className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center ${
                          region === state.name
                            ? "bg-indigo-100 text-indigo-900"
                            : "text-gray-900"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{state.name}</div>
                          {state.latitude && state.longitude && (
                            <div className="text-xs text-gray-500 mt-1">
                              Coordinates: {parseFloat(state.latitude).toFixed(4)}, {parseFloat(state.longitude).toFixed(4)}
                            </div>
                          )}
                        </div>
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                          {state.state_code}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      No regions available
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {errors.region && (
            <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
          )}
        </div>

        {/* Smart City Search */}
        <div className="relative city-dropdown">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              ref={cityInputRef}
              type="text"
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value);
                setValue("city", e.target.value);
              }}
              onFocus={() => selectedStateId && setIsCityOpen(true)}
              placeholder={selectedStateId ? "Search city..." : "Select region first"}
              disabled={!selectedStateId || loadingCities}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.city ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-10 disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            {cityInput && (
              <button
                type="button"
                onClick={() => {
                  setCityInput("");
                  setValue("city", "");
                  setAddressSuggestions([]);
                  cityInputRef.current?.focus();
                }}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <FiX />
              </button>
            )}
          </div>

          <AnimatePresence>
            {isCityOpen && selectedStateId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-20 mt-1 w-full bg-white shadow-xl rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto"
              >
                <div className="py-1">
                  {loadingCities ? (
                    <div className="px-4 py-2 text-gray-500 flex items-center">
                      <span className="animate-spin mr-2">⟳</span>
                      Loading cities...
                    </div>
                  ) : filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className={`w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors ${
                          cityInput === city.name
                            ? "bg-indigo-100 text-indigo-900"
                            : "text-gray-900"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{city.name}</div>
                          {city.latitude && city.longitude && (
                            <div className="text-xs text-gray-500">
                              {parseFloat(city.latitude).toFixed(4)}, {parseFloat(city.longitude).toFixed(4)}
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : cityInput ? (
                    <div className="px-4 py-2 text-gray-500">
                      No matching cities found
                    </div>
                  ) : selectedStateId ? (
                    <div className="px-4 py-2 text-gray-500">
                      Type to search cities...
                    </div>
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      Please select a region first
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        {/* Postal Code with Auto-Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postal Code
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="GA123"
              {...register("postalCode", {
                pattern: {
                  value: /^[A-Z]{2}\d{3,5}$/,
                  message: "Enter valid postal code (e.g., GA123)",
                },
              })}
              onChange={handlePostalCodeChange}
              maxLength={7}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.postalCode ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-10 font-mono`}
            />
            <span className="absolute left-3 top-3.5 text-gray-400 text-sm font-mono">
              GH
            </span>
          </div>
          {errors.postalCode && (
            <p className="mt-1 text-sm text-red-600">
              {errors.postalCode.message}
            </p>
          )}
        </div>

        {/* Address Autocomplete for Manual Entry */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Address
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Building, street, landmark"
              {...register("fullAddress")}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.fullAddress ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
            />
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="absolute right-3 top-3.5 flex items-center text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLocating ? (
                <>
                  <span className="animate-spin mr-1">↻</span>
                  Locating...
                </>
              ) : (
                <>
                  <FiNavigation className="mr-1" />
                  Use my location
                </>
              )}
            </button>
          </div>

          {addressSuggestions.length > 0 && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {addressSuggestions.map((address) => (
                <button
                  key={address}
                  type="button"
                  onClick={() => {
                    setValue("fullAddress", address);
                    setAddressSuggestions([]);
                  }}
                  className="text-left text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded transition-colors truncate text-gray-900 dark:text-gray-100"
                  title={address}
                >
                  {address}
                </button>
              ))}
            </div>
          )}

          {errors.fullAddress && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.fullAddress.message}
            </p>
          )}
        </div>
        </div>
        </motion.div>
      )}

      {/* GPS Location Handler */}
      {locationMethod === 'gps' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <FiNavigation className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                GPS Location Detection
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click the button below to use your current GPS location
              </p>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLocating ? (
                  <>
                    <span className="animate-spin mr-2">↻</span>
                    Getting Location...
                  </>
                ) : (
                  <>
                    <FiNavigation className="mr-2" />
                    Use My Location
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Interactive Advanced Map */}
      {(mapLocation || locationMethod !== 'manual') && (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="h-96 w-full relative">
            <Suspense
              fallback={
                <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="animate-pulse text-gray-500 dark:text-gray-400 flex items-center">
                    <FiGlobe className="mr-2" />
                    Loading interactive map...
                  </div>
                </div>
              }
            >
              {typeof window !== "undefined" && (
                <AdvancedMap
                  center={mapLocation || (currentStateData?.latitude && currentStateData?.longitude ? {
                    lat: parseFloat(currentStateData.latitude),
                    lng: parseFloat(currentStateData.longitude)
                  } : { lat: 7.9465, lng: -1.0232 })}
                  zoom={13}
                  onClick={handleMapClick}
                  markers={mapLocation ? [{ 
                    position: mapLocation,
                    type: locationMethod === 'advanced' ? 'user' : 'default',
                    title: locationMethod === 'advanced' ? 'Selected Location' : 'GPS Location',
                    description: advancedLocation?.address || `${mapLocation.lat.toFixed(4)}, ${mapLocation.lng.toFixed(4)}`
                  }] : []}
                  showControls={true}
                  showUserLocation={locationMethod === 'gps' || locationMethod === 'advanced'}
                  enableLocationTracking={locationMethod === 'gps'}
                  showLayerInfo={true}
                  initialLayer="street"
                  isDark={false}
                  className="w-full h-full"
                />
              )}
            </Suspense>
          </div>
        </div>
      )}

      {/* Region Information Card */}
      {currentStateData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800"
        >
          <div className="flex items-start">
            <div className="bg-indigo-100 dark:bg-indigo-800 p-3 rounded-lg mr-4 flex-shrink-0">
              <FiMapPin className="text-indigo-600 dark:text-indigo-400 text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center flex-wrap">
                {currentStateData.name} Region
                <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                  {currentStateData.state_code}
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                {currentStateData.latitude && currentStateData.longitude && (
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                    <div className="text-gray-500 dark:text-gray-400 text-xs">Coordinates</div>
                    <div className="font-mono text-sm text-gray-900 dark:text-white">
                      {parseFloat(currentStateData.latitude).toFixed(4)},{" "}
                      {parseFloat(currentStateData.longitude).toFixed(4)}
                    </div>
                  </div>
                )}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400 text-xs">Cities Available</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {cities.length} cities
                  </div>
                </div>
              </div>
              {cities.length > 0 && (
                <div className="mt-3">
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Available Cities:</div>
                  <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                    {cities.slice(0, 12).map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900 px-2 py-1 rounded text-xs transition-colors cursor-pointer text-gray-900 dark:text-white"
                      >
                        {city.name}
                      </button>
                    ))}
                    {cities.length > 12 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                        +{cities.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
