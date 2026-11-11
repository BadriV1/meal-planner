import type { MealType } from "@/modules/profile/types";

/** Settings live outside onboarding; these are the agreed beta defaults. */
export interface CookingTime {
  breakfastLunch: number; // combined block, minutes
  snack: number;
  dinner: number;
}

export interface AppSettings {
  meals: MealType[];
  days: number;
  cookingTime: { weekday: CookingTime; weekend: CookingTime };
  equipment: string[];
  batchCookMainMeals: boolean;
  snacksAllowBatch: boolean;
  menuArrives: { day: string; time: string };
  groceryDay: string;
}

export const COOKING_TIME_OPTIONS = {
  breakfastLunch: [15, 30, 45, 60, 90],
  snack: [10, 15, 30],
  dinner: [15, 30, 45, 60, 90],
};

export const DEFAULT_SETTINGS: AppSettings = {
  meals: ["breakfast", "lunch", "snack", "dinner"],
  days: 7,
  cookingTime: {
    weekday: { breakfastLunch: 30, snack: 10, dinner: 30 },
    weekend: { breakfastLunch: 60, snack: 10, dinner: 60 },
  },
  equipment: ["Stovetop", "Oven"],
  batchCookMainMeals: false,
  snacksAllowBatch: true,
  menuArrives: { day: "Saturday", time: "9:00 AM" },
  groceryDay: "Sunday",
};
