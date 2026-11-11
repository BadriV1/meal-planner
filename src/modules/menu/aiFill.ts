import type { HouseholdProfile, MealType } from "@/modules/profile/types";

/**
 * LLM layer of the hybrid engine (stub).
 * Called when the rules layer can't fill a slot (e.g. strict diet + many
 * allergies leave no catalog match). Will call the Claude API with the
 * household profile, favorites, and feedback signals.
 */
export async function aiFillSlot(
  _profile: HouseholdProfile,
  mealType: MealType,
  audience: "adult" | "kid",
): Promise<{ name: string; note: string }> {
  return {
    name: `Suggested ${audience === "kid" ? "kid-friendly " : ""}${mealType}`,
    note: "Prototype placeholder — AI suggestion coming soon",
  };
}
