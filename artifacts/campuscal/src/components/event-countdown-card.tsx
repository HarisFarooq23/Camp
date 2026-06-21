import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { Calendar, Clock, Users, MapPin, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverBody,
} from "@/components/ui/popover";

interface EventCountdownCardProps {
  title?: string;
  date?: Date;
  image?: string;
  attendees?: number;
  venue?: string;
  host?: string;
  joinUrl?: string;
  onJoin?: () => void;
  onAddToCalendar?: () => void;
  enableAnimations?: boolean;
  className?: string;
}

function buildGoogleCalendarUrl(title: string, date: Date, venue?: string) {
  const start = date.toISOString().replace(/-|:|\.\d+/g, "");
  const end = new Date(date.getTime() + 2 * 3600 * 1000)
    .toISOString()
    .replace(/-|:|\.\d+/g, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}${venue ? `&location=${encodeURIComponent(venue)}` : ""}`;
}

function buildAppleCalendarUrl(title: string, date: Date, venue?: string) {
  const start = date.toISOString().replace(/-|:|\.\d+/g, "");
  const end = new Date(date.getTime() + 2 * 3600 * 1000)
    .toISOString()
    .replace(/-|:|\.\d+/g, "");
  return `webcal://calendar.google.com/calendar/ical?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}${venue ? `&location=${encodeURIComponent(venue)}` : ""}`;
}

function CalendarPopover({
  title,
  date,
  venue,
  trigger,
}: {
  title: string;
  date: Date;
  venue?: string;
  trigger: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Add to Calendar</PopoverTitle>
          <PopoverDescription>Choose your calendar app</PopoverDescription>
        </PopoverHeader>
        <PopoverBody className="flex flex-col gap-2">
          <a
            href={buildGoogleCalendarUrl(title, date, venue)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-start gap-2 h-10"
            )}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none">
              <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z" fill="#4285F4"/>
              <path d="M16.5 3h-9v4.5h9V3z" fill="#EA4335"/>
              <path d="M4.5 16.5h15V21h-15v-4.5z" fill="#34A853"/>
              <path d="M3 4.5v12h4.5v-12H3z" fill="#FBBC05"/>
            </svg>
            Google Calendar
          </a>
          <a
            href={buildAppleCalendarUrl(title, date, venue)}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full justify-start gap-2 h-10"
            )}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple Calendar
          </a>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export function EventCountdownCard({
  title = "React & AI Workshop",
  date,
  image = "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop",
  attendees = 42,
  venue,
  host,
  joinUrl,
  onJoin,
  onAddToCalendar,
  enableAnimations = true,
  className,
}: EventCountdownCardProps) {
  const [eventDate] = useState(
    () => date || new Date(Date.now() + 2 * 24 * 3600 * 1000 + 5 * 3600 * 1000 + 30 * 60 * 1000)
  );
  const [timeLeft, setTimeLeft] = useState(() => {
    const targetDate = date || eventDate;
    return Math.max(0, Math.floor((+targetDate - Date.now()) / 1000));
  });
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  useEffect(() => {
    const targetDate = date || eventDate;
    const update = () => {
      const remaining = Math.max(0, Math.floor((+targetDate - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [date, eventDate]);

  const getTimeUnits = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return { days, hours, minutes, seconds: secs };
  };

  const { days, hours, minutes, seconds } = getTimeUnits(timeLeft);

  const containerVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)" },
    visible: {
      opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
      transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8, staggerChildren: 0.08, delayChildren: 0.1 },
    },
    hover: shouldAnimate
      ? { scale: 1.03, y: -6, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 } }
      : {},
  };

  const numberVariants = {
    initial: { scale: 1, opacity: 1 },
    pulse: shouldAnimate
      ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1], transition: { duration: 1, repeat: Infinity, ease: "easeInOut" } }
      : {},
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.6 } },
  };

  const buttonMotionVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25, mass: 0.7 } },
    hover: shouldAnimate ? { scale: 1.05, y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } } : {},
    tap: shouldAnimate ? { scale: 0.95 } : {},
  };

  const handleJoin = () => {
    if (joinUrl) {
      window.open(joinUrl, "_blank");
    } else if (onJoin) {
      onJoin();
    }
  };

  const calendarTrigger = (
    <motion.button
      variants={buttonMotionVariants}
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      className={cn(buttonVariants({ variant: "outline" }), "flex-1 h-10 text-sm font-medium")}
    >
      + Calendar
    </motion.button>
  );

  return (
    <motion.div
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
      whileHover="hover"
      variants={containerVariants}
      className={cn(
        "relative w-80 rounded-2xl border border-border/50 bg-card text-card-foreground overflow-hidden",
        "shadow-lg shadow-black/5 cursor-pointer group",
        className
      )}
    >
      {/* Image */}
      <motion.div className="relative overflow-hidden" variants={shouldAnimate ? childVariants : {}}>
        <motion.img
          src={image}
          alt={title}
          className="h-48 w-full object-cover"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {timeLeft > 0 && timeLeft < 86400 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"
          >
            Starts Soon!
          </motion.div>
        )}
      </motion.div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <motion.div className="space-y-2" variants={shouldAnimate ? childVariants : {}}>
          <motion.h3
            className="text-xl font-bold leading-tight tracking-tight"
            initial={{ opacity: 0.9 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {title}
          </motion.h3>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{(date || eventDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{(date || eventDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{attendees} attending</span>
            </div>
          </div>

          {(venue || host) && (
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {venue && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{venue}</span>
                </div>
              )}
              {host && (
                <div className="flex items-center gap-1">
                  <UserCircle2 className="w-4 h-4" />
                  <span>{host}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Countdown */}
        {timeLeft > 0 ? (
          <motion.div className="space-y-3" variants={shouldAnimate ? childVariants : {}}>
            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Event starts in:</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: days, label: "Days" },
                { value: hours, label: "Hours" },
                { value: minutes, label: "Min" },
                { value: seconds, label: "Sec" },
              ].map((unit, index) => (
                <motion.div
                  key={unit.label}
                  variants={index === 3 ? numberVariants : {}}
                  initial="initial"
                  animate={index === 3 ? "pulse" : "initial"}
                  className="bg-muted/50 rounded-xl p-3 text-center border border-border/30"
                >
                  <div className="text-lg font-bold tabular-nums">
                    {unit.value.toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">{unit.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div variants={shouldAnimate ? childVariants : {}} className="text-center py-2">
            <div className="text-lg font-bold text-green-600">Event Started!</div>
            <div className="text-sm text-muted-foreground">Join now to participate</div>
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <CalendarPopover
            title={title}
            date={date || eventDate}
            venue={venue}
            trigger={calendarTrigger}
          />
          <motion.button
            onClick={handleJoin}
            variants={buttonMotionVariants}
            initial={shouldAnimate ? "hidden" : "visible"}
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            className={cn(
              buttonVariants({ variant: "default" }),
              "flex-1 h-10 font-medium bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25"
            )}
          >
            {timeLeft > 0 ? "Reserve Spot" : "Join Event"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
