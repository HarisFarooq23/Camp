import { useLocation } from "wouter";
import { ShaderBackground } from "@/components/shader-background";

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ShaderBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center px-8 py-6">
          <span className="text-white text-2xl font-bold tracking-tight">
            CampusCal
          </span>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex items-center justify-center px-8 pb-16">
          <div className="max-w-4xl w-full text-center space-y-8">
            <div className="space-y-5">
              <h1 className="text-white text-5xl md:text-7xl font-sans font-light text-balance leading-tight">
                Your Campus.
                <br />
                Your Calendar.
              </h1>
              <p className="text-white/80 text-xl md:text-2xl font-sans font-light leading-relaxed max-w-2xl mx-auto">
                Stay on top of every event at your campus, company, or office —
                all in one place. Subscribe and never miss what matters.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button
                onClick={() => navigate("/explore")}
                className="px-8 py-4 bg-white rounded-full text-gray-900 font-semibold hover:scale-105 transition-transform duration-300 shadow-lg min-w-[200px]"
              >
                Continue
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-8 py-4 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full text-white font-semibold hover:bg-white/25 transition-all duration-300 hover:scale-105 min-w-[200px]"
              >
                Register your SME
              </button>
            </div>

            <p className="text-white/50 text-sm pt-2">
              Campuses · Companies · Offices
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
