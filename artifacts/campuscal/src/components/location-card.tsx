import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocationCardProps {
  imageUrl: string;
  location: string;
  country: string;
  href?: string;
  locked?: boolean;
  className?: string;
  onClick?: () => void;
}

const LocationCard = React.forwardRef<HTMLDivElement, LocationCardProps>(
  ({ imageUrl, location, country, href, locked = false, className, onClick }, ref) => {
    const controls = useAnimation();

    const cardVariants = {
      initial: { scale: 1, y: 0 },
      hover: {
        scale: locked ? 1.01 : 1.03,
        y: locked ? -2 : -5,
        transition: { type: "spring", stiffness: 400, damping: 10 },
      },
    };

    const handleClick = () => {
      if (locked) return;
      if (onClick) onClick();
      else if (href) window.location.href = href;
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "w-full max-w-xs overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm",
          locked ? "opacity-70 cursor-not-allowed" : "cursor-pointer",
          className
        )}
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        animate={controls}
        onClick={handleClick}
        role="group"
        aria-labelledby="location-title"
      >
        {/* Image Section */}
        <div className="aspect-[4/3] overflow-hidden relative">
          <img
            src={imageUrl}
            alt={`A view of ${location}`}
            className="h-full w-full object-cover transition-transform duration-300 ease-in-out"
          />
          {locked && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <Lock className="text-white/80 w-6 h-6" />
              <span className="text-white/90 text-sm font-semibold tracking-wide uppercase">
                Coming Soon
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex items-center justify-between p-4">
          <div>
            <h3 id="location-title" className="font-semibold text-card-foreground">
              {location}
            </h3>
            <p className="text-sm text-muted-foreground">{country}</p>
          </div>

          {locked ? (
            <span className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
              Locked
            </span>
          ) : (
            <motion.button
              className="relative flex h-9 w-28 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-medium text-primary-foreground"
              whileTap={{ scale: 0.95 }}
              onClick={handleClick}
            >
              View Events
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }
);

LocationCard.displayName = "LocationCard";

export { LocationCard };
