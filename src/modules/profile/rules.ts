import type { Allergen, DietType, FoodCategory, Member, MemberType } from "./types";

export const DIET_OPTIONS: { id: DietType; label: string; eats: string; avoids: string }[] = [
  { id: "vegan", label: "Vegan", eats: "Plants only", avoids: "Meat, fish, eggs, dairy" },
  { id: "lacto_vegetarian", label: "Lacto-vegetarian", eats: "Dairy", avoids: "Meat, fish, eggs" },
  { id: "ovo_vegetarian", label: "Ovo-vegetarian", eats: "Eggs", avoids: "Meat, fish, dairy" },
  { id: "lacto_ovo_vegetarian", label: "Lacto-ovo vegetarian", eats: "Dairy + eggs", avoids: "Meat, fish" },
  { id: "pescatarian", label: "Pescatarian", eats: "Vegetarian + fish/seafood", avoids: "Meat, poultry" },
  { id: "non_vegetarian", label: "Non-vegetarian", eats: "Everything", avoids: "—" },
];

const ANIMAL: FoodCategory[] = ["meat", "poultry", "fish", "shellfish"];

/** Hard rule: categories each diet excludes. */
export const DIET_EXCLUDES: Record<DietType, FoodCategory[]> = {
  vegan: [...ANIMAL, "egg", "dairy"],
  lacto_vegetarian: [...ANIMAL, "egg"],
  ovo_vegetarian: [...ANIMAL, "dairy"],
  lacto_ovo_vegetarian: ANIMAL,
  pescatarian: ["meat", "poultry"],
  non_vegetarian: [],
};

export const ALLERGEN_OPTIONS: { id: Allergen; label: string }[] = [
  { id: "milk", label: "Milk" },
  { id: "eggs", label: "Eggs" },
  { id: "peanuts", label: "Peanuts" },
  { id: "tree_nuts", label: "Tree nuts" },
  { id: "wheat", label: "Wheat/Gluten" },
  { id: "soy", label: "Soy" },
  { id: "sesame", label: "Sesame" },
  { id: "fish", label: "Fish" },
  { id: "shellfish", label: "Shellfish" },
];

export const SKIP_SUGGESTIONS = ["Mushrooms", "Onion/Garlic", "Eggplant", "Spicy food"];

/** Diet categories that rely on an allergen → shown as a conflict notice. */
const ALLERGEN_TO_CATEGORY: Partial<Record<Allergen, FoodCategory>> = {
  milk: "dairy",
  eggs: "egg",
  fish: "fish",
  shellfish: "shellfish",
};

export function dietAllergenConflicts(diet: DietType, allergies: Allergen[]): string[] {
  const label = DIET_OPTIONS.find((d) => d.id === diet)!.label.toLowerCase();
  if (diet === "non_vegetarian") return [];
  return allergies
    .filter((a) => {
      const cat = ALLERGEN_TO_CATEGORY[a];
      return cat && !DIET_EXCLUDES[diet].includes(cat);
    })
    .map((a) => {
      const name = ALLERGEN_OPTIONS.find((o) => o.id === a)!.label;
      return `${name} is part of ${label}. We'll swap in ${name.toLowerCase()}-free options.`;
    });
}

export const MEMBER_LABEL: Record<MemberType, string> = {
  adult: "Adult",
  toddler: "Toddler",
  kid: "Kid",
  teen: "Teen",
};

export const MEMBER_AGES: Record<Exclude<MemberType, "adult">, string> = {
  toddler: "1–4",
  kid: "5–12",
  teen: "13–17",
};

export const hasKids = (members: Member[]) => members.some((m) => m.type !== "adult");

/** Youngest age group drives the Kids column for beta. */
export function youngestKidType(members: Member[]): Exclude<MemberType, "adult"> | null {
  for (const t of ["toddler", "kid", "teen"] as const) {
    if (members.some((m) => m.type === t)) return t;
  }
  return null;
}
