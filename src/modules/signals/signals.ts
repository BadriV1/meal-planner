import { storage } from "@/core/storage";
import type { CatalogMeal } from "@/modules/catalog/meals";

/**
 * Feedback signals that train recommendations.
 * Each 👍/👎 is stored with the meal's attributes and audience so the engine
 * learns patterns (cuisine, main ingredient, prep time), not single dishes.
 */
export interface Signal {
  mealId: string;
  audience: "adult" | "kid";
  verdict: "up" | "down";
  source: "onboarding_sample";
  attributes: { cuisine: string; main: string; prepMinutes: number; mealType: string };
  at: string;
}

const KEY = "signals";

export function recordSignals(
  ratings: { meal: CatalogMeal; audience: "adult" | "kid"; verdict: "up" | "down" }[],
) {
  const existing = storage.get<Signal[]>(KEY, []);
  const now = new Date().toISOString();
  const next = ratings.map<Signal>((r) => ({
    mealId: r.meal.id,
    audience: r.audience,
    verdict: r.verdict,
    source: "onboarding_sample",
    attributes: {
      cuisine: r.meal.cuisine,
      main: r.meal.main,
      prepMinutes: r.meal.prepMinutes,
      mealType: r.meal.mealType,
    },
    at: now,
  }));
  storage.set(KEY, [...existing, ...next]);
}

export const getSignals = () => storage.get<Signal[]>(KEY, []);
