"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  ETHIOPIA_REGION_ZONE_CAPITALS,
  buildLocationLabel,
} from "@/lib/location/ethiopia-zones";

export default function ZoneCityPromptModal({
  isOpen,
  userId,
  onSaved,
  onClose,
}) {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedCapitalCity, setSelectedCapitalCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const regionOptions = useMemo(
    () => ETHIOPIA_REGION_ZONE_CAPITALS.map((entry) => entry.region),
    [],
  );

  const zoneOptions = useMemo(() => {
    const regionMatch = ETHIOPIA_REGION_ZONE_CAPITALS.find(
      (entry) => entry.region === selectedRegion,
    );
    return regionMatch?.zones || [];
  }, [selectedRegion]);

  const capitalCityOptions = useMemo(() => {
    const zoneMatch = zoneOptions.find((entry) => entry.zone === selectedZone);
    return zoneMatch?.capitalCity ? [zoneMatch.capitalCity] : [];
  }, [zoneOptions, selectedZone]);

  if (!isOpen) return null;

  const handleRegionChange = (event) => {
    setSelectedRegion(event.target.value);
    setSelectedZone("");
    setSelectedCapitalCity("");
    setError("");
  };

  const handleZoneChange = (event) => {
    setSelectedZone(event.target.value);
    const zoneMatch = zoneOptions.find(
      (entry) => entry.zone === event.target.value,
    );
    setSelectedCapitalCity(zoneMatch?.capitalCity || "");
    setError("");
  };

  const handleCapitalCityChange = (event) => {
    setSelectedCapitalCity(event.target.value);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId) {
      setError("You need to be signed in to save your location.");
      return;
    }

    if (!selectedRegion || !selectedZone || !selectedCapitalCity) {
      setError("Please choose your region, zone, and zone capital city.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const location = buildLocationLabel(
        selectedCapitalCity,
        selectedZone,
        selectedRegion,
      );

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          location,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      onSaved?.({
        region: selectedRegion,
        zone: selectedZone,
        city: selectedCapitalCity,
        capitalCity: selectedCapitalCity,
        location,
      });
    } catch (saveError) {
      setError(saveError?.message || "Unable to save location right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zone-city-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2
          id="zone-city-modal-title"
          className="text-xl font-bold text-[#1F1F1F]"
        >
          Add Your Region, Zone, And Capital City
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          We can localize your job experience better when your address is set.
          For now, you still see all jobs by default.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="region-select"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Region
            </label>
            <select
              id="region-select"
              value={selectedRegion}
              onChange={handleRegionChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/30"
              required
            >
              <option value="">Select your region</option>
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="zone-select"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Zone
            </label>
            <select
              id="zone-select"
              value={selectedZone}
              onChange={handleZoneChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/30"
              required
              disabled={!selectedRegion}
            >
              <option value="">Select your zone</option>
              {zoneOptions.map((entry) => (
                <option key={entry.zone} value={entry.zone}>
                  {entry.zone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="city-select"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Capital City (of selected zone)
            </label>
            <select
              id="city-select"
              value={selectedCapitalCity}
              onChange={handleCapitalCityChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/30"
              required
              disabled={!selectedZone}
            >
              <option value="">Select capital city</option>
              {capitalCityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#FF1E00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E01B00] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
