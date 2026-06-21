import { useState } from "react";
import { useLocation } from "wouter";
import { WebGLShader } from "@/components/webgl-shader";
import { useEventsStore, ManagedEvent } from "@/store/events-store";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, XCircle, RefreshCw, CalendarDays, Users, MapPin, Clock } from "lucide-react";

const SMES = [
  { id: "giki", name: "GIKI", subtitle: "Topi, KPK · Pakistan", color: "from-teal-500/20 to-emerald-500/10 border-teal-400/30" },
  { id: "krackeddevs", name: "KrackedDevs", subtitle: "Tech Community · Pakistan", color: "from-green-500/20 to-lime-500/10 border-green-400/30" },
];

const STATUS_BADGE: Record<ManagedEvent["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  approved: "bg-green-500/20 text-green-300 border-green-400/30",
  rejected: "bg-red-500/20 text-red-300 border-red-400/30",
};

function EventRow({ event, onApprove, onReject }: {
  event: ManagedEvent;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <img
        src={event.image}
        alt={event.title}
        className="h-16 w-24 rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-white text-sm leading-snug">{event.title}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {event.source === "instagram" && (
              <span className="text-[10px] font-medium border rounded-full px-2 py-0.5 bg-pink-500/20 text-pink-300 border-pink-400/30">
                Instagram
              </span>
            )}
            <span className={cn("text-[10px] font-medium border rounded-full px-2 py-0.5 capitalize", STATUS_BADGE[event.status])}>
              {event.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/50">
          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{event.date.toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.attendees} attending</span>
        </div>
        <p className="text-xs text-white/40">Hosted by {event.host}</p>
        {event.instagramUrl && (
          <a
            href={event.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-pink-300/80 hover:text-pink-200 underline"
          >
            View on Instagram
          </a>
        )}
      </div>
      {event.status === "pending" && (
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/40 border border-green-400/30 px-3 py-1.5 text-xs font-medium text-green-300 transition-colors"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function SmePanel({ sme }: { sme: typeof SMES[0] }) {
  const { events, fetchEvents, approveEvent, rejectEvent, fetched } = useEventsStore();
  const [loading, setLoading] = useState(false);

  const isFetched = fetched.has(sme.id);
  const smeEvents = events.filter((e) => e.campusId === sme.id);
  const pending = smeEvents.filter((e) => e.status === "pending").length;
  const approved = smeEvents.filter((e) => e.status === "approved").length;

  const handleFetch = async () => {
    setLoading(true);
    await fetchEvents(sme.id);
    setLoading(false);
  };

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-6 space-y-4", sme.color)}>
      {/* SME header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white text-xl font-bold">{sme.name}</h3>
          <p className="text-white/50 text-sm">{sme.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetched && (
            <div className="flex gap-2 text-xs">
              <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 rounded-full px-2 py-0.5">{pending} pending</span>
              <span className="bg-green-500/20 text-green-300 border border-green-400/30 rounded-full px-2 py-0.5">{approved} approved</span>
            </div>
          )}
          <button
            onClick={handleFetch}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isFetched ? "Re-fetch" : "Fetch Events"}
          </button>
        </div>
      </div>

      {/* Event list */}
      {isFetched && smeEvents.length > 0 && (
        <div className="space-y-3">
          {smeEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onApprove={() => approveEvent(event.id)}
              onReject={() => rejectEvent(event.id)}
            />
          ))}
        </div>
      )}

      {isFetched && smeEvents.length === 0 && (
        <p className="text-white/40 text-sm text-center py-4">No pending events for {sme.name}.</p>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { fetchError } = useEventsStore();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <WebGLShader />

      {/* Dark overlay so content is readable over the neon shader */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[1px]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/explore")}
              className="text-white/60 hover:text-white transition-colors text-sm"
            >
              ← Back
            </button>
            <span className="text-white text-2xl font-bold tracking-tight">CampusCal</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-sm font-medium">Admin Portal</span>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 px-6 md:px-12 py-10 space-y-6 max-w-4xl mx-auto w-full">
          <div className="space-y-1">
            <h2 className="text-white text-3xl font-bold">Event Requests</h2>
            <p className="text-white/50">Fetch submitted events from each SME and approve them to make them live.</p>
            {fetchError && (
              <p className="text-amber-300/90 text-sm rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                {fetchError}
              </p>
            )}
          </div>

          {SMES.map((sme) => (
            <SmePanel key={sme.id} sme={sme} />
          ))}
        </div>
      </div>
    </main>
  );
}
