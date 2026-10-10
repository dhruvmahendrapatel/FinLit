import type { Reward } from "../types";

/**
 * Rewards marketplace seed. Partner rewards earn a commission; parent-fulfilled rewards cost
 * nothing and keep the loop going for families who prefer experiences over things.
 */
export const REWARDS: readonly Reward[] = [
  { id: "r_movie_night", title: "Family movie night (you pick!)", emoji: "🍿", category: "family", pricePaise: 150_00, partner: "Home", fulfilledByParent: true, premiumOnly: false, blurb: "Choose the film and the snacks for Friday night." },
  { id: "r_extra_screen", title: "30 min extra game time", emoji: "🎮", category: "family", pricePaise: 80_00, partner: "Home", fulfilledByParent: true, premiumOnly: false, blurb: "One-time pass, parent approved." },
  { id: "r_ice_cream", title: "Ice-cream outing", emoji: "🍨", category: "treats", pricePaise: 120_00, partner: "Home", fulfilledByParent: true, premiumOnly: false, blurb: "Any flavour, any topping." },
  { id: "r_storybook", title: "Pratham storybook pack", emoji: "📚", category: "books", pricePaise: 299_00, partner: "Pratham Books", fulfilledByParent: false, premiumOnly: false, blurb: "Three illustrated books in English or Hindi, delivered." },
  { id: "r_amar_chitra", title: "Amar Chitra Katha bundle", emoji: "🦸", category: "books", pricePaise: 449_00, partner: "ACK", fulfilledByParent: false, premiumOnly: false, blurb: "Five classic comics, delivered to your door." },
  { id: "r_art_kit", title: "Camlin art kit", emoji: "🎨", category: "learning", pricePaise: 399_00, partner: "Camlin", fulfilledByParent: false, premiumOnly: false, blurb: "Colours, brushes and a sketchbook." },
  { id: "r_science_kit", title: "Smartivity STEM kit", emoji: "🔬", category: "learning", pricePaise: 899_00, partner: "Smartivity", fulfilledByParent: false, premiumOnly: true, blurb: "Build a working mechanical model. Premium exclusive." },
  { id: "r_zoo_tickets", title: "Zoo day for two", emoji: "🦁", category: "experiences", pricePaise: 250_00, partner: "City Zoo", fulfilledByParent: false, premiumOnly: false, blurb: "Two tickets, any weekend." },
  { id: "r_cricket_coaching", title: "Cricket coaching trial class", emoji: "🏏", category: "experiences", pricePaise: 500_00, partner: "Local Academy", fulfilledByParent: false, premiumOnly: true, blurb: "One trial session at a partner academy. Premium exclusive." },
  { id: "r_donate_meals", title: "Donate 10 meals", emoji: "🍛", category: "family", pricePaise: 100_00, partner: "Akshaya Patra", fulfilledByParent: false, premiumOnly: false, blurb: "Paid from your Share jar. Get a thank-you certificate.", payFromJar: "share" },
];
