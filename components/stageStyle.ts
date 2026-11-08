import type { Stage } from "@/lib/types";

/* Each stage's colours, written out in full so Tailwind finds the class names */
export const STAGE_STYLE: Record<Stage, { text: string; soft: string; border: string; edge: string; dot: string }> = {
  saved: { text: "text-saved", soft: "bg-saved-soft", border: "border-saved", edge: "border-l-saved", dot: "bg-saved" },
  applied: { text: "text-applied", soft: "bg-applied-soft", border: "border-applied", edge: "border-l-applied", dot: "bg-applied" },
  interview: { text: "text-interview", soft: "bg-interview-soft", border: "border-interview", edge: "border-l-interview", dot: "bg-interview" },
  offer: { text: "text-offer", soft: "bg-offer-soft", border: "border-offer", edge: "border-l-offer", dot: "bg-offer" },
  closed: { text: "text-closed", soft: "bg-closed-soft", border: "border-closed", edge: "border-l-closed", dot: "bg-closed" },
};
