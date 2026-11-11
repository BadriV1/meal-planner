import type { ComponentType } from "react";
import type { HouseholdProfile } from "@/modules/profile/types";
import { Welcome } from "./steps/Welcome";
import { Household } from "./steps/Household";
import { FoodRules } from "./steps/FoodRules";
import { FavoriteMeals } from "./steps/FavoriteMeals";
import { SampleMonday } from "./steps/SampleMonday";

/**
 * Onboarding is driven entirely by this registry.
 * To add, remove or reorder a step, edit this array — the flow logic
 * (progress, back/next, validation, resume) doesn't change.
 */
export interface StepProps {
  /** Lets a step override the shell's Next button (e.g. Sample Monday "Done"). */
  registerFinish?: (fn: () => void) => void;
}

export interface OnboardingStep {
  id: string;
  title: string;
  component: ComponentType<StepProps>;
  /** Return an error message to block Next, or null when valid. */
  validate?: (p: HouseholdProfile) => string | null;
  nextLabel?: string;
}

export const STEPS: OnboardingStep[] = [
  { id: "welcome", title: "Welcome", component: Welcome, nextLabel: "Get started" },
  {
    id: "household",
    title: "Household",
    component: Household,
    validate: (p) => (p.members.some((m) => m.type === "adult") ? null : "Add at least 1 adult"),
    nextLabel: "Looks right",
  },
  { id: "food-rules", title: "Food rules", component: FoodRules },
  { id: "favorites", title: "Favorite meals", component: FavoriteMeals },
  { id: "sample-monday", title: "Sample Monday", component: SampleMonday, nextLabel: "Done" },
];
