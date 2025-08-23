import React from 'react';
import { AdvancedMap } from '../../../../components/AdvancedMap';
import type { LocationCoordinates } from '../../../../services/advancedLocationService';

interface GhanaMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  onClick: (lat: number, lng: number) => void;
  markers: { position: { lat: number; lng: number } }[];
  className?: string;
  showControls?: boolean;
  showUserLocation?: boolean;
  enableLocationTracking?: boolean;
}

export const GhanaMap = ({ 
  center, 
  zoom, 
  onClick, 
  markers,
  className = "",
  showControls = false,
  showUserLocation = false,
  enableLocationTracking = false
}: GhanaMapProps) => {
  // Convert markers to EnterpriseMap format
  const enterpriseMarkers = markers.map((marker, index) => ({
    position: marker.position as LocationCoordinates,
    type: 'default' as const,
    title: `Location ${index + 1}`,
    description: `${marker.position.lat.toFixed(4)}, ${marker.position.lng.toFixed(4)}`
  }));

  return (
    <div className={`w-full h-full ${className}`}>
      <AdvancedMap
        center={center as LocationCoordinates}
        zoom={zoom}
        onClick={onClick}
        markers={enterpriseMarkers}
        showControls={showControls}
        showUserLocation={showUserLocation}
        enableLocationTracking={enableLocationTracking}
        initialLayer="street"
        showLayerInfo={false}
        isDark={false}
        height="100%"
      />
    </div>
  );
};
