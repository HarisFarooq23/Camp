import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface ManagedEvent {
  id: string;
  campusId: string;
  title: string;
  date: Date;
  venue: string;
  host: string;
  attendees: number;
  image: string;
  color: string;
  status: "pending" | "approved" | "rejected";
  source?: "placeholder" | "instagram";
  instagramUrl?: string;
  caption?: string;
}

interface ScrapedEventPost {
  sme: string;
  account: string;
  shortcode: string;
  url: string;
  caption: string;
  score: number;
  matched_keywords: string[];
  post_date: string;
  is_video: boolean;
}

const MOCK_PENDING: ManagedEvent[] = [
  {
    id: "admin-g1",
    campusId: "giki",
    title: "Annual Debate Championship",
    date: new Date(Date.now() + 3 * 24 * 3600 * 1000 + 13 * 3600 * 1000),
    venue: "Main Auditorium",
    host: "GIKI Debate Society",
    attendees: 200,
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop",
    color: "purple",
    status: "pending",
    source: "placeholder",
  },
  {
    id: "admin-g2",
    campusId: "giki",
    title: "Photography Workshop",
    date: new Date(Date.now() + 5 * 24 * 3600 * 1000 + 11 * 3600 * 1000),
    venue: "Art & Design Block",
    host: "GIKI Photography Club",
    attendees: 40,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop",
    color: "orange",
    status: "pending",
    source: "placeholder",
  },
  {
    id: "admin-g3",
    campusId: "giki",
    title: "Cricket Tournament Finals",
    date: new Date(Date.now() + 8 * 24 * 3600 * 1000 + 15 * 3600 * 1000),
    venue: "GIKI Cricket Ground",
    host: "GIKI Sports Board",
    attendees: 500,
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=600&fit=crop",
    color: "green",
    status: "pending",
    source: "placeholder",
  },
  {
    id: "admin-kd1",
    campusId: "krackeddevs",
    title: "Web3 & Blockchain Workshop",
    date: new Date(Date.now() + 6 * 24 * 3600 * 1000 + 18 * 3600 * 1000),
    venue: "Discord Stage · Online",
    host: "KrackedDevs Core",
    attendees: 300,
    image: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&h=600&fit=crop",
    color: "teal",
    status: "pending",
    source: "placeholder",
  },
  {
    id: "admin-kd2",
    campusId: "krackeddevs",
    title: "React Native Bootcamp",
    date: new Date(Date.now() + 9 * 24 * 3600 * 1000 + 10 * 3600 * 1000),
    venue: "FAST-NUCES Lab · KL",
    host: "KrackedDevs Malaysia",
    attendees: 80,
    image: "https://images.unsplash.com/photo-1512941937938-a4bb1fa1a882?w=800&h=600&fit=crop",
    color: "blue",
    status: "pending",
    source: "placeholder",
  },
  {
    id: "admin-kd3",
    campusId: "krackeddevs",
    title: "Open Mic: Tech Edition",
    date: new Date(Date.now() + 12 * 24 * 3600 * 1000 + 20 * 3600 * 1000),
    venue: "The Grid · Co-working Space",
    host: "KrackedDevs Community",
    attendees: 60,
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=600&fit=crop",
    color: "red",
    status: "pending",
    source: "placeholder",
  },
];

const SCRAPED_COLORS = ["blue", "purple", "teal", "orange", "green", "red"] as const;

const SCRAPED_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1505373877841-8d25f39d4662?w=800&h=600&fit=crop",
];

function titleFromCaption(caption: string): string {
  const firstLine = caption.split("\n").find((line) => line.trim())?.trim() ?? "Instagram Event";
  return firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine;
}

function mapScrapedEvent(post: ScrapedEventPost, campusId: string, index: number): ManagedEvent {
  return {
    id: `ig-${post.shortcode}`,
    campusId,
    title: titleFromCaption(post.caption),
    date: new Date(post.post_date),
    venue: "See Instagram post",
    host: `@${post.account}`,
    attendees: 0,
    image: SCRAPED_IMAGES[index % SCRAPED_IMAGES.length],
    color: SCRAPED_COLORS[index % SCRAPED_COLORS.length],
    status: "pending",
    source: "instagram",
    instagramUrl: post.url,
    caption: post.caption,
  };
}

interface EventsStore {
  events: ManagedEvent[];
  fetchEvents: (campusId: string) => Promise<void>;
  approveEvent: (eventId: string) => void;
  rejectEvent: (eventId: string) => void;
  getApprovedForCampus: (campusId: string) => ManagedEvent[];
  fetched: Set<string>;
  fetchError: string | null;
}

const EventsContext = createContext<EventsStore | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [fetched, setFetched] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (campusId: string) => {
    setFetchError(null);

    setEvents((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const placeholders = MOCK_PENDING.filter(
        (e) => e.campusId === campusId && !existingIds.has(e.id),
      );
      return placeholders.length ? [...prev, ...placeholders] : prev;
    });

    try {
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/events/fetch/${campusId}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : "Instagram scraper unavailable — showing placeholder events only.";
        setFetchError(message);
      } else if (Array.isArray(data.events) && data.events.length > 0) {
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const scraped = (data.events as ScrapedEventPost[])
            .map((post, index) => mapScrapedEvent(post, campusId, index))
            .filter((e) => !existingIds.has(e.id));
          return scraped.length ? [...prev, ...scraped] : prev;
        });
      }
    } catch {
      setFetchError("Could not reach the API server — showing placeholder events only.");
    }

    setFetched((prev) => new Set([...prev, campusId]));
  }, []);

  const approveEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "approved" } : e))
    );
  }, []);

  const rejectEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "rejected" } : e))
    );
  }, []);

  const getApprovedForCampus = useCallback(
    (campusId: string) => events.filter((e) => e.campusId === campusId && e.status === "approved"),
    [events]
  );

  return (
    <EventsContext.Provider
      value={{ events, fetchEvents, approveEvent, rejectEvent, getApprovedForCampus, fetched, fetchError }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEventsStore() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEventsStore must be used inside EventsProvider");
  return ctx;
}
