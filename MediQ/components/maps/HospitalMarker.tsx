import { useEffect, useRef } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';

interface HospitalMarkerProps {
  map: google.maps.Map;
  hospital: {
    id: string;
    name: string;
    lat: number;
    lng: number;
  };
}

// This component has one responsibility:
// Receive Hospital --> Create Marker --> Destroy Marker
export default function HospitalMarker({ map, hospital }: HospitalMarkerProps) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMarker() {
      const { AdvancedMarkerElement } = await importLibrary("marker") as google.maps.MarkerLibrary;
      
      // Prevent updating if the component unmounted while the script was loading
      if (!isMounted) return;

      markerRef.current = new AdvancedMarkerElement({
        map,
        position: {
          lat: hospital.lat,
          lng: hospital.lng
        },
        title: hospital.name // Optional: adds a tooltip on hover
      });
    }

    initMarker();

    // Cleanup function: Destroy the marker when React unmounts this component
    return () => {
      isMounted = false;
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, [map, hospital.id, hospital.lat, hospital.lng, hospital.name]);

  // A marker handles its own rendering on the Google Canvas, so we return null for the DOM
  return null;
}