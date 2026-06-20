import { Avatar, AvatarFallback } from "../../components/ui/avatar.tsx";
import { FadeUp, Stagger } from "../../components/motion/index.ts";
import { Section } from "./Section.tsx";
import { TESTIMONIALS } from "./content.ts";

// Parody testimonials: each card has a quote, a generated initial-avatar (no
// external image), an absurd title, and a fictional company. Cards stagger in on
// scroll.
export function Testimonials() {
  return (
    <Section
      eyebrow="Loved by visionaries"
      title="Industry leaders who fired their judgment"
      lede="Real quotes from fictional executives who have fully embraced post-human productivity."
    >
      <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {TESTIMONIALS.map((t) => (
          <FadeUp
            key={t.name}
            className="flex flex-col rounded-2xl border bg-card/60 p-6"
          >
            <blockquote className="flex-1 text-pretty text-base leading-relaxed text-foreground">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary/15 text-primary">
                  {t.initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-muted-foreground">
                  {t.title}, {t.company}
                </p>
              </div>
            </div>
          </FadeUp>
        ))}
      </Stagger>
    </Section>
  );
}
