import { CATALOG, type CatalogMeal } from "@/modules/catalog/meals";
import { DIET_EXCLUDES, youngestKidType } from "@/modules/profile/rules";
import type { HouseholdProfile, MealType } from "@/modules/profile/types";
import type { CookingTime } from "@/modules/settings/defaults";

/**
 * Rules layer of the hybrid engine.
 * Hard rules: diet type + allergies (never broken).
 * Soft rules: foods to skip (excluded from generated picks, but explicit
 * favorites may still include them), cooking time, kid/toddler suitability.
 * Ranking: favorites first. Gaps are handed to aiFill (LLM) later.
 */

export type Audience = "adult" | "kid";

export function passesHardRules(meal: CatalogMeal, p: HouseholdProfile): boolean {
  const excluded = DIET_EXCLUDES[p.diet];
  if (meal.contains.some((c) => excluded.includes(c))) return false;
  if (meal.allergens.some((a) => p.allergies.includes(a))) return false;
  const others = p.otherAllergies.map((o) => o.toLowerCase());
  if (others.some((o) => o && (meal.name.toLowerCase().includes(o) || meal.main.toLowerCase().includes(o))))
    return false;
  return true;
}

function hitsSkip(meal: CatalogMeal, p: HouseholdProfile): boolean {
  const text = `${meal.name} ${meal.main}`.toLowerCase();
  return p.foodsToSkip.some((s) => {
    const first = s.toLowerCase().split("/")[0].trim();
    return first && text.includes(first);
  });
}

export function suitsAudience(meal: CatalogMeal, audience: Audience, p: HouseholdProfile): boolean {
  if (audience === "adult") return true;
  const youngest = youngestKidType(p.members);
  if (youngest === "toddler") return meal.toddlerFriendly;
  return meal.kidFriendly;
}

/** Meals the household can eat at all (used to build the favorites picker). */
export function allowedMeals(p: HouseholdProfile, mealType?: MealType): CatalogMeal[] {
  return CATALOG.filter((m) => (!mealType || m.mealType === mealType) && passesHardRules(m, p));
}

export function candidates(p: HouseholdProfile, mealType: MealType, audience: Audience, maxMinutes: number) {
  const favs = new Set(p.favoriteMealIds);
  return allowedMeals(p, mealType)
    .filter((m) => suitsAudience(m, audience, p))
    .filter((m) => favs.has(m.id) || !hitsSkip(m, p))
    .filter((m) => m.prepMinutes <= maxMinutes)
    .sort((a, b) => Number(favs.has(b.id)) - Number(favs.has(a.id)) || a.prepMinutes - b.prepMinutes);
}

export interface DayPlan {
  adult: Partial<Record<MealType, CatalogMeal>>;
  kid: Partial<Record<MealType, CatalogMeal>> | null;
}

/** Pick one day's meals within a cooking-time budget. `seed` rotates choices. */
export function planDay(p: HouseholdProfile, time: CookingTime, withKids: boolean, seed = 0): DayPlan {
  const pick = <T,>(arr: T[], offset = 0): T | undefined => arr[(seed + offset) % Math.max(arr.length, 1)];

  const column = (audience: Audience, shareFrom?: DayPlan["adult"]) => {
    const out: Partial<Record<MealType, CatalogMeal>> = {};
    // Breakfast + lunch share one combined block.
    const bf = pick(candidates(p, "breakfast", audience, time.breakfastLunch - 5), audience === "kid" ? 1 : 0);
    if (bf) out.breakfast = bf;
    const lunchBudget = time.breakfastLunch - (bf?.prepMinutes ?? 0);
    const lunch = pick(candidates(p, "lunch", audience, lunchBudget), audience === "kid" ? 1 : 0);
    if (lunch) out.lunch = lunch;
    const snack = pick(candidates(p, "snack", audience, time.snack), audience === "kid" ? 1 : 0);
    if (snack) out.snack = snack;
    // Busy families often cook one dinner: reuse the adult dinner if it suits kids.
    const shared = shareFrom?.dinner;
    if (shared && suitsAudience(shared, audience, p)) out.dinner = shared;
    else {
      const d = pick(candidates(p, "dinner", audience, time.dinner));
      if (d) out.dinner = d;
    }
    return out;
  };

  const adult = column("adult");
  return { adult, kid: withKids ? column("kid", adult) : null };
}
