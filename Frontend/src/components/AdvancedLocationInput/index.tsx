// Advanced Location Input with autocomplete and real-time search
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiMapPin, FiNavigation, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { advancedLocationService, type LocationCoordinates, type PlacePrediction } from '../../services/advancedLocationService';
import { AdvancedMap } from '../AdvancedMap';
import toast from 'react-hot-toast';

interface AdvancedLocationInputProps {
  value?: {
    coordinates: LocationCoordinates;
    address: string;
    placeId?: string;
  };
  onChange?: (location: {
    coordinates: LocationCoordinates;
    address: string;
    placeId?: string;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  showMap?: boolean;
  autoComplete?: boolean;
  className?: string;
  label?: string;
  error?: string;
  bias?: LocationCoordinates;
}

export const AdvancedLocationInput: React.FC<AdvancedLocationInputProps> = ({
  value,
  onChange,
  placeholder = "Search for your address...",
  disabled = false,
  required = false,
  showMap = true,
  autoComplete = true,
  className = "",
  label,
  error,
  bias,
}) => {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(
    value?.coordinates || null
  );
  
  const inputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search for predictions
  const searchPredictions = useCallback(async (query: string) => {
    if (!autoComplete || query.length < 2 || disabled) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    try {
      const userLocation = advancedLocationService.getLastKnownLocation();
      const results = await advancedLocationService.getPlacePredictions(
        query,
        bias || userLocation || undefined
      );
      setPredictions(results);
      setShowPredictions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.warn('Location search failed:', error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoading(false);
    }
  }, [autoComplete, disabled, bias]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPredictions(query);
    }, 300);
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction: PlacePrediction) => {
    setInputValue(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
    
    try {
      let coordinates = prediction.coordinates;
      
      // If coordinates not available, get from place details
      if (!coordinates) {
        // This would require place details API call
        coordinates = await getPlaceCoordinates(prediction.placeId);
      }

      if (coordinates) {
        setCurrentLocation(coordinates);
        onChange?.({
          coordinates,
          address: prediction.description,
          placeId: prediction.placeId,
        });
      }
    } catch (error) {
      console.warn('Failed to get place coordinates:', error);
      toast.error('Failed to get location details');
    }
  };

  // Get current GPS location
  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading('Getting your location...');
    
    try {
      const location = await advancedLocationService.getCurrentPreciseLocation();
      const address = await advancedLocationService.reverseGeocode(location.lat, location.lng);
      
      setCurrentLocation(location);
      setInputValue(address.formattedAddress);
      
      onChange?.({
        coordinates: location,
        address: address.formattedAddress,
        placeId: address.placeId,
      });
      
      toast.success('Location found!', { id: loadingToast });
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Unable to get your location. Please check permissions.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    const location = { lat, lng };
    setCurrentLocation(location);
    
    try {
      const address = await advancedLocationService.reverseGeocode(lat, lng);
      setInputValue(address.formattedAddress);
      
      onChange?.({
        coordinates: location,
        address: address.formattedAddress,
        placeId: address.placeId,
      });
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      setInputValue(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      
      onChange?.({
        coordinates: location,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    }
  };

  // Clear selection
  const handleClear = () => {
    setInputValue('');
    setCurrentLocation(null);
    setPredictions([]);
    setShowPredictions(false);
    onChange?.(undefined as any);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showPredictions || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : predictions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handlePredictionSelect(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowPredictions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const inputClasses = `
    w-full px-4 py-3 pl-12 pr-20 rounded-xl border
    ${error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
    }
    ${disabled
      ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
      : 'bg-white dark:bg-gray-800'
    }
    text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
    focus:ring-2 focus:outline-none transition-all duration-200
    ${className}
  `;

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />

        {/* Action Buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              disabled={disabled}
            >
              <FiX className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={disabled || isLoading}
            className="p-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors disabled:opacity-50"
            title="Use my location"
          >
            <FiNavigation className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-16 flex items-center pr-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Predictions Dropdown */}
        <AnimatePresence>
          {showPredictions && predictions.length > 0 && (
            <motion.div
              ref={predictionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50"
            >
              {predictions.map((prediction, index) => (
                <button
                  key={prediction.placeId}
                  type="button"
                  onClick={() => handlePredictionSelect(prediction)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900' : ''
                  } ${index === 0 ? 'rounded-t-xl' : ''} ${
                    index === predictions.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <FiMapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {prediction.structuredFormatting.mainText}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {prediction.structuredFormatting.secondaryText}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Success Message */}
      {currentLocation && (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <FiCheck className="h-4 w-4" />
          <span className="text-sm">
            Location selected • {currentLocation.accuracy ? `±${Math.round(currentLocation.accuracy)}m accuracy` : 'High accuracy'}
          </span>
        </div>
      )}

      {/* Advanced Interactive Map */}
      {showMap && (
        <div className="h-96 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
          <AdvancedMap
            center={currentLocation || { lat: 7.9465, lng: -1.0232 }}
            zoom={currentLocation ? 15 : 7}
            onClick={handleMapClick}
            markers={currentLocation ? [{ 
              position: currentLocation, 
              type: 'user',
              title: 'Selected Location',
              description: inputValue || 'Your selected location'
            }] : []}
            showControls={true}
            showUserLocation={true}
            enableLocationTracking={true}
          />
        </div>
      )}
    </div>
  );
};

// Helper function to get place coordinates (would need Google Places Details API)
async function getPlaceCoordinates(placeId: string): Promise<LocationCoordinates | null> {
  // This would make a call to Google Places Details API
  // For now, return null and let the component handle it
  console.warn('Place details API not implemented yet');
  return null;
}

export default AdvancedLocationInput;