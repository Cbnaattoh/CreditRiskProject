import { RegionDropdown } from "react-country-region-selector";
import type { UseFormRegister, FieldError } from "react-hook-form";
import { useState, useEffect, useMemo, useRef, Suspense, lazy } from "react";
import {
  FiMapPin,
  FiChevronDown,
  FiX,
  FiNavigation,
  FiSearch,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load the Map component
const GhanaMap = lazy(() =>
  import("../GhanaMap").then((module) => ({ default: module.GhanaMap }))
);

type Region = {
  value: string;
  name: string;
};

// Complete Ghana regions data with coordinates
const ghanaRegionsData = {
  AA: {
    cities: [
      "Accra",
      "Tema",
      "Madina",
      "Nungua",
      "Ashaiman",
      "Teshie",
      "Lashibi",
      "Labadi",
      "Osu",
      "Dansoman",
    ],
    capital: "Accra",
    area: "3,245 km²",
    population: "5.4 million",
    coordinates: { lat: 5.6037, lng: -0.187 },
    zoom: 11,
  },
  AH: {
    cities: [
      "Kumasi",
      "Obuasi",
      "Ejisu",
      "Konongo",
      "Mampong",
      "Bekwai",
      "Ejura",
      "Offinso",
      "Agogo",
      "Juaso",
    ],
    capital: "Kumasi",
    area: "24,389 km²",
    population: "5.8 million",
    coordinates: { lat: 6.6885, lng: -1.6244 },
    zoom: 10,
  },
  BA: {
    cities: [
      "Sunyani",
      "Berekum",
      "Dormaa Ahenkro",
      "Wenchi",
      "Techiman",
      "Nkoranza",
      "Atebubu",
      "Kintampo",
      "Sampa",
      "Japekrom",
    ],
    capital: "Sunyani",
    area: "39,557 km²",
    population: "2.3 million",
    coordinates: { lat: 7.336, lng: -2.3363 },
    zoom: 9,
  },
  CP: {
    cities: [
      "Cape Coast",
      "Elmina",
      "Saltpond",
      "Winneba",
      "Mankessim",
      "Dunkwa",
      "Agona Swedru",
      "Kasoa",
      "Anomabu",
      "Moree",
    ],
    capital: "Cape Coast",
    area: "9,826 km²",
    population: "2.9 million",
    coordinates: { lat: 5.1315, lng: -1.2795 },
    zoom: 10,
  },
  EP: {
    cities: [
      "Koforidua",
      "Nsawam",
      "Suhum",
      "Akropong",
      "Aburi",
      "Nkawkaw",
      "Mpraeso",
      "Asamankese",
      "Akim Oda",
      "Akwatia",
    ],
    capital: "Koforidua",
    area: "19,323 km²",
    population: "2.6 million",
    coordinates: { lat: 6.0961, lng: -0.2477 },
    zoom: 9,
  },
  NP: {
    cities: [
      "Tamale",
      "Yendi",
      "Savelugu",
      "Walewale",
      "Buipe",
      "Damongo",
      "Bole",
      "Sawla",
      "Larabanga",
      "Salaga",
    ],
    capital: "Tamale",
    area: "70,384 km²",
    population: "2.5 million",
    coordinates: { lat: 9.4008, lng: -0.8393 },
    zoom: 8,
  },
  UE: {
    cities: [
      "Bolgatanga",
      "Bawku",
      "Navrongo",
      "Zebilla",
      "Sandema",
      "Paga",
      "Bongo",
      "Tongo",
      "Sirigu",
      "Binduri",
    ],
    capital: "Bolgatanga",
    area: "8,842 km²",
    population: "1.3 million",
    coordinates: { lat: 10.7856, lng: -0.8519 },
    zoom: 9,
  },
  UW: {
    cities: [
      "Wa",
      "Tumu",
      "Lawra",
      "Nandom",
      "Jirapa",
      "Hamile",
      "Gwollu",
      "Funsi",
      "Lambussie",
      "Wechiau",
    ],
    capital: "Wa",
    area: "18,476 km²",
    population: "900,000",
    coordinates: { lat: 10.0601, lng: -2.5098 },
    zoom: 9,
  },
  TV: {
    cities: [
      "Ho",
      "Hohoe",
      "Keta",
      "Aflao",
      "Kpando",
      "Kpeve",
      "Denu",
      "Akatsi",
      "Keta",
      "Have",
    ],
    capital: "Ho",
    area: "20,570 km²",
    population: "2.1 million",
    coordinates: { lat: 6.6009, lng: 0.4703 },
    zoom: 9,
  },
  WP: {
    cities: [
      "Sekondi-Takoradi",
      "Tarkwa",
      "Axim",
      "Prestea",
      "Shama",
      "Elubo",
      "Half Assini",
      "Bogoso",
      "Daboase",
      "Awaso",
    ],
    capital: "Sekondi-Takoradi",
    area: "23,921 km²",
    population: "3.0 million",
    coordinates: { lat: 4.9346, lng: -1.7137 },
    zoom: 9,
  },
  OT: {
    cities: [
      "Dambai",
      "Jasikan",
      "Kadjebi",
      "Kpassa",
      "Nkwanta",
      "Worawora",
      "Brewaniase",
      "Chinderi",
      "Kete Krachi",
      "Pai Katanga",
    ],
    capital: "Dambai",
    area: "38,323 km²",
    population: "1.2 million",
    coordinates: { lat: 8.0689, lng: 0.1796 },
    zoom: 8,
  },
  SV: {
    cities: [
      "Goaso",
      "Mim",
      "Dadieso",
      "Acherensua",
      "Kenyasi",
      "Hwidiem",
      "Bechem",
      "Duayaw Nkwanta",
      "Kukuom",
      "Sankore",
    ],
    capital: "Goaso",
    area: "10,074 km²",
    population: "1.6 million",
    coordinates: { lat: 6.8066, lng: -2.5176 },
    zoom: 9,
  },
};

export const LocationInput = ({
  register,
  errors,
  setValue,
  watch,
}: {
  register: UseFormRegister<any>;
  errors: {
    region?: FieldError;
    city?: FieldError;
    postalCode?: FieldError;
    fullAddress?: FieldError;
  };
  setValue: any;
  watch: any;
}) => {
  const [region, setRegion] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);

  const currentRegionData = useMemo(
    () =>
      region ? ghanaRegionsData[region as keyof typeof ghanaRegionsData] : null,
    [region]
  );

  const filteredCities = useMemo(() => {
    if (!region || !ghanaRegionsData[region as keyof typeof ghanaRegionsData])
      return [];
    return ghanaRegionsData[
      region as keyof typeof ghanaRegionsData
    ].cities.filter((city) =>
      city.toLowerCase().includes(cityInput.toLowerCase())
    );
  }, [region, cityInput]);

  // Set map location when region changes
  useEffect(() => {
    if (currentRegionData) {
      setMapLocation(currentRegionData.coordinates);
    }
  }, [currentRegionData]);

  const handleRegionSelect = (val: string) => {
    setRegion(val);
    setValue("region", val);
    setIsRegionOpen(false);
    setCityInput("");
    setValue("city", "");
  };

  const handleCitySelect = (city: string) => {
    setValue("city", city);
    setCityInput(city);
    setIsCityOpen(false);
    fetchAddressSuggestions(city);
  };

  const fetchAddressSuggestions = async (query: string) => {
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
    setIsLocating(true);
    // Simulate GPS lookup
    setTimeout(() => {
      if (currentRegionData) {
        setMapLocation({
          lat: currentRegionData.coordinates.lat + (Math.random() * 0.1 - 0.05),
          lng: currentRegionData.coordinates.lng + (Math.random() * 0.1 - 0.05),
        });
        setValue("fullAddress", `Near ${currentRegionData.capital} Central`);
      }
      setIsLocating(false);
    }, 1200);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMapLocation({ lat, lng });
    setValue(
      "fullAddress",
      `Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Enhanced Region Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State/Province <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsRegionOpen(!isRegionOpen)}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.region ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between`}
          >
            <span className="flex items-center">
              <FiMapPin className="mr-2 text-indigo-600" />
              {region ? (
                <span className="font-medium">
                  {
                    ghanaRegionsData[region as keyof typeof ghanaRegionsData]
                      ?.capital
                  }
                </span>
              ) : (
                <span className="text-gray-400">Select region...</span>
              )}
            </span>
            <FiChevronDown
              className={`transition-transform ${
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
                className="absolute z-20 mt-1 w-full bg-white shadow-xl rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-auto"
              >
                <RegionDropdown
                  country="GH"
                  value={region}
                  onChange={handleRegionSelect}
                  classes="hidden"
                  countryValueType="short"
                  regionFilter={(region: Region) => ({
                    ...region,
                    name:
                      ghanaRegionsData[
                        region.value as keyof typeof ghanaRegionsData
                      ]?.capital || region.name,
                  })}
                />
                <div className="py-1">
                  {Object.entries(ghanaRegionsData).map(([code, data]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleRegionSelect(code)}
                      className={`w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center ${
                        region === code
                          ? "bg-indigo-100 text-indigo-900"
                          : "text-gray-900"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{data.capital}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {data.area} • Pop: {data.population}
                        </div>
                      </div>
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                        {code}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Smart City Search */}
        <div className="relative">
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
              onFocus={() => setIsCityOpen(true)}
              placeholder="Search city..."
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.city ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-10`}
            />
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            {cityInput && (
              <button
                type="button"
                onClick={() => {
                  setCityInput("");
                  setValue("city", "");
                  cityInputRef.current?.focus();
                }}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500"
              >
                <FiX />
              </button>
            )}
          </div>

          <AnimatePresence>
            {isCityOpen &&
              region &&
              (filteredCities.length > 0 || cityInput) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-20 mt-1 w-full bg-white shadow-xl rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto"
                >
                  <div className="py-1">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleCitySelect(city)}
                          className={`w-full text-left px-4 py-2 hover:bg-indigo-50 ${
                            cityInput === city
                              ? "bg-indigo-100 text-indigo-900"
                              : "text-gray-900"
                          }`}
                        >
                          {city}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        No matching cities found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
          </AnimatePresence>
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
                  value: /^[A-Za-z]{2}\d{3,5}$/,
                  message: "Enter valid postal code (e.g., GA123)",
                },
              })}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (/^[A-Za-z]{0,2}\d{0,5}$/.test(value)) {
                  setValue("postalCode", value);
                }
              }}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.postalCode ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-10`}
            />
            <span className="absolute left-3 top-3.5 text-gray-400 text-sm font-mono">
              GH
            </span>
          </div>
        </div>
      </div>

      {/* Address Autocomplete */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Address
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Building, street, landmark"
            {...register("fullAddress")}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.fullAddress ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
          />
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="absolute right-3 top-3.5 flex items-center text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {isLocating ? (
              <span className="animate-spin">↻</span>
            ) : (
              <>
                <FiNavigation className="mr-1" />
                Use my location
              </>
            )}
          </button>
        </div>

        {addressSuggestions.length > 0 && (
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            {addressSuggestions.map((address) => (
              <button
                key={address}
                type="button"
                onClick={() => setValue("fullAddress", address)}
                className="text-left text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded truncate"
              >
                {address}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="h-64 w-full relative">
          <Suspense
            fallback={
              <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-pulse text-gray-500">
                  Loading map...
                </div>
              </div>
            }
          >
            {typeof window !== "undefined" && (
              <GhanaMap
                center={mapLocation || { lat: 7.9465, lng: -1.0232 }}
                zoom={currentRegionData?.zoom || 7}
                onClick={handleMapClick}
                markers={mapLocation ? [{ position: mapLocation }] : []}
              />
            )}
          </Suspense>
          <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-lg shadow-sm text-sm">
            {mapLocation ? (
              <span>
                {mapLocation.lat.toFixed(4)}, {mapLocation.lng.toFixed(4)}
              </span>
            ) : (
              <span className="text-gray-500">Click map to set location</span>
            )}
          </div>
        </div>
      </div>


      {/* Region Information Card */}
      {currentRegionData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100"
        >
          <div className="flex items-start">
            <div className="bg-indigo-100 p-3 rounded-lg mr-4">
              <FiMapPin className="text-indigo-600 text-xl" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 flex items-center">
                {currentRegionData.capital} Region
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  {region}
                </span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                <div className="bg-white p-2 rounded-lg">
                  <div className="text-gray-500">Area</div>
                  <div className="font-medium">{currentRegionData.area}</div>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <div className="text-gray-500">Population</div>
                  <div className="font-medium">
                    {currentRegionData.population}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <div className="text-gray-500">Capital</div>
                  <div className="font-medium">{currentRegionData.capital}</div>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <div className="text-gray-500">Coordinates</div>
                  <div className="font-mono text-xs">
                    {currentRegionData.coordinates.lat.toFixed(4)},{" "}
                    {currentRegionData.coordinates.lng.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-gray-500 text-sm mb-1">Major Cities:</div>
                <div className="flex flex-wrap gap-2">
                  {currentRegionData.cities.slice(0, 8).map((city) => (
                    <span
                      key={city}
                      className="bg-white px-2 py-1 rounded text-xs"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
