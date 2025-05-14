import FormSection from "../../FormSection";
import { FormInput } from "../../FormInput";
import { LocationInput } from "../../LocationInput";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { FormData } from "../../types";

export const PersonalInfoStep = ({
  register,
  errors,
}: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}) => (
  <>
    <FormSection title="A. Basic Identity">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormInput
          label="First Name"
          name="firstName"
          register={register}
          error={errors.firstName}
          required
          placeholder="John"
        />
        <FormInput
          label="Other Names"
          name="otherNames"
          register={register}
          error={errors.otherNames}
        />
        <FormInput
          label="Last Name"
          name="lastName"
          register={register}
          error={errors.lastName}
          required
          placeholder="Doe"
        />
        <FormInput
          label="Date of Birth"
          name="dob"
          type="date"
          register={register}
          error={errors.dob}
          required
        />
        <FormInput
          label="National ID Number"
          name="nationalIDNumber"
          register={register}
          error={errors.nationalIDNumber}
          required
          placeholder="GHA-XXXXXXXXX-X"
        />
        <FormInput
          label="Gender"
          name="gender"
          type="select"
          register={register}
          error={errors.gender}
          required
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "transgender", label: "Transgender" },
            { value: "undisclosed", label: "Prefer not to say" },
          ]}
        />
        <FormInput
          label="Marital Status"
          name="maritalStatus"
          type="select"
          register={register}
          error={errors.maritalStatus}
          required
          options={[
            { value: "married", label: "Married" },
            { value: "single", label: "Single" },
            { value: "divorced", label: "Divorced" },
          ]}
        />
      </div>
    </FormSection>

    <FormSection title="B. Contact Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormInput
          label="Phone Number"
          name="phone"
          type="tel"
          register={register}
          error={errors.phone}
          required
          placeholder="0202344444"
        />
        <FormInput
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          required
          placeholder="your@email.com"
        />
        <FormInput
          label="Residential Address"
          name="residentialAddress"
          register={register}
          error={errors.residentialAddress}
          required
          placeholder="East Legon"
        />
        <FormInput
          label="Digital Address"
          name="digitalAddress"
          register={register}
          error={errors.digitalAddress}
          required
          placeholder="GE-3445-345"
        />

        <FormInput
          label="Landmark"
          name="landmark"
          register={register}
          error={errors.landmark}
          placeholder="Near church/school/etc."
        />

        {/* <LocationInput register={register} errors={errors} /> */}
      </div>
      <LocationInput register={register} errors={errors} />
    </FormSection>

  </>
);




// import { RegionDropdown } from "react-country-region-selector";
// import type { UseFormRegister, FieldError } from "react-hook-form";
// import { useState, useEffect, useMemo, useRef } from "react";
// import { FiMapPin, FiChevronDown, FiX, FiNavigation, FiSearch } from "react-icons/fi";
// import { motion, AnimatePresence } from "framer-motion";
// import dynamic from "next/dynamic";

// // Dynamically load Map component to avoid SSR issues
// const Map = dynamic(() => import("./GhanaMap"), {
//   ssr: false,
//   loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
// });

// type Region = {
//   value: string;
//   name: string;
// };

// // Enhanced Ghana regions data with coordinates
// const ghanaRegionsData = {
//   AA: {
//     cities: ["Accra", "Tema", "Madina", "Nungua", "Ashaiman", "Teshie", "Lashibi"],
//     capital: "Accra",
//     area: "3,245 km²",
//     population: "5.4 million",
//     coordinates: { lat: 5.6037, lng: -0.187 },
//     zoom: 11
//   },
//   AH: {
//     cities: ["Kumasi", "Obuasi", "Ejisu", "Konongo", "Mampong", "Bekwai"],
//     capital: "Kumasi",
//     area: "24,389 km²",
//     population: "5.8 million",
//     coordinates: { lat: 6.6885, lng: -1.6244 },
//     zoom: 10
//   },
//   // ... other regions
// };

// export const UltimateLocationInput = ({
//   register,
//   errors,
//   setValue,
//   watch
// }: {
//   register: UseFormRegister<any>;
//   errors: {
//     region?: FieldError;
//     city?: FieldError;
//     postalCode?: FieldError;
//     fullAddress?: FieldError;
//   };
//   setValue: any;
//   watch: any;
// }) => {
//   const [region, setRegion] = useState("");
//   const [cityInput, setCityInput] = useState("");
//   const [isRegionOpen, setIsRegionOpen] = useState(false);
//   const [isCityOpen, setIsCityOpen] = useState(false);
//   const [mapLocation, setMapLocation] = useState<{lat: number, lng: number} | null>(null);
//   const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
//   const [isLocating, setIsLocating] = useState(false);
//   const cityInputRef = useRef<HTMLInputElement>(null);

//   const currentRegionData = useMemo(() =>
//     region ? ghanaRegionsData[region] : null
//   , [region]);

//   const filteredCities = useMemo(() => {
//     if (!region || !ghanaRegionsData[region]) return [];
//     return ghanaRegionsData[region].cities.filter(city =>
//       city.toLowerCase().includes(cityInput.toLowerCase())
//     );
//   }, [region, cityInput]);

//   // Set map location when region changes
//   useEffect(() => {
//     if (currentRegionData) {
//       setMapLocation(currentRegionData.coordinates);
//     }
//   }, [currentRegionData]);

//   const handleRegionSelect = (val: string) => {
//     setRegion(val);
//     setValue("region", val);
//     setIsRegionOpen(false);
//     setCityInput("");
//     setValue("city", "");
//   };

//   const handleCitySelect = (city: string) => {
//     setValue("city", city);
//     setCityInput(city);
//     setIsCityOpen(false);
//     fetchAddressSuggestions(city);
//   };

//   const fetchAddressSuggestions = async (query: string) => {
//     // Simulate API call to address service
//     setTimeout(() => {
//       setAddressSuggestions([
//         `${query} Central Business District`,
//         `${query} Residential Area`,
//         `Downtown ${query}`,
//         `${query} Market Area`
//       ]);
//     }, 500);
//   };

//   const handleUseCurrentLocation = () => {
//     setIsLocating(true);
//     // Simulate GPS lookup
//     setTimeout(() => {
//       if (currentRegionData) {
//         setMapLocation({
//           lat: currentRegionData.coordinates.lat + (Math.random() * 0.1 - 0.05),
//           lng: currentRegionData.coordinates.lng + (Math.random() * 0.1 - 0.05)
//         });
//         setValue("fullAddress", `Near ${currentRegionData.capital} Central`);
//       }
//       setIsLocating(false);
//     }, 1500);
//   };

//   const handleMapClick = (lat: number, lng: number) => {
//     setMapLocation({ lat, lng });
//     setValue("fullAddress", `Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
//   };

//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {/* Enhanced Region Selector */}
//         <div className="relative">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             State/Province *
//           </label>
//           <button
//             type="button"
//             onClick={() => setIsRegionOpen(!isRegionOpen)}
//             className={`w-full px-4 py-3 rounded-lg border ${
//               errors.region ? "border-red-500" : "border-gray-300"
//             } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between`}
//           >
//             <span className="flex items-center">
//               <FiMapPin className="mr-2 text-indigo-600" />
//               {region ? (
//                 <span className="font-medium">
//                   {ghanaRegionsData[region]?.capital}
//                 </span>
//               ) : (
//                 <span className="text-gray-400">Select region...</span>
//               )}
//             </span>
//             <FiChevronDown className={`transition-transform ${isRegionOpen ? "rotate-180" : ""}`} />
//           </button>

//           <AnimatePresence>
//             {isRegionOpen && (
//               <motion.div
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 className="absolute z-20 mt-1 w-full bg-white shadow-xl rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-auto"
//               >
//                 <RegionDropdown
//                   country="GH"
//                   value={region}
//                   onChange={handleRegionSelect}
//                   classes="hidden"
//                   countryValueType="short"
//                   regionFilter={(region: Region) => ({
//                     ...region,
//                     name: ghanaRegionsData[region.value]?.capital || region.name,
//                   })}
//                 />
//                 <div className="py-1">
//                   {Object.entries(ghanaRegionsData).map(([code, data]) => (
//                     <button
//                       key={code}
//                       type="button"
//                       onClick={() => handleRegionSelect(code)}
//                       className={`w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center ${
//                         region === code ? "bg-indigo-100 text-indigo-900" : "text-gray-900"
//                       }`}
//                     >
//                       <div className="flex-1">
//                         <div className="font-medium">{data.capital}</div>
//                         <div className="text-xs text-gray-500 mt-1">
//                           {data.area} • Pop: {data.population}
//                         </div>
//                       </div>
//                       <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
//                         {code}
//                       </span>
//                     </button>
//                   ))}
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* Smart City Search */}
//         <div className="relative">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             City *
//           </label>
//           <div className="relative">
//             <input
//               ref={cityInputRef}
//               type="text"
//               value={cityInput}
//               onChange={(e) => {
//                 setCityInput(e.target.value);
//                 setValue("city", e.target.value);
//               }}
//               onFocus={() => setIsCityOpen(true)}
//               placeholder="Search city..."
//               className={`w-full px-4 py-3 rounded-lg border ${
//                 errors.city ? "border-red-500" : "border-gray-300"
//               } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-10`}
//             />
//             <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
//             {cityInput && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   setCityInput("");
//                   setValue("city", "");
//                   cityInputRef.current?.focus();
//                 }}
//                 className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500"
//               >
//                 <FiX />
//               </button>
//             )}
//           </div>

//           <AnimatePresence>
//             {isCityOpen && region && (filteredCities.length > 0 || cityInput) && (
//               <motion.div
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 className="absolute z-20 mt-1 w-full bg-white shadow-xl rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto"
//               >
//                 <div className="py-1">
//                   {filteredCities.length > 0 ? (
//                     filteredCities.map((city) => (
//                       <button
//                         key={city}
//                         type="button"
//                         onClick={() => handleCitySelect(city)}
//                         className={`w-full text-left px-4 py-2 hover:bg-indigo-50 ${
//                           cityInput === city ? "bg-indigo-100 text-indigo-900" : "text-gray-900"
//                         }`}
//                       >
//                         {city}
//                       </button>
//                     ))
//                   ) : (
//                     <div className="px-4 py-2 text-gray-500">
//                       No matching cities found
//                     </div>
//                   )}
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* Postal Code with Auto-Format */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Postal Code
//           </label>
//           <div className="relative">
//             <input
//               type="text"
//               placeholder="GA123"
//               {...register("postalCode", {
//                 pattern: {
//                   value: /^[A-Za-z]{2}\d{3,5}$/,
//                   message: "Enter valid postal code (e.g., GA123)"
//                 }
//               })}
//               onChange={(e) => {
//                 const value = e.target.value.toUpperCase();
//                 if (/^[A-Za-z]{0,2}\d{0,5}$/.test(value)) {
//                   setValue("postalCode", value);
//                 }
//               }}
//               className={`w-full px-4 py-3 rounded-lg border ${
//                 errors.postalCode ? "border-red-500" : "border-gray-300"
//               } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-10`}
//             />
//             <span className="absolute left-3 top-3.5 text-gray-400 text-sm font-mono">GH</span>
//           </div>
//         </div>
//       </div>

//       {/* Address Autocomplete */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Full Address
//         </label>
//         <div className="relative">
//           <input
//             type="text"
//             placeholder="Building, street, landmark"
//             {...register("fullAddress")}
//             className={`w-full px-4 py-3 rounded-lg border ${
//               errors.fullAddress ? "border-red-500" : "border-gray-300"
//             } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
//           />
//           <button
//             type="button"
//             onClick={handleUseCurrentLocation}
//             disabled={isLocating}
//             className="absolute right-3 top-3.5 flex items-center text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
//           >
//             {isLocating ? (
//               <span className="animate-spin">↻</span>
//             ) : (
//               <>
//                 <FiNavigation className="mr-1" />
//                 Use my location
//               </>
//             )}
//           </button>
//         </div>

//         {addressSuggestions.length > 0 && (
//           <div className="mt-2 grid grid-cols-2 gap-2">
//             {addressSuggestions.map((address) => (
//               <button
//                 key={address}
//                 type="button"
//                 onClick={() => setValue("fullAddress", address)}
//                 className="text-left text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded"
//               >
//                 {address}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Interactive Map */}
//       <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
//         <div className="h-64 w-full relative">
//           <Map
//             center={mapLocation || { lat: 7.9465, lng: -1.0232 }}
//             zoom={currentRegionData?.zoom || 7}
//             onClick={handleMapClick}
//             markers={mapLocation ? [{ position: mapLocation }] : []}
//           />
//           <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-lg shadow-sm text-sm">
//             {mapLocation ? (
//               <span>
//                 {mapLocation.lat.toFixed(4)}, {mapLocation.lng.toFixed(4)}
//               </span>
//             ) : (
//               <span className="text-gray-500">Click map to set location</span>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Region Information Card */}
//       {currentRegionData && (
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100"
//         >
//           <div className="flex items-start">
//             <div className="bg-indigo-100 p-3 rounded-lg mr-4">
//               <FiMapPin className="text-indigo-600 text-xl" />
//             </div>
//             <div className="flex-1">
//               <h4 className="font-medium text-gray-900 flex items-center">
//                 {currentRegionData.capital} Region
//                 <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
//                   {region}
//                 </span>
//               </h4>
//               <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
//                 <div className="bg-white p-2 rounded-lg">
//                   <div className="text-gray-500">Area</div>
//                   <div className="font-medium">{currentRegionData.area}</div>
//                 </div>
//                 <div className="bg-white p-2 rounded-lg">
//                   <div className="text-gray-500">Population</div>
//                   <div className="font-medium">{currentRegionData.population}</div>
//                 </div>
//                 <div className="bg-white p-2 rounded-lg">
//                   <div className="text-gray-500">Capital</div>
//                   <div className="font-medium">{currentRegionData.capital}</div>
//                 </div>
//               </div>
//               <div className="mt-3">
//                 <div className="text-gray-500 text-sm mb-1">Major Cities:</div>
//                 <div className="flex flex-wrap gap-2">
//                   {currentRegionData.cities.slice(0, 5).map(city => (
//                     <span key={city} className="bg-white px-2 py-1 rounded text-xs">
//                       {city}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       )}
//     </div>
//   );
// };
