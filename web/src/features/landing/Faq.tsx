import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion.tsx";
import { FadeUp } from "../../components/motion/index.ts";
import { Section } from "./Section.tsx";
import { FAQ } from "./content.ts";

// FAQ: a single-open accordion of parody Q&A. The Accordion primitive animates
// expand/collapse (reduced-motion handling lives in the primitive's CSS).
export function Faq() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Questions you'll stop asking once the revenue lands"
      className="!py-20"
      containerClassName="max-w-3xl"
    >
      <FadeUp>
        <Accordion
          type="single"
          collapsible
          defaultValue={FAQ[0].question}
          className="w-full"
        >
          {FAQ.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger className="text-left text-base text-foreground">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </FadeUp>
    </Section>
  );
}
