import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, AtSign, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SubscribeFormProps extends React.HTMLAttributes<HTMLDivElement> {
  campusName?: string;
  image?: string;
  onSubscribe: (email: string) => void;
  isSubmitting?: boolean;
}

const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" } },
};

export const SubscribeForm = React.forwardRef<HTMLDivElement, SubscribeFormProps>(
  ({ className, campusName = "GIKI", image, onSubscribe, isSubmitting = false, ...props }, ref) => {
    const [email, setEmail] = React.useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubscribe(email);
    };

    return (
      <motion.div
        initial="hidden"
        animate="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.15 } },
        }}
        className={cn(
          "w-full max-w-md overflow-hidden rounded-2xl border border-foreground/40 bg-background/60 shadow-lg backdrop-blur-lg",
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Campus hero image */}
        {image && (
          <motion.div variants={FADE_UP}>
            <img
              src={image}
              alt={`${campusName} campus`}
              className="h-48 w-full object-cover"
            />
          </motion.div>
        )}

        <div className="space-y-6 p-8 text-center">
          <motion.div variants={FADE_UP} className="space-y-2">
            <h1 className="font-bold text-2xl text-foreground">Stay in the Loop</h1>
            <p className="text-muted-foreground">
              Get weekly emails of upcoming events, meets &amp; sessions at{" "}
              <span className="font-semibold text-foreground">{campusName}</span>.
            </p>
          </motion.div>

          {/* Subscriber identity row — mirrors the avatar row from OnboardingForm */}
          <motion.div
            variants={FADE_UP}
            className="flex items-center justify-between rounded-lg border bg-background/50 p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={undefined} alt="Subscriber" />
                <AvatarFallback>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium text-sm text-foreground">Weekly digest</p>
                <p className="text-xs text-muted-foreground">Hot events every Monday</p>
              </div>
            </div>
            <span className="text-xs text-primary font-semibold border border-primary/30 rounded-full px-3 py-1">
              Free
            </span>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={FADE_UP}>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@gmail.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={FADE_UP}>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Subscribe for Updates
              </Button>
            </motion.div>
          </form>

          <motion.p variants={FADE_UP} className="text-xs text-muted-foreground">
            No spam. Unsubscribe any time.
          </motion.p>
        </div>
      </motion.div>
    );
  }
);

SubscribeForm.displayName = "SubscribeForm";
