import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  color: string;
}

interface MiniCalendarProps {
  events?: CalendarEvent[];
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
  teal: "bg-teal-500",
};

export function MiniCalendar({ events = [], className }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = (dir: "prev" | "next") => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + (dir === "next" ? 1 : -1));
      return d;
    });
  };

  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days: Date[] = [];
  const cursor = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const getEventsForDay = (date: Date) =>
    events.filter((e) => {
      const d = new Date(e.startTime);
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });

  const today = new Date().toDateString();

  return (
    <Card className={cn("overflow-hidden w-full max-w-sm", className)}>
      {/* Month nav — only prev/next + label */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">
          {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="p-1.5 text-center text-[10px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === today;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[44px] border-b border-r p-1 last:border-r-0",
                !isCurrentMonth && "opacity-30",
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] mx-auto",
                  isToday && "bg-primary text-primary-foreground font-semibold"
                )}
              >
                {day.getDate()}
              </div>
              {/* Event dots */}
              <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    className={cn("h-1.5 w-1.5 rounded-full", COLOR_MAP[ev.color] ?? "bg-primary")}
                    title={ev.title}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
