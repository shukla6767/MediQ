import { setOptions } from "@googlemaps/js-api-loader";

export function configureGoogleMaps() {
  setOptions({
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "DEMO_KEY",
    version: "weekly",
    libraries: ["places"]
  });
}
