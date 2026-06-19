// Onsite personalization. Maps a visitor segment to an explainable message/offer.
export type Segment = "new" | "returning" | "cart_abandoner" | "vip";
export interface Personalization { segment: Segment; headline: string; offer: string; cta: string; reasoning: string; }

const RULES: Record<Segment, Omit<Personalization, "segment">> = {
  new: { headline: "Welcome — first order ships free", offer: "Free shipping on your first order", cta: "Start shopping",
    reasoning: "No prior visits: reduce first-purchase friction with a low-cost shipping incentive." },
  returning: { headline: "Picking up where you left off", offer: "Curated picks based on your browsing", cta: "See your picks",
    reasoning: "Known visitor with history: personalized merchandising beats blanket discounts and protects margin." },
  cart_abandoner: { headline: "Your cart is waiting", offer: "10% off if you complete checkout today", cta: "Complete my order",
    reasoning: "High purchase intent but stalled: a time-boxed incentive recovers the cart without training discount-seeking." },
  vip: { headline: "Early access, just for you", offer: "VIP early access + loyalty points", cta: "Shop the drop",
    reasoning: "High-LTV customer: reward with status/access rather than discounts to preserve margin and loyalty." },
};

export function personalize(segment: Segment): Personalization {
  return { segment, ...RULES[segment] };
}
