"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary } from "@googlemaps/js-api-loader";
import { configureGoogleMaps } from "@/lib/google";
import HospitalMarker from "./HospitalMarker";

const hospitals = [
  {
    id: "1",
    name: "AIIMS",
    lat: 28.5672,
    lng: 77.2100
  }
];

export default function GoogleMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    async function initializeMap() {
      if (!mapContainerRef.current) return;
      if (mapRef.current) return; // Prevent double initialization in React Strict Mode

      try {
        // 1. Configure the options via the new functional API
        configureGoogleMaps();

        // 2. Import the maps library directly using the new API
        const { Map } = await importLibrary("maps") as google.maps.MapsLibrary;

        const map = new Map(mapContainerRef.current, {
          center: {
            lat: 28.6139,
            lng: 77.2090
          },
          zoom: 12,
          mapId: "DEMO_MAP_ID" // REQUIRED for AdvancedMarkerElement to work!
        });

        mapRef.current = map;
        setMapReady(true); // Tell React to re-render so markers can be drawn!
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    }

    initializeMap();

    return () => {
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full">
      <div
        ref={mapContainerRef}
        className="w-full h-[600px] rounded-xl"
      />
      
      {/* We only map through hospitals once the Google Map instance is actually created */}
      {mapReady && mapRef.current && hospitals.map(hospital => (
        <HospitalMarker
          key={hospital.id}
          map={mapRef.current!}
          hospital={hospital}
        />
      ))}
    </div>
  );
}
