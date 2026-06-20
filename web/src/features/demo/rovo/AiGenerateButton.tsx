import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/button.tsx";

// The "✨ AI-generate" sparkle button used in the issue detail to fill the
// summary / description with scripted buzzword-bloat text (see docs/changes/0007
// › AI-generate buttons). A thin presentational wrapper around the design-system
// Button so the description/comment slots stay declarative; the actual fill is a
// store action the caller wires to `onGenerate`.
//
// CONTRAST: uses the design-system `outline` variant (foreground text on the
// theme's panel/background — AA in the Jira theme), with the primary-tinted
// border to read as an AI affordance. No hardcoded text-on-color is introduced;
// focus ring + disabled come from the Button primitive.

export interface AiGenerateButtonProps {
  // Accessible label, e.g. "AI-generate description".
  label: string;
  // Visible text (kept short for the dense detail header), e.g. "AI generate".
  children: ReactNode;
  onGenerate: () => void;
}

export function AiGenerateButton({
  label,
  children,
  onGenerate,
}: AiGenerateButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onGenerate}
      aria-label={label}
      data-testid="ai-generate"
      className="h-7 gap-1.5 border-primary/30 px-2 text-xs font-medium text-primary"
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </Button>
  );
}
