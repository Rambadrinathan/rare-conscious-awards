export type TouchstoneKind = "cardinal" | "ordinal";

export type Touchstone = {
  key: string;
  number: number;
  name: string;
  kind: TouchstoneKind;
  definition: string;
  prompt: string;
  allowNa: boolean;
};

/** Pinwheel touchstones — source: Pinwheel by RARE */
export const TOUCHSTONES: Touchstone[] = [
  {
    key: "energy",
    number: 1,
    name: "Energy Efficiency",
    kind: "cardinal",
    definition:
      "How your hotel reduces energy use and relies on smarter, cleaner, more efficient systems.",
    prompt:
      "Describe one concrete way your property measures or reduces energy use — lighting, HVAC, renewables, staff habits, or anything real you practise.",
    allowNa: false,
  },
  {
    key: "water",
    number: 2,
    name: "Water Conservation",
    kind: "cardinal",
    definition:
      "How your hotel uses water responsibly, reduces waste, and respects the needs of the destination.",
    prompt:
      "Share your strongest water practice — metering, reuse, linen programmes, landscaping, guest communication, or local water stewardship.",
    allowNa: false,
  },
  {
    key: "waste",
    number: 3,
    name: "Responsible Waste Management",
    kind: "cardinal",
    definition:
      "How your hotel reduces waste, handles it carefully, and prevents harm to people and the environment.",
    prompt:
      "What have you eliminated or improved on waste — single-use items, segregation, food waste, chemicals, or disposal channels?",
    allowNa: false,
  },
  {
    key: "wellbeing",
    number: 4,
    name: "Employee & Guest Health, Safety & Wellbeing",
    kind: "cardinal",
    definition:
      "How your hotel creates a safe, healthy, and respectful environment for staff and guests.",
    prompt:
      "How do you protect and care for people — safety systems, training, hygiene, wellbeing, or dignity at work?",
    allowNa: false,
  },
  {
    key: "inclusivity",
    number: 5,
    name: "Inclusivity",
    kind: "cardinal",
    definition:
      "How your hotel makes people feel respected, welcomed, and considered, regardless of who they are.",
    prompt:
      "How does your property practise fairness, accessibility, or non-discrimination for guests and/or staff?",
    allowNa: false,
  },
  {
    key: "heritage",
    number: 6,
    name: "Heritage Preservation",
    kind: "ordinal",
    definition:
      "How your hotel respects, protects, and meaningfully reflects the cultural identity of its destination.",
    prompt:
      "How do you protect or share tangible or intangible heritage — buildings, craft, foodways, stories — with authenticity rather than decoration?",
    allowNa: true,
  },
  {
    key: "biodiversity",
    number: 7,
    name: "Biodiversity Conservation",
    kind: "ordinal",
    definition:
      "How your hotel protects the natural life around it — plants, animals, habitats, and ecosystems.",
    prompt:
      "What do you do for nature on or near the property — native planting, wildlife protocols, habitat care, or conservation partners?",
    allowNa: true,
  },
  {
    key: "light_footprint",
    number: 8,
    name: "Light Footprint Tourism",
    kind: "ordinal",
    definition:
      "How your hotel encourages discovery that is low-impact, sensitive, and deeply connected to place.",
    prompt:
      "Name one guest experience designed to stay light on the place — walking, cycling, small groups, slow itineraries, or responsible guiding.",
    allowNa: true,
  },
  {
    key: "community",
    number: 9,
    name: "Local Community Engagement",
    kind: "ordinal",
    definition:
      "How your hotel builds fair, respectful, and meaningful relationships with the people of the destination.",
    prompt:
      "How does tourism at your hotel create shared value for local people — employment, sourcing, enterprises, partnerships, or community projects?",
    allowNa: true,
  },
];

/** Provisional award categories — replace when official email copy is locked */
export const AWARD_CATEGORIES = [
  {
    id: "heros_journey_hotel",
    title: "A Hero's Journey — Hotel",
    description:
      "For a RARE property whose responsible practices, as a whole, show a clear journey toward place-sensitive, community-aware hospitality.",
    needsNominee: false,
  },
  {
    id: "heros_journey_individual",
    title: "A Hero's Journey — Individual Crusader",
    description:
      "For a named person at a RARE property who has championed responsible tourism with consistency, care, and measurable effort.",
    needsNominee: true,
  },
] as const;

export type AwardCategoryId = (typeof AWARD_CATEGORIES)[number]["id"];
