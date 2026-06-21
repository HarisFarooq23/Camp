import { useLocation } from "wouter";
import { ShaderBackground } from "@/components/shader-background";
import { LocationCard } from "@/components/location-card";
import { SuggestiveSearch } from "@/components/suggestive-search";
import { useState } from "react";
import kdLogoImg from "@assets/image_1782035976512.png";

const campuses = [
  {
    id: "giki",
    location: "GIKI",
    country: "Topi, KPK · Pakistan",
    imageUrl: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=600&q=80",
    locked: false,
    href: "/campus/giki",
  },
  {
    id: "krackeddevs",
    location: "KrackedDevs",
    country: "Tech Community · Pakistan",
    imageUrl: kdLogoImg,
    locked: true,
  },
  {
    id: "nust",
    location: "NUST",
    country: "Islamabad · Pakistan",
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80",
    locked: true,
  },
  {
    id: "lums",
    location: "LUMS",
    country: "Lahore · Pakistan",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80",
    locked: true,
  },
  {
    id: "iba",
    location: "IBA Karachi",
    country: "Karachi · Pakistan",
    imageUrl: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600&q=80",
    locked: true,
  },
];

export default function ExplorePage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  const filtered = campuses.filter(
    (c) =>
      c.location.toLowerCase().includes(query.toLowerCase()) ||
      c.country.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ShaderBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center px-8 py-6">
          <button
            onClick={() => navigate("/")}
            className="text-white/70 hover:text-white transition-colors mr-4 text-sm"
          >
            ← Back
          </button>
          <span className="text-white text-2xl font-bold tracking-tight">
            CampusCal
          </span>
        </nav>

        {/* Content */}
        <div className="flex-1 px-8 pb-16">
          <div className="max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <div className="text-center space-y-3">
              <h2 className="text-white text-4xl md:text-5xl font-light">
                Choose your Campus
              </h2>
              <p className="text-white/60 text-lg">
                Select a campus, company, or office to view its events.
              </p>
            </div>

            {/* Search */}
            <div className="flex justify-center">
              <SuggestiveSearch
                onChange={setQuery}
                suggestions={[
                  "Search GIKI...",
                  "Find your campus...",
                  "Search KrackedDevs...",
                  "Find upcoming events...",
                ]}
                className="w-full max-w-md text-white border-white/20"
                effect="typewriter"
              />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {filtered.map((campus) => (
                <LocationCard
                  key={campus.id}
                  location={campus.location}
                  country={campus.country}
                  imageUrl={campus.imageUrl}
                  locked={campus.locked}
                  onClick={
                    !campus.locked
                      ? () => navigate(`/campus/${campus.id}`)
                      : undefined
                  }
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-3 text-center text-white/50 py-16 text-lg">
                  No campuses found for "{query}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
