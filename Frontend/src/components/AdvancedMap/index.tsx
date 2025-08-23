// Advanced Map Component with enhanced controls and multiple tile layers
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FiMap, FiCamera, FiLayers, FiSettings, FiNavigation, FiZoomIn, FiZoomOut, FiHome, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { advancedLocationService, type LocationCoordinates } from '../../services/advancedLocationService';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Enhanced marker icons for different types
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const UserLocationIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="12" cy="12" r="6" fill="#FFFFFF"/>
      <circle cx="12" cy="12" r="3" fill="#3B82F6"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const RegionCapitalIcon = L.icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444" width="32" height="32">
      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#EF4444" stroke="#FFFFFF" stroke-width="1"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Map layer configurations with enhanced Mapbox integration
const MAP_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapboxStyle: 'mapbox://styles/mapbox/streets-v12',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    icon: FiMap,
    name: 'Street View',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    mapboxStyle: 'mapbox://styles/mapbox/satellite-v9',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    icon: FiCamera,
    name: 'Satellite',
  },
  hybrid: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    mapboxStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
    attribution: '&copy; Google',
    icon: FiLayers,
    name: 'Hybrid',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    mapboxStyle: 'mapbox://styles/mapbox/dark-v11',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    icon: FiSettings,
    name: 'Dark Mode',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    mapboxStyle: 'mapbox://styles/mapbox/outdoors-v12',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    icon: FiSettings,
    name: 'Terrain',
  },
  navigation: {
    url: `https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/512/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`,
    mapboxStyle: 'mapbox://styles/mapbox/navigation-day-v1',
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    icon: FiNavigation,
    name: 'Navigation',
  },
};

interface MarkerData {
  position: LocationCoordinates;
  type?: 'default' | 'user' | 'capital' | 'landmark';
  title?: string;
  description?: string;
  accuracy?: number;
}

interface AdvancedMapProps {
  center: LocationCoordinates;
  zoom: number;
  onClick?: (lat: number, lng: number) => void;
  markers?: MarkerData[];
  showControls?: boolean;
  showUserLocation?: boolean;
  enableLocationTracking?: boolean;
  accuracyCircle?: boolean;
  onLocationFound?: (position: LocationCoordinates & { accuracy: number }) => void;
  onLocationError?: (error: string) => void;
  className?: string;
  height?: string;
  isDark?: boolean;
  initialLayer?: keyof typeof MAP_LAYERS;
  enableTerrainControl?: boolean;
  enableNavigationMode?: boolean;
  showLayerInfo?: boolean;
  enableFullscreen?: boolean;
  onLayerChange?: (layer: keyof typeof MAP_LAYERS) => void;
}

// Map click handler component
const MapClickHandler: React.FC<{ onClick?: (lat: number, lng: number) => void }> = ({ onClick }) => {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Location handler for GPS tracking
const LocationHandler: React.FC<{
  onLocationFound?: (position: LocationCoordinates & { accuracy: number }) => void;
  onLocationError?: (error: string) => void;
}> = ({ onLocationFound, onLocationError }) => {
  const map = useMap();

  useMapEvents({
    locationfound: (e) => {
      if (onLocationFound) {
        onLocationFound({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          accuracy: e.accuracy,
        });
      }
      toast.success('Location found successfully!');
    },
    locationerror: (e) => {
      const errorMessage = `Location error: ${e.message}`;
      console.warn(errorMessage);
      if (onLocationError) {
        onLocationError(errorMessage);
      }
      toast.error('Unable to get your location. Please check permissions.');
    },
  });

  return null;
};

// Map controls component
const MapControls: React.FC<{
  onLocate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isLocating?: boolean;
  isDark?: boolean;
}> = ({ onLocate, onZoomIn, onZoomOut, onResetView, isLocating = false, isDark = false }) => {
  const baseClasses = `p-3 rounded-lg shadow-lg transition-all duration-200 border backdrop-blur-sm ${
    isDark 
      ? 'bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-gray-200' 
      : 'bg-white/90 hover:bg-gray-50 border-gray-300 text-gray-700'
  }`;

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onLocate}
        disabled={isLocating}
        className={`${baseClasses} ${isLocating ? 'opacity-75 cursor-not-allowed' : ''}`}
        title={isLocating ? 'Getting location...' : 'Find my location'}
      >
        {isLocating ? (
          <FiLoader className="w-5 h-5 animate-spin" />
        ) : (
          <FiNavigation className="w-5 h-5" />
        )}
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onZoomIn}
        className={baseClasses}
        title="Zoom in"
      >
        <FiZoomIn className="w-5 h-5" />
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onZoomOut}
        className={baseClasses}
        title="Zoom out"
      >
        <FiZoomOut className="w-5 h-5" />
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onResetView}
        className={baseClasses}
        title="Reset view"
      >
        <FiHome className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

// Enhanced layer selector component with detailed info
const LayerSelector: React.FC<{
  currentLayer: keyof typeof MAP_LAYERS;
  onLayerChange: (layer: keyof typeof MAP_LAYERS) => void;
  isDark?: boolean;
  showLayerInfo?: boolean;
}> = ({ currentLayer, onLayerChange, isDark = false, showLayerInfo = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredLayer, setHoveredLayer] = useState<keyof typeof MAP_LAYERS | null>(null);

  const handleLayerChange = (layer: keyof typeof MAP_LAYERS) => {
    onLayerChange(layer);
    setIsOpen(false);
    toast.success(`Switched to ${MAP_LAYERS[layer].name}`, {
      duration: 2000,
      icon: React.createElement(MAP_LAYERS[layer].icon, { className: "w-4 h-4" }),
    });
  };

  return (
    <div className="absolute top-4 left-4 z-[1000]">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-lg shadow-lg transition-all duration-200 border backdrop-blur-sm relative ${
          isDark 
            ? 'bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-gray-200' 
            : 'bg-white/90 hover:bg-gray-50 border-gray-300 text-gray-700'
        }`}
        title={`Current: ${MAP_LAYERS[currentLayer].name}`}
      >
        {React.createElement(MAP_LAYERS[currentLayer].icon, { className: "w-5 h-5" })}
        
        {/* Active layer indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
      </motion.button>

      {/* Current layer info tooltip */}
      {showLayerInfo && !isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`absolute left-full top-0 ml-3 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap backdrop-blur-sm ${
            isDark 
              ? 'bg-gray-800/90 text-gray-200 border border-gray-600' 
              : 'bg-white/90 text-gray-700 border border-gray-300'
          }`}
        >
          {MAP_LAYERS[currentLayer].name}
        </motion.div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute top-full left-0 mt-2 rounded-xl shadow-xl border backdrop-blur-sm overflow-hidden min-w-[240px] ${
              isDark 
                ? 'bg-gray-800/95 border-gray-600' 
                : 'bg-white/95 border-gray-300'
            }`}
          >
            {/* Header */}
            <div className={`px-4 py-3 border-b ${
              isDark ? 'border-gray-600 bg-gray-750/50' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FiLayers className="w-4 h-4" />
                Map Layers
              </h3>
            </div>

            {/* Layer options */}
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(MAP_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => handleLayerChange(key as keyof typeof MAP_LAYERS)}
                  onMouseEnter={() => setHoveredLayer(key as keyof typeof MAP_LAYERS)}
                  onMouseLeave={() => setHoveredLayer(null)}
                  className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center justify-between group ${
                    currentLayer === key
                      ? isDark
                        ? 'bg-indigo-900/70 text-indigo-200 border-r-2 border-indigo-400'
                        : 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500'
                      : isDark
                      ? 'hover:bg-gray-700/50 text-gray-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {React.createElement(layer.icon, { 
                      className: `w-5 h-5 transition-colors ${
                        currentLayer === key || hoveredLayer === key 
                          ? 'text-indigo-500' 
                          : isDark ? 'text-gray-400' : 'text-gray-500'
                      }` 
                    })}
                    <div>
                      <div className="text-sm font-medium">{layer.name}</div>
                      {showLayerInfo && (
                        <div className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {key === 'street' && 'Detailed street-level maps'}
                          {key === 'satellite' && 'High-resolution satellite imagery'}
                          {key === 'hybrid' && 'Satellite with street labels'}
                          {key === 'dark' && 'Dark theme for night use'}
                          {key === 'terrain' && 'Topographic terrain data'}
                          {key === 'navigation' && 'Navigation-optimized view'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Current layer indicator */}
                  {currentLayer === key && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs font-medium opacity-75">Active</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Footer with shortcuts */}
            <div className={`px-4 py-2 border-t text-xs ${
              isDark 
                ? 'border-gray-600 text-gray-400 bg-gray-750/50' 
                : 'border-gray-200 text-gray-500 bg-gray-50/50'
            }`}>
              💡 Tip: Switch layers based on your needs
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdvancedMap: React.FC<AdvancedMapProps> = ({
  center,
  zoom,
  onClick,
  markers = [],
  showControls = true,
  showUserLocation = true,
  enableLocationTracking = false,
  accuracyCircle = true,
  onLocationFound,
  onLocationError,
  className = "",
  height = "100%",
  isDark = false,
  initialLayer,
  enableTerrainControl = false,
  enableNavigationMode = false,
  showLayerInfo = true,
  enableFullscreen = false,
  onLayerChange,
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates & { accuracy: number } | null>(null);
  const [currentLayer, setCurrentLayer] = useState<keyof typeof MAP_LAYERS>(
    initialLayer || (isDark ? 'dark' : 'street')
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const mapRef = useRef<L.Map | null>(null);

  // Set default marker icon
  useEffect(() => {
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  // Update layer based on theme
  useEffect(() => {
    if (isDark && currentLayer === 'street') {
      setCurrentLayer('dark');
    } else if (!isDark && currentLayer === 'dark') {
      setCurrentLayer('street');
    }
  }, [isDark, currentLayer]);

  // Handle location found
  const handleLocationFound = useCallback((position: LocationCoordinates & { accuracy: number }) => {
    setCurrentLocation(position);
    setIsLocating(false);
    setLocationError(null);
    setIsTracking(true);
    
    if (onLocationFound) {
      onLocationFound(position);
    }

    // Pan map to user location
    if (map) {
      map.setView([position.lat, position.lng], Math.max(zoom, 15));
    }
  }, [map, zoom, onLocationFound]);

  // Handle location error
  const handleLocationError = useCallback((error: string) => {
    setIsLocating(false);
    setLocationError(error);
    setIsTracking(false);
    
    if (onLocationError) {
      onLocationError(error);
    }
  }, [onLocationError]);

  // Get current location
  const handleLocate = useCallback(async () => {
    if (isLocating) return;
    
    setIsLocating(true);
    setLocationError(null);
    
    try {
      if (enableLocationTracking) {
        await advancedLocationService.startLocationTracking();
        
        // Subscribe to location updates
        const unsubscribe = advancedLocationService.subscribeToLocationUpdates((location) => {
          handleLocationFound({ ...location, accuracy: location.accuracy || 10 });
        });

        // Store unsubscribe function for cleanup
        return unsubscribe;
      } else {
        // One-time location request
        if (map) {
          map.locate({ 
            setView: true, 
            maxZoom: Math.max(zoom, 16), 
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
          });
        } else {
          // Fallback to advanced location service
          const location = await advancedLocationService.getCurrentPreciseLocation();
          handleLocationFound({ ...location, accuracy: location.accuracy || 10 });
        }
      }
    } catch (error) {
      handleLocationError(error instanceof Error ? error.message : 'Location request failed');
    }
  }, [map, isLocating, enableLocationTracking, zoom, handleLocationFound, handleLocationError]);

  // Map control handlers
  const handleZoomIn = useCallback(() => {
    if (map) {
      map.zoomIn();
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      map.zoomOut();
    }
  }, [map]);

  const handleResetView = useCallback(() => {
    if (map) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [map, center, zoom]);

  // Get appropriate marker icon
  const getMarkerIcon = useCallback((type: string = 'default') => {
    switch (type) {
      case 'user':
        return UserLocationIcon;
      case 'capital':
        return RegionCapitalIcon;
      default:
        return DefaultIcon;
    }
  }, []);

  // Handle layer change with callback
  const handleLayerChange = useCallback((layer: keyof typeof MAP_LAYERS) => {
    setCurrentLayer(layer);
    if (onLayerChange) {
      onLayerChange(layer);
    }
  }, [onLayerChange]);

  // Current layer configuration
  const layerConfig = useMemo(() => MAP_LAYERS[currentLayer], [currentLayer]);

  // Cleanup location tracking on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        advancedLocationService.stopLocationTracking();
      }
    };
  }, [isTracking]);

  return (
    <div className={`relative ${className}`} style={{ height, width: "100%" }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        whenCreated={(mapInstance) => {
          setMap(mapInstance);
          mapRef.current = mapInstance;
        }}
        className={`z-0 ${isDark ? 'dark-theme-map' : 'light-theme-map'}`}
      >
        <TileLayer
          url={layerConfig.url}
          attribution={layerConfig.attribution}
          key={currentLayer} // Force re-render when layer changes
        />
        
        <MapClickHandler onClick={onClick} />
        <LocationHandler 
          onLocationFound={handleLocationFound} 
          onLocationError={handleLocationError}
        />
        
        {/* User location marker with accuracy circle */}
        {currentLocation && showUserLocation && (
          <>
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={UserLocationIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="font-medium text-blue-900 mb-2">Your Location</div>
                  <div className="text-sm text-gray-600 font-mono mb-1">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Accuracy: ±{Math.round(currentLocation.accuracy)}m
                  </div>
                  {isTracking && (
                    <div className="text-xs text-green-600 font-medium">
                      🔴 Live tracking active
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {accuracyCircle && (
              <Circle
                center={[currentLocation.lat, currentLocation.lng]}
                radius={currentLocation.accuracy}
                pathOptions={{
                  fillColor: '#3B82F6',
                  fillOpacity: 0.1,
                  color: '#3B82F6',
                  weight: 1,
                  opacity: 0.3,
                }}
              />
            )}
          </>
        )}
        
        {/* Other markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.position.lat, marker.position.lng]}
            icon={getMarkerIcon(marker.type)}
          >
            {(marker.title || marker.description) && (
              <Popup>
                <div className="p-2 min-w-[200px]">
                  {marker.title && (
                    <div className="font-medium text-gray-900 mb-1">{marker.title}</div>
                  )}
                  {marker.description && (
                    <div className="text-sm text-gray-600 mb-2">{marker.description}</div>
                  )}
                  <div className="text-xs text-gray-500 font-mono">
                    {marker.position.lat.toFixed(6)}, {marker.position.lng.toFixed(6)}
                  </div>
                  {marker.accuracy && (
                    <div className="text-xs text-gray-500 mt-1">
                      Accuracy: ±{Math.round(marker.accuracy)}m
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
      
      {/* Custom controls */}
      {showControls && (
        <>
          <MapControls
            onLocate={handleLocate}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            isLocating={isLocating}
            isDark={isDark}
          />
          
          <LayerSelector
            currentLayer={currentLayer}
            onLayerChange={handleLayerChange}
            isDark={isDark}
            showLayerInfo={showLayerInfo}
          />
        </>
      )}
      
      {/* Location error display */}
      {locationError && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-20 left-4 z-[1000] max-w-sm"
        >
          <div className={`p-3 rounded-lg shadow-lg border-l-4 border-red-500 backdrop-blur-sm ${
            isDark ? 'bg-gray-800/90 text-gray-200' : 'bg-white/90 text-gray-900'
          }`}>
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium">Location Error</span>
            </div>
            <p className="text-xs mt-1 opacity-90">{locationError}</p>
          </div>
        </motion.div>
      )}
      
      {/* Coordinates display */}
      <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-lg shadow-sm text-sm font-mono z-[1000] backdrop-blur-sm ${
        isDark 
          ? 'bg-gray-800/90 text-gray-200'
          : 'bg-white/90 text-gray-900'
      }`}>
        {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
      </div>
      
      {/* Enhanced Status Panel */}
      <div className={`absolute bottom-4 right-4 px-3 py-2 rounded-lg text-xs z-[1000] backdrop-blur-sm border ${
        isDark 
          ? 'bg-gray-800/90 text-gray-300 border-gray-600'
          : 'bg-white/90 text-gray-700 border-gray-300'
      }`}>
        <div className="flex items-center space-x-2">
          {isTracking && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
              <span className="font-medium">Live</span>
            </div>
          )}
          <span>•</span>
          <span>{MAP_LAYERS[currentLayer].name}</span>
          <span>•</span>
          <span>Z{zoom}</span>
          {currentLocation && (
            <>
              <span>•</span>
              <span className="text-blue-500">GPS</span>
            </>
          )}
        </div>
        
        {/* Additional info on hover */}
        {showLayerInfo && (
          <div className="mt-1 text-xs opacity-75">
            {advancedLocationService.getServiceStatus().provider}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedMap;