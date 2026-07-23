"use client";

import { useState, useRef, useEffect } from "react";
import { importLibrary } from "@googlemaps/js-api-loader";
import { configureGoogleMaps } from "@/lib/google";

export default function HospitalSearchInput({ onPlaceSelected }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  
  // Store Google Maps services in refs so they persist without causing re-renders
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Google Places services on mount
  useEffect(() => {
    let isMounted = true;
    
    async function initServices() {
      try {
        configureGoogleMaps();
        
        // Import required libraries
        const placesLib = (await importLibrary("places")) as google.maps.PlacesLibrary;
        const coreLib = (await importLibrary("core")) as google.maps.CoreLibrary;

        if (!isMounted) return;

        // AutocompleteService fetches dropdown predictions
        autocompleteServiceRef.current = new placesLib.AutocompleteService();
        
        // PlacesService fetches the actual latitude/longitude (requires a dummy div)
        placesServiceRef.current = new placesLib.PlacesService(document.createElement("div"));
        
        // Session tokens group autocomplete keystrokes together for billing purposes
        sessionTokenRef.current = new coreLib.AutocompletionSessionToken();
      } catch (error) {
        console.error("Failed to load Google Places API:", error);
      }
    }
    
    initServices();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch autocomplete suggestions as the user types
  useEffect(() => {
    // If the input is empty or services aren't ready, clear the dropdown
    if (!query.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }

    const fetchPredictions = () => {
      const request = {
        input: query,
        sessionToken: sessionTokenRef.current,
        types: ["hospital", "health", "clinic"], // Restrict searches to medical facilities
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        // google.maps.places.PlacesServiceStatus.OK is the success flag
        if (status === "OK" && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      });
    };

    // Debounce the API call by 300ms so we don't spam Google for every single keystroke
    const timeoutId = setTimeout(fetchPredictions, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // When a user clicks a suggestion
  const handleSelect = (placeId, description) => {
    // Update input box text and hide the dropdown
    setQuery(description);
    setSuggestions([]);

    if (!placesServiceRef.current) return;

    // Fetch the actual location details (Coordinates, Formatted Address)
    const request = {
      placeId: placeId,
      sessionToken: sessionTokenRef.current, // Pass the token to close the billing session
      fields: ["place_id", "geometry", "formatted_address", "name"],
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === "OK" && place?.geometry?.location) {
        // Send the neatly packed data back to the parent component
        onPlaceSelected({
          placeId: place.place_id,
          formattedAddress: place.formatted_address,
          name: place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Hospital (Powered by Google)"
        className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
      />

      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl border border-border bg-surface shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handleSelect(place.place_id, place.description)}
              className="block w-full px-4 py-3 text-sm text-left text-foreground hover:bg-surface-hover hover:text-primary border-b border-border/50 last:border-0 transition-colors"
            >
              {place.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}