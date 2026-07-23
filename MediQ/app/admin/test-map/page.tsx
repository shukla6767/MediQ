import GoogleMap from "@/components/maps/GoogleMap";

export default function TestMapPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Google Maps Test
      </h1>

      <GoogleMap />
    </main>
  );
}
