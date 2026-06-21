import { useLocation } from "wouter";
import { ShaderBackground } from "@/components/shader-background";
import { EventCountdownCard } from "@/components/event-countdown-card";
import { SubscribeForm } from "@/components/subscribe-form";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useEventsStore } from "@/store/events-store";
import subscribeImg from "@assets/image_1782035802415.png";

interface GikiEvent {
  id: string;
  title: string;
  date: Date;
  venue: string;
  host: string;
  attendees: number;
  image: string;
  color: string;
}

const BOOTCAMP_JOIN_URL = "https://forms.gle/qQUAV8E7CYJL3Xwg8";

const GIKI_EVENTS: GikiEvent[] = [
  {
    id: "1",
    title: "AI & Machine Learning Bootcamp",
    date: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 10 * 3600 * 1000),
    venue: "CS Block, Room 101",
    host: "GIKI CS Society",
    attendees: 84,
    image: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800&h=600&fit=crop",
    color: "blue",
  },
  {
    id: "2",
    title: "Tech Startup Pitch Night",
    date: new Date(Date.now() + 4 * 24 * 3600 * 1000 + 17 * 3600 * 1000),
    venue: "Main Auditorium",
    host: "GIKI Entrepreneurship Club",
    attendees: 120,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
    color: "purple",
  },
  {
    id: "3",
    title: "Open Source Hackathon",
    date: new Date(Date.now() + 7 * 24 * 3600 * 1000 + 9 * 3600 * 1000),
    venue: "Faculty of CS Lab",
    host: "GiKore · KrackedDevs",
    attendees: 60,
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop",
    color: "teal",
  },
  {
    id: "4",
    title: "Annual Sports Gala",
    date: new Date(Date.now() + 10 * 24 * 3600 * 1000 + 8 * 3600 * 1000),
    venue: "GIKI Sports Complex",
    host: "GIKI Sports Board",
    attendees: 300,
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop",
    color: "orange",
  },
  {
    id: "5",
    title: "Research Symposium 2026",
    date: new Date(Date.now() + 14 * 24 * 3600 * 1000 + 14 * 3600 * 1000),
    venue: "Engineering Block Hall",
    host: "GIKI Research Division",
    attendees: 150,
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop",
    color: "green",
  },
];

const COLOR_CIRCLE: Record<string, string> = {
  blue: "bg-blue-500/70 text-white",
  green: "bg-green-500/70 text-white",
  purple: "bg-purple-500/70 text-white",
  orange: "bg-orange-500/70 text-white",
  teal: "bg-teal-500/70 text-white",
  red: "bg-red-500/70 text-white",
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

export default function CampusPage() {
  const [, navigate] = useLocation();
  const [subscribing, setSubscribing] = useState(false);
  const { getApprovedForCampus } = useEventsStore();

  const approvedEvents = getApprovedForCampus("giki");

  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const handleSubscribe = async (email: string) => {
    setSubscribing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubscribing(false);
    toast({
      title: "Subscribed!",
      description: `Weekly event digests will be sent to ${email}`,
    });
  };

  const handleAddToCalendar = (event: GikiEvent) => {
    const start = event.date.toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(event.date.getTime() + 2 * 3600 * 1000)
      .toISOString()
      .replace(/-|:|\.\d+/g, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${start}/${end}&location=${encodeURIComponent(event.venue)}`;
    window.open(url, "_blank");
  };

  // Merge hardcoded + admin-approved events
  const allEvents = [...GIKI_EVENTS, ...approvedEvents];

  // Map: date-string → event color
  const eventDateMap = new Map<string, string>();
  allEvents.forEach((e) => {
    const key = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate()).toDateString();
    eventDateMap.set(key, e.color);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () =>
    setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const calDays = getMonthDays(calMonth.getFullYear(), calMonth.getMonth());
  const monthLabel = calMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ShaderBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center px-8 py-6">
          <button
            onClick={() => navigate("/explore")}
            className="text-white/70 hover:text-white transition-colors mr-4 text-sm"
          >
            ← Back
          </button>
          <span className="text-white text-2xl font-bold tracking-tight">CampusCal</span>
        </nav>

        <div className="flex-1 px-6 md:px-12 pb-20 space-y-16">
          {/* Campus header */}
          <div className="text-center space-y-2">
            <h2 className="text-white text-4xl md:text-5xl font-light">GIKI</h2>
            <p className="text-white/60 text-lg">Topi, KPK · Pakistan</p>
          </div>

          {/* ── Mini Calendar ── */}
          <section className="flex flex-col items-center gap-4">
            <h3 className="text-white/80 text-sm font-medium tracking-widest uppercase">
              Events Calendar
            </h3>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4 shadow-xl w-72">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={prevMonth}
                  className="text-white/50 hover:text-white transition-colors text-lg leading-none px-1"
                >
                  ‹
                </button>
                <span className="text-white text-sm font-medium">{monthLabel}</span>
                <button
                  onClick={nextMonth}
                  className="text-white/50 hover:text-white transition-colors text-lg leading-none px-1"
                >
                  ›
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] text-white/40 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {calDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;
                  const isToday = day.getTime() === today.getTime();
                  const color = eventDateMap.get(day.toDateString());
                  return (
                    <div
                      key={day.toDateString()}
                      className="flex items-center justify-center py-0.5"
                    >
                      <span
                        className={cn(
                          "text-xs w-7 h-7 flex items-center justify-center rounded-full transition-colors font-medium",
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : color
                            ? COLOR_CIRCLE[color] ?? "bg-white/30 text-white"
                            : "text-white/75 hover:bg-white/10 cursor-default"
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Events list ── */}
          <section className="space-y-6">
            <h3 className="text-white/80 text-sm font-medium tracking-widest uppercase text-center">
              Upcoming Events
            </h3>
            <div className="flex flex-wrap gap-6 justify-center">
              {allEvents.map((event) => (
                <EventCountdownCard
                  key={event.id}
                  title={event.title}
                  date={event.date}
                  image={event.image}
                  attendees={event.attendees}
                  venue={event.venue}
                  host={event.host}
                  joinUrl={event.id === "1" ? BOOTCAMP_JOIN_URL : undefined}
                />
              ))}
            </div>
          </section>

          {/* ── Subscribe (below events) ── */}
          <section className="flex flex-col items-center gap-4">
            <h3 className="text-white/80 text-sm font-medium tracking-widest uppercase">
              Never Miss an Event
            </h3>
            <SubscribeForm
              campusName="GIKI"
              image={subscribeImg}
              onSubscribe={handleSubscribe}
              isSubmitting={subscribing}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
